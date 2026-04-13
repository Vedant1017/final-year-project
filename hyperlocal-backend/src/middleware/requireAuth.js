import { verifyAccessToken } from '../auth/jwt.js';

export function requireAuth(req, res, next) {
  const header = req.header('authorization') ?? '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ success: false, message: 'Missing Authorization header' });

  try {
    const user = verifyAccessToken(match[1]);
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}
