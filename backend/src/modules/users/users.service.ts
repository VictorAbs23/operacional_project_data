import { prisma } from '../../config/database.js';
import { hashPassword } from '../../utils/hash.js';
import { generateTempPassword } from '../../utils/token.js';
import { AppError } from '../../middleware/errorHandler.js';
import type { CreateUserInput, UpdateUserInput, AuthUser, PaginatedResponse } from '@absolutsport/shared';
import { Role } from '@absolutsport/shared';

function toAuthUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  mustChangePassword: boolean;
  isActive: boolean;
  profilePhotoUrl: string | null;
}): AuthUser {
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

export async function listUsers(page = 1, pageSize = 20): Promise<PaginatedResponse<AuthUser>> {
  const skip = (page - 1) * pageSize;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: { role: { not: 'CLIENT' } },
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where: { role: { not: 'CLIENT' } } }),
  ]);

  return {
    data: users.map(toAuthUser),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function createUser(input: CreateUserInput): Promise<{ user: AuthUser; tempPassword?: string }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError('User with this email already exists', 409);
  }

  const tempPassword = input.password || generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      role: input.role,
      passwordHash,
      mustChangePassword: !input.password,
    },
  });

  return {
    user: toAuthUser(user),
    tempPassword: !input.password ? tempPassword : undefined,
  };
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<AuthUser> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.role !== undefined && { role: input.role }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });

  return toAuthUser(updated);
}

export async function deactivateUser(id: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function resetPassword(id: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  await prisma.user.update({
    where: { id },
    data: { passwordHash, mustChangePassword: true },
  });

  return tempPassword;
}

export async function deleteUser(id: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  await prisma.$transaction([
    prisma.auditLog.updateMany({
      where: { userId: id },
      data: { userId: null },
    }),
    prisma.user.delete({ where: { id } }),
  ]);
}

export async function getUserById(id: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return toAuthUser(user);
}
