import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { UserModel } from '../models/User.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('ADMIN'));

adminRouter.get('/pending-sellers', async (_req, res) => {
  const sellers = await UserModel.find({
    role: 'OWNER',
    sellerApproved: false
  })
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    sellers: sellers.map((u) => ({
      id: u._id,
      email: u.email,
      createdAt: u.createdAt
    }))
  });
});

adminRouter.get('/registered-sellers', async (_req, res) => {
  const sellers = await UserModel.find({
    role: 'OWNER',
    sellerApproved: true
  })
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    sellers: sellers.map((u) => ({
      id: u._id,
      email: u.email,
      createdAt: u.createdAt
    }))
  });
});


adminRouter.post('/sellers/:userId/approve', async (req, res) => {
  const user = await UserModel.findOne({
    _id: req.params.userId,
    role: 'OWNER',
    sellerApproved: false
  });
  if (!user) {
    return res.status(404).json({ success: false, message: 'Pending seller not found' });
  }
  user.sellerApproved = true;
  await user.save();
  res.json({ success: true, seller: { id: user.id, email: user.email, sellerApproved: true } });
});
