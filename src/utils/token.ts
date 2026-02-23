import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { AuthTokenPayload } from '@absolutsport/shared';

export function generateToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload as object, env.JWT_SECRET as jwt.Secret, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
