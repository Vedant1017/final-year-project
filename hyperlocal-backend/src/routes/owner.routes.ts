import { Router } from 'express';
import { AppDataSource } from '../db/dataSource';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { Shop } from '../entities/Shop';
import { Order } from '../entities/Order';
import { In } from 'typeorm';
import type { AuthedRequest } from '../middleware/requireAuth';

export const ownerRouter = Router();

ownerRouter.use(requireAuth, requireRole('OWNER'));

ownerRouter.get('/orders', async (req: AuthedRequest, res) => {
  const ownerId = req.user!.sub;
  const shopRepo = AppDataSource.getRepository(Shop);
  const shops = await shopRepo.find({ where: { ownerId } });
  const shopIds = shops.map((s) => s.id);
  if (!shopIds.length) return res.json({ success: true, orders: [] });

  const orderRepo = AppDataSource.getRepository(Order);
  const orders = await orderRepo.find({ where: { shopId: In(shopIds) }, order: { createdAt: 'DESC' } });

  res.json({ success: true, orders });
});

ownerRouter.post('/orders/:orderId/fulfill', async (req: AuthedRequest, res) => {
  const ownerId = req.user!.sub;
  const shopRepo = AppDataSource.getRepository(Shop);
  const shops = await shopRepo.find({ where: { ownerId } });
  const shopIds = new Set(shops.map((s) => s.id));

  const orderRepo = AppDataSource.getRepository(Order);
  const order = await orderRepo.findOne({ where: { id: req.params.orderId } });
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  if (!shopIds.has(order.shopId)) return res.status(403).json({ success: false, message: 'Forbidden' });

  order.status = 'FULFILLED';
  await orderRepo.save(order);
  res.json({ success: true, order: { id: order.id, status: order.status } });
});

