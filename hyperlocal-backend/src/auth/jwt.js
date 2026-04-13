import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET ?? 'dev-secret-change-me';

export function signAccessToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, jwtSecret);
}
