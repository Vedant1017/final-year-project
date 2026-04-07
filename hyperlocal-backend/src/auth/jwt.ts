import jwt from 'jsonwebtoken';

export type JwtUser = { sub: string; role: 'CUSTOMER' | 'OWNER'; email: string };

const jwtSecret = process.env.JWT_SECRET ?? 'dev-secret-change-me';

export function signAccessToken(payload: JwtUser) {
  return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): JwtUser {
  return jwt.verify(token, jwtSecret) as JwtUser;
}

