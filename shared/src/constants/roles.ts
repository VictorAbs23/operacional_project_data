export enum Role {
  MASTER = 'MASTER',
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.MASTER]: 1,
  [Role.ADMIN]: 2,
  [Role.CLIENT]: 3,
};

export function hasHigherOrEqualRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] <= ROLE_HIERARCHY[requiredRole];
}
