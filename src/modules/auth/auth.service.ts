import crypto from 'crypto';
import { prisma } from '../../config/database.js';
import { comparePassword, hashPassword } from '../../utils/hash.js';
import { generateToken } from '../../utils/token.js';
import { resend } from '../../config/resend.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { AppError } from '../../middleware/errorHandler.js';
import type { LoginInput, ChangePasswordInput, AuthUser, LoginResponse } from '@absolutsport/shared';
import { Role } from '@absolutsport/shared';

export async function login(input: LoginInput): Promise<LoginResponse> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user || !user.isActive) {
    throw new AppError('Invalid email or password', 401);
  }

  const isValid = await comparePassword(input.password, user.passwordHash);
  if (!isValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = generateToken({
    sub: user.id,
    email: user.email,
    role: user.role as Role,
  });

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    mustChangePassword: user.mustChangePassword,
    isActive: user.isActive,
    profilePhotoUrl: user.profilePhotoUrl,
  };

  return { token, user: authUser };
}

export async function changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isValid = await comparePassword(input.currentPassword, user.passwordHash);
  if (!isValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  const newHash = await hashPassword(input.newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newHash,
      mustChangePassword: false,
    },
  });
}

export async function getMe(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) {
    throw new AppError('User not found', 404);
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    mustChangePassword: user.mustChangePassword,
    isActive: user.isActive,
    profilePhotoUrl: user.profilePhotoUrl,
  };
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });

  // Silent return if user not found — anti-enumeration
  if (!user || !user.isActive) return;

  // Invalidate any previous unused tokens
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  // Generate token and store hash
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    },
  });

  // Send email
  const resetLink = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;

  if (!resend) {
    logger.error('Resend client not configured — RESEND_API_KEY is missing');
    return;
  }

  try {
    await resend.emails.send({
      from: env.RESEND_FROM,
      to: user.email,
      subject: 'AbsolutSport Forms — Redefinir Senha / Reset Password',
      html: `
        <div style="font-family: 'Barlow', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #041628; padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">AbsolutSport Forms</h1>
          </div>
          <div style="padding: 32px; background-color: #ffffff;">
            <h2 style="color: #0D1117; margin-bottom: 16px;">Olá ${user.name},</h2>
            <p style="color: #343A40; line-height: 1.6;">
              Recebemos uma solicitação para redefinir sua senha.
              <br><br>
              We received a request to reset your password.
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${resetLink}" style="background-color: #155F97; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                Redefinir Senha / Reset Password
              </a>
            </div>
            <p style="color: #6C757D; font-size: 14px; line-height: 1.6;">
              Este link expira em 30 minutos. Se você não solicitou esta alteração, ignore este e-mail.
              <br>
              This link expires in 30 minutes. If you did not request this change, please ignore this email.
            </p>
          </div>
          <div style="background-color: #F8F9FA; padding: 16px; text-align: center;">
            <p style="color: #ADB5BD; font-size: 12px; margin: 0;">AbsolutSport — World Cup 2026</p>
          </div>
        </div>
      `,
    });
    logger.info(`Password reset email sent to ${user.email}`);
  } catch (err) {
    logger.error('Failed to send password reset email', { error: err, email: user.email });
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<string> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!resetToken) {
    throw new AppError('Invalid or expired reset token', 400, 'INVALID_TOKEN');
  }

  if (!resetToken.user.isActive) {
    throw new AppError('Account is inactive', 400, 'INVALID_TOKEN');
  }

  const newHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return resetToken.userId;
}
