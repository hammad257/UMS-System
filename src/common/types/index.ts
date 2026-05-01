// Mirror of Prisma Role enum — kept in sync with prisma/schema.prisma
export enum Role {
  STUDENT = 'STUDENT',
  FACULTY = 'FACULTY',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  SECURITY = 'SECURITY',
}

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export enum UserRole {
  STUDENT = 'STUDENT',
  FACULTY = 'FACULTY',
}