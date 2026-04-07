import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AppDataSource } from '../db/dataSource';
import { User } from '../entities/User';
import { signAccessToken } from '../auth/jwt';
import { requireAuth, type AuthedRequest } from '../middleware/requireAuth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid body' });

  const { email, password } = parsed.data;
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { email } });
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const token = signAccessToken({ sub: user.id, role: user.role, email: user.email });
  return res.json({ success: true, token, user: { id: user.id, email: user.email, role: user.role } });
});

authRouter.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  return res.json({ success: true, user: req.user });
});

