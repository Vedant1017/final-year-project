import { Router } from 'express';
import { z } from 'zod';
import { In } from 'typeorm';
import { AppDataSource } from '../db/dataSource';
import { Cart } from '../entities/Cart';
import { CartItem } from '../entities/CartItem';
import { Product } from '../entities/Product';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import type { AuthedRequest } from '../middleware/requireAuth';

export const cartRouter = Router();

cartRouter.use(requireAuth, requireRole('CUSTOMER'));

async function getOrCreateCart(customerId: string) {
  const cartRepo = AppDataSource.getRepository(Cart);
  let cart = await cartRepo.findOne({ where: { customerId } });
  if (!cart) {
    cart = cartRepo.create({ customerId });
    await cartRepo.save(cart);
  }
  return cart;
}

cartRouter.get('/', async (req: AuthedRequest, res) => {
  const customerId = req.user!.sub;
  const cart = await getOrCreateCart(customerId);

  const itemRepo = AppDataSource.getRepository(CartItem);
  const items = await itemRepo.find({ where: { cartId: cart.id } });

  const productRepo = AppDataSource.getRepository(Product);
  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = productIds.length ? await productRepo.find({ where: { id: In(productIds) } }) : [];
  const productMap = new Map(products.map((p) => [p.id, p]));

  res.json({
    success: true,
    cart: {
      id: cart.id,
      items: items.map((i) => {
        const p = productMap.get(i.productId);
        return {
          id: i.id,
          productId: i.productId,
          quantity: i.quantity,
          product: p
            ? { id: p.id, sku: p.sku, name: p.name, price: p.price, stock: p.stock, shopId: p.shopId }
            : null
        };
      })
    }
  });
});

const upsertSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(0)
});

cartRouter.post('/items', async (req: AuthedRequest, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid body' });

  const { productId, quantity } = parsed.data;
  const customerId = req.user!.sub;
  const cart = await getOrCreateCart(customerId);

  const productRepo = AppDataSource.getRepository(Product);
  const product = await productRepo.findOne({ where: { id: productId } });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  const itemRepo = AppDataSource.getRepository(CartItem);
  let item = await itemRepo.findOne({ where: { cartId: cart.id, productId } });

  if (quantity <= 0) {
    if (item) await itemRepo.remove(item);
    return res.json({ success: true });
  }

  if (!item) item = itemRepo.create({ cartId: cart.id, productId, quantity });
  else item.quantity = quantity;

  await itemRepo.save(item);
  return res.json({ success: true });
});

cartRouter.delete('/items/:productId', async (req: AuthedRequest, res) => {
  const customerId = req.user!.sub;
  const cart = await getOrCreateCart(customerId);
  const productId = req.params.productId;

  const itemRepo = AppDataSource.getRepository(CartItem);
  const item = await itemRepo.findOne({ where: { cartId: cart.id, productId } });
  if (item) await itemRepo.remove(item);

  res.json({ success: true });
});

