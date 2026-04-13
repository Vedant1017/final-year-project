import { UserModel } from '../models/User.js';

/** Blocks OWNER accounts until admin approves (seller signup). */
export async function requireApprovedOwner(req, res, next) {
  try {
    if (!req.user || req.user.role !== 'OWNER') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const user = await UserModel.findById(req.user.sub);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    if (user.sellerApproved === false) {
      return res.status(403).json({
        success: false,
        message: 'Seller account is pending admin approval'
      });
    }
    next();
  } catch (e) {
    next(e);
  }
}
