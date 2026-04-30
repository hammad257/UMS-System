// Mirror of Prisma Role enum — kept in sync with prisma/schema.prisma
export enum Role {
  STUDENT = 'STUDENT',
  FACULTY = 'TEACHER',
  ADMIN = 'SUPER ADMIN',
  STAFF = 'STAFF',
  SECURITY = 'SECURITY',
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export enum UserRole {
  STUDENT = 'STUDENT',
  FACULTY = 'FACULTY',
}