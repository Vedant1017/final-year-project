import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { OrderModel } from '../models/Order.js';

export const deliveryRouter = Router();

deliveryRouter.use(requireAuth, requireRole('DELIVERY_MAN'));

deliveryRouter.get('/orders/available', async (req, res) => {
  // Find orders that are PACKING or ready to be delivered (no delivery man assigned yet)
  const orders = await OrderModel.find({ 
    status: { $in: ['PACKING', 'OUT_FOR_DELIVERY'] },
    deliveryManId: null
  }).sort({ createdAt: -1 });
  
  res.json({ success: true, orders: orders.map((o) => o.toJSON()) });
});

deliveryRouter.get('/orders/mine', async (req, res) => {
  const deliveryManId = req.user.sub;
  const orders = await OrderModel.find({ deliveryManId }).sort({ createdAt: -1 });
  
  res.json({ success: true, orders: orders.map((o) => o.toJSON()) });
});

deliveryRouter.post('/orders/:orderId/accept', async (req, res) => {
  const deliveryManId = req.user.sub;
  const order = await OrderModel.findById(req.params.orderId);
  
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  if (order.deliveryManId) return res.status(400).json({ success: false, message: 'Order already accepted by someone else' });

  order.deliveryManId = deliveryManId;
  order.status = 'OUT_FOR_DELIVERY';
  await order.save();
  
  res.json({ success: true, order: { id: order.id, status: order.status, deliveryManId: order.deliveryManId } });
});

deliveryRouter.post('/orders/:orderId/deliver', async (req, res) => {
  const deliveryManId = req.user.sub;
  const order = await OrderModel.findById(req.params.orderId);
  
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  if (order.deliveryManId !== deliveryManId) return res.status(403).json({ success: false, message: 'Forbidden' });

  order.status = 'DELIVERED';
  await order.save();
  
  res.json({ success: true, order: { id: order.id, status: order.status } });
});
