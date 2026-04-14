import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { requireApprovedOwner } from '../middleware/requireApprovedOwner.js';
import { ShopModel } from '../models/Shop.js';
import { OrderModel } from '../models/Order.js';
import { UserModel } from '../models/User.js';

export const ownerRouter = Router();

ownerRouter.use(requireAuth, requireRole('OWNER'), requireApprovedOwner);

ownerRouter.get('/orders', async (req, res) => {
  const ownerId = req.user.sub;
  const shops = await ShopModel.find({ ownerId });
  const shopIds = shops.map((s) => s.id);
  if (!shopIds.length) return res.json({ success: true, orders: [] });

  const orders = await OrderModel.find({ shopId: { $in: shopIds } }).sort({ createdAt: -1 });

  res.json({ success: true, orders: orders.map((o) => o.toJSON()) });
});

ownerRouter.post('/orders/:orderId/status', async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ success: false, message: 'Status is required' });

  const ownerId = req.user.sub;
  const shops = await ShopModel.find({ ownerId });
  const shopIds = new Set(shops.map((s) => s.id));

  const order = await OrderModel.findById(req.params.orderId);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  if (!shopIds.has(order.shopId)) return res.status(403).json({ success: false, message: 'Forbidden' });

  order.status = status;
  await order.save();
  res.json({ success: true, order: { id: order.id, status: order.status } });
});

ownerRouter.post('/setup-shop', async (req, res) => {
  const ownerId = req.user.sub;
  const { name, shopType, openTime, closeTime, ownerName, contactPhone } = req.body;

  if (!name) return res.status(400).json({ success: false, message: 'Shop name is required' });

  const shop = await ShopModel.create({
    name,
    ownerId,
    shopType: shopType || 'Grocery',
    openTime: openTime || '09:00',
    closeTime: closeTime || '21:00',
    ownerName,
    contactPhone
  });

  await UserModel.findByIdAndUpdate(ownerId, { shopName: name });

  res.status(201).json({ success: true, shop });
});

// Removed /orders/clear as per user requirement to preserve history.
