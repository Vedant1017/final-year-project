import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UserModel } from '../models/User.js';
import { signAccessToken } from '../auth/jwt.js';
import { requireAuth } from '../middleware/requireAuth.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  accountType: z.enum(['customer', 'seller', 'delivery_man'])
});

function userResponse(doc) {
  const sellerApproved =
    doc.role === 'CUSTOMER' || doc.role === 'ADMIN' || doc.role === 'DELIVERY_MAN' ? true : doc.sellerApproved !== false;
  return {
    id: doc.id,
    email: doc.email,
    role: doc.role,
    sellerApproved,
    locationPrompted: doc.locationPrompted,
    location: doc.location
  };
}

export const authRouter = Router();

authRouter.post('/signup', async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Use a valid email, password (min 6 characters), and account type (customer or seller)'
    });
  }

  const { email, password, accountType } = parsed.data;
  const emailNorm = email.toLowerCase();
  const existing = await UserModel.findOne({ email: emailNorm });
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  let role;
  let sellerApproved;
  if (accountType === 'customer') {
    role = 'CUSTOMER';
    sellerApproved = true;
  } else if (accountType === 'delivery_man') {
    role = 'DELIVERY_MAN';
    sellerApproved = true; // Auto approve delivery boys
  } else {
    role = 'OWNER';
    sellerApproved = false;
  }

  const user = await UserModel.create({
    email: emailNorm,
    passwordHash,
    role,
    sellerApproved
  });

  const token = signAccessToken({ sub: user.id, role: user.role, email: user.email });
  return res.status(201).json({
    success: true,
    token,
    user: userResponse(user)
  });
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid body' });

  const { email, password } = parsed.data;
  const user = await UserModel.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const token = signAccessToken({ sub: user.id, role: user.role, email: user.email });
  return res.json({
    success: true,
    token,
    user: userResponse(user)
  });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const doc = await UserModel.findById(req.user.sub);
  if (!doc) return res.status(404).json({ success: false, message: 'User not found' });
  return res.json({ success: true, user: userResponse(doc) });
});

const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  address: z.string().optional()
});

authRouter.post('/location', requireAuth, async (req, res) => {
  const parsed = locationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: 'Invalid location payload' });
  }

  const { lat, lng, address } = parsed.data;
  const user = await UserModel.findById(req.user.sub);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  user.location = { lat, lng, address: address || '' };
  user.locationPrompted = true;
  await user.save();

  return res.json({ success: true, user: userResponse(user) });
});

