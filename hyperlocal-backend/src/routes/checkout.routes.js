import { Router } from 'express';
import { z } from 'zod';
import { CartModel } from '../models/Cart.js';
import { CartItemModel } from '../models/CartItem.js';
import { OrderModel } from '../models/Order.js';
import { ProductModel } from '../models/Product.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { PaymentModel } from '../models/Payment.js';

export function createCheckoutRouter(inventoryGateway) {
  const checkoutRouter = Router();
  checkoutRouter.use(requireAuth, requireRole('CUSTOMER'));

  const checkoutSchema = z.object({
    pickupSlot: z.string().datetime().optional(),
    deliveryDetails: z.object({
      name: z.string(),
      phone: z.string(),
      email: z.string().email(),
      address: z.string(),
      lat: z.number(),
      lng: z.number()
    }).optional()
  });

  checkoutRouter.post('/', async (req, res) => {
    const parsed = checkoutSchema.safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid body' });

    const customerId = req.user.sub;
    const cart = await CartModel.findOne({ customerId });
    if (!cart) return res.status(400).json({ success: false, message: 'Cart is empty' });

    const cartItems = await CartItemModel.find({ cartId: cart.id });
    if (!cartItems.length) return res.status(400).json({ success: false, message: 'Cart is empty' });

    const productIds = [...new Set(cartItems.map((i) => i.productId))];
    const products = await ProductModel.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const firstProduct = productMap.get(cartItems[0].productId);
    if (!firstProduct) return res.status(400).json({ success: false, message: 'Cart has invalid products' });

    const shopId = firstProduct.shopId;
    for (const ci of cartItems) {
      const p = productMap.get(ci.productId);
      if (!p) return res.status(400).json({ success: false, message: 'Cart has invalid products' });
      if (p.shopId !== shopId) {
        return res.status(400).json({ success: false, message: 'Cart must contain items from a single shop' });
      }
      if (p.stock < ci.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${p.sku}` });
      }
    }

    const pickupSlot = parsed.data.pickupSlot ? new Date(parsed.data.pickupSlot) : null;

    const total = cartItems.reduce((sum, ci) => {
      const p = productMap.get(ci.productId);
      return sum + Number(p.price) * ci.quantity;
    }, 0);

    const rolledBack = [];

    try {
      for (const ci of cartItems) {
        const p = productMap.get(ci.productId);
        const updated = await ProductModel.findOneAndUpdate(
          { _id: p.id, stock: { $gte: ci.quantity } },
          { $inc: { stock: -ci.quantity } },
          { new: true }
        );
        if (!updated) {
          throw new Error(`INSUFFICIENT:${p.sku}`);
        }
        rolledBack.push({ id: p.id, qty: ci.quantity });
        inventoryGateway.broadcastStockUpdate(shopId, p.sku, updated.stock);
      }

      const order = await OrderModel.create({
        customerId,
        shopId,
        status: 'PENDING_PAYMENT',
        pickupSlot,
        deliveryDetails: parsed.data.deliveryDetails || null,
        totalAmount: total.toFixed(2),
        items: cartItems.map((ci) => {
          const p = productMap.get(ci.productId);
          return {
            productId: p.id,
            sku: p.sku,
            name: p.name,
            price: p.price,
            quantity: ci.quantity
          };
        })
      });

      await CartItemModel.deleteMany({ cartId: cart.id });

      return res.status(201).json({ success: true, order: { id: order.id, status: 'PENDING_PAYMENT' } });
    } catch (err) {
      for (const rb of rolledBack.reverse()) {
        await ProductModel.updateOne({ _id: rb.id }, { $inc: { stock: rb.qty } });
      }
      const msg =
        err instanceof Error && err.message.startsWith('INSUFFICIENT:')
          ? `Insufficient stock for ${err.message.split(':')[1]}`
          : 'Checkout failed';
      return res.status(400).json({ success: false, message: msg });
    }
  });

  const confirmSchema = z.object({
    orderId: z.string().uuid(),
    method: z.enum(['UPI', 'CARD', 'NETBANKING', 'COD']).optional()
  });

  checkoutRouter.post('/payments/mock/confirm', async (req, res) => {
    const parsed = confirmSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid body' });

    const order = await OrderModel.findOne({ _id: parsed.data.orderId, customerId: req.user.sub });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'PENDING_PAYMENT') {
      return res.status(400).json({ success: false, message: 'Order not in payable state' });
    }

    const payment = await PaymentModel.create({
      orderId: order.id,
      customerId: req.user.sub,
      amount: order.totalAmount,
      status: 'COMPLETED',
      method: parsed.data.method ?? 'UPI'
    });

    order.status = parsed.data.method === 'COD' ? 'PLACED' : 'PAID';
    order.paymentId = payment.id;
    order.paymentMethod = parsed.data.method ?? 'UPI';
    await order.save();

    return res.json({
      success: true,
      order: { id: order.id, status: order.status, method: order.paymentMethod }
    });
  });

  checkoutRouter.post('/payments/razorpay/create', async (req, res) => {
    const { orderId } = req.body;
    const order = await OrderModel.findOne({ _id: orderId, customerId: req.user.sub });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(Number(order.totalAmount) * 100), // amount in the smallest currency unit
      currency: "INR",
      receipt: `order_rcptid_${order.id.substring(0, 10)}`,
    };

    try {
      const razorpayOrder = await razorpay.orders.create(options);
      
      // Update order and create payment record
      await PaymentModel.create({
        orderId: order.id,
        customerId: req.user.sub,
        razorpayOrderId: razorpayOrder.id,
        amount: order.totalAmount,
        status: 'PENDING',
        method: 'RAZORPAY'
      });

      return res.json({ 
        success: true, 
        razorpayOrder,
        key_id: process.env.RAZORPAY_KEY_ID
      });
    } catch (error) {
      console.error("Razorpay Order Creation Error:", error);
      return res.status(500).json({ success: false, message: 'Failed to create Razorpay order' });
    }
  });

  checkoutRouter.post('/payments/razorpay/verify', async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      const order = await OrderModel.findOne({ _id: orderId, customerId: req.user.sub });
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      const payment = await PaymentModel.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { 
          razorpayPaymentId: razorpay_payment_id, 
          razorpaySignature: razorpay_signature,
          status: 'COMPLETED',
          method: 'RAZORPAY'
        },
        { new: true }
      );

      order.status = 'PAID';
      order.paymentId = payment?.id;
      order.paymentMethod = 'RAZORPAY';
      await order.save();

      return res.json({ success: true, message: "Payment verified successfully" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }
  });

  checkoutRouter.get('/orders', async (req, res) => {
    const orders = await OrderModel.find({ customerId: req.user.sub }).sort({ createdAt: -1 });
    return res.json({ success: true, orders: orders.map(o => o.toJSON()) });
  });

  checkoutRouter.get('/orders/:id', async (req, res) => {
    const order = await OrderModel.findOne({ _id: req.params.id, customerId: req.user.sub });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    return res.json({ success: true, order: order.toJSON() });
  });

  return checkoutRouter;
}
