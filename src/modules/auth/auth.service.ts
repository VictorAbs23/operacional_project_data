import { prisma } from '../../config/database.js';
import { comparePassword, hashPassword } from '../../utils/hash.js';
import { generateToken } from '../../utils/token.js';
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
