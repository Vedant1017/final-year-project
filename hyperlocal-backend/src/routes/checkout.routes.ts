import { Router } from 'express';
import { z } from 'zod';
import { In } from 'typeorm';
import { AppDataSource } from '../db/dataSource';
import { Cart } from '../entities/Cart';
import { CartItem } from '../entities/CartItem';
import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { Product } from '../entities/Product';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { InventoryGateway } from '../inventory.gateway';
import type { AuthedRequest } from '../middleware/requireAuth';

export function createCheckoutRouter(inventoryGateway: InventoryGateway) {
  const checkoutRouter = Router();
  checkoutRouter.use(requireAuth, requireRole('CUSTOMER'));

  const checkoutSchema = z.object({
    pickupSlot: z.string().datetime().optional()
  });

  checkoutRouter.post('/', async (req: AuthedRequest, res) => {
    const parsed = checkoutSchema.safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid body' });

    const customerId = req.user!.sub;
    const cartRepo = AppDataSource.getRepository(Cart);
    const cart = await cartRepo.findOne({ where: { customerId } });
    if (!cart) return res.status(400).json({ success: false, message: 'Cart is empty' });

    const cartItemRepo = AppDataSource.getRepository(CartItem);
    const cartItems = await cartItemRepo.find({ where: { cartId: cart.id } });
    if (!cartItems.length) return res.status(400).json({ success: false, message: 'Cart is empty' });

    const productRepo = AppDataSource.getRepository(Product);
    const productIds = [...new Set(cartItems.map((i) => i.productId))];
    const products = await productRepo.find({ where: { id: In(productIds) } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const firstProduct = productMap.get(cartItems[0].productId);
    if (!firstProduct) return res.status(400).json({ success: false, message: 'Cart has invalid products' });

    // Simple rule for MVP: one shop per order (enforced by using the first item shopId)
    const shopId = firstProduct.shopId;
    for (const ci of cartItems) {
      const p = productMap.get(ci.productId);
      if (!p) return res.status(400).json({ success: false, message: 'Cart has invalid products' });
      if (p.shopId !== shopId) return res.status(400).json({ success: false, message: 'Cart must contain items from a single shop' });
      if (p.stock < ci.quantity) return res.status(400).json({ success: false, message: `Insufficient stock for ${p.sku}` });
    }

    const pickupSlot = parsed.data.pickupSlot ? new Date(parsed.data.pickupSlot) : null;

    await AppDataSource.transaction(async (tx) => {
      // Decrement stock
      for (const ci of cartItems) {
        const p = productMap.get(ci.productId)!;
        await tx.getRepository(Product).update({ id: p.id }, { stock: p.stock - ci.quantity });
        inventoryGateway.broadcastStockUpdate(shopId, p.sku, p.stock - ci.quantity);
      }

      // Create order + items
      const orderRepo = tx.getRepository(Order);
      const orderItemRepo = tx.getRepository(OrderItem);

      const total = cartItems.reduce((sum, ci) => {
        const p = productMap.get(ci.productId)!;
        return sum + Number(p.price) * ci.quantity;
      }, 0);

      const order = orderRepo.create({
        customerId,
        shopId,
        status: 'PENDING_PAYMENT',
        pickupSlot,
        totalAmount: total.toFixed(2)
      });
      await orderRepo.save(order);

      const items = cartItems.map((ci) => {
        const p = productMap.get(ci.productId)!;
        return orderItemRepo.create({
          orderId: order.id,
          productId: p.id,
          sku: p.sku,
          name: p.name,
          price: p.price,
          quantity: ci.quantity
        });
      });
      await orderItemRepo.save(items);

      // Clear cart
      await tx.getRepository(CartItem).delete({ cartId: cart.id });

      (res as any).locals = { orderId: order.id };
    });

    const orderId = (res as any).locals.orderId as string;
    return res.status(201).json({ success: true, order: { id: orderId, status: 'PENDING_PAYMENT' } });
  });

  const confirmSchema = z.object({ orderId: z.string().uuid() });

  checkoutRouter.post('/payments/mock/confirm', async (req: AuthedRequest, res) => {
    const parsed = confirmSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid body' });

    const orderRepo = AppDataSource.getRepository(Order);
    const order = await orderRepo.findOne({ where: { id: parsed.data.orderId, customerId: req.user!.sub } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'PENDING_PAYMENT') return res.status(400).json({ success: false, message: 'Order not in payable state' });

    order.status = 'PAID';
    await orderRepo.save(order);
    return res.json({ success: true, order: { id: order.id, status: order.status } });
  });

  return checkoutRouter;
}

