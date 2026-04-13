import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { CartModel } from '../models/Cart.js';
import { CartItemModel } from '../models/CartItem.js';
import { ProductModel } from '../models/Product.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';

export const cartRouter = Router();

cartRouter.use(requireAuth, requireRole('CUSTOMER'));

async function getOrCreateCart(customerId) {
  let cart = await CartModel.findOne({ customerId });
  if (!cart) {
    cart = await CartModel.create({ customerId });
  }
  return cart;
}

cartRouter.get('/', async (req, res) => {
  const customerId = req.user.sub;
  const cart = await getOrCreateCart(customerId);

  const items = await CartItemModel.find({ cartId: cart.id });

  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = productIds.length ? await ProductModel.find({ _id: { $in: productIds } }) : [];
  const productMap = new Map(products.map((p) => [p.id, p]));

  res.json({
    success: true,
    cart: {
      id: cart.id,
      items: items.map((i) => {
        const p = productMap.get(i.productId);
        const pj = p ? p.toJSON() : null;
        return {
          id: i.id,
          productId: i.productId,
          quantity: i.quantity,
          product: pj
            ? { id: pj.id, sku: pj.sku, name: pj.name, price: pj.price, stock: pj.stock, shopId: pj.shopId }
            : null
        };
      })
    }
  });
});

const upsertSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(0)
});

cartRouter.post('/items', async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid body' });

  const { productId, quantity } = parsed.data;
  const customerId = req.user.sub;
  const cart = await getOrCreateCart(customerId);

  let product = await ProductModel.findById(productId);
  if (!product && productId.length === 24) {
    try {
      product = await ProductModel.findOne({ _id: new mongoose.Types.ObjectId(productId) });
    } catch(e) {}
  }
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  if (quantity <= 0) {
    await CartItemModel.deleteOne({ cartId: cart.id, productId });
    return res.json({ success: true });
  }

  await CartItemModel.findOneAndUpdate(
    { cartId: cart.id, productId },
    { $set: { quantity } },
    { upsert: true, new: true }
  );

  return res.json({ success: true });
});

cartRouter.delete('/items/:productId', async (req, res) => {
  const customerId = req.user.sub;
  const cart = await getOrCreateCart(customerId);
  const productId = req.params.productId;

  const item = await CartItemModel.findOne({ cartId: cart.id, productId });
  if (item) await item.deleteOne();

  res.json({ success: true });
});
