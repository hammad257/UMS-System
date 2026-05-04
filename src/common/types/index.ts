// -----------------------------------------------------------------------------
// Static role-code list used by @Roles(...) decorators across the app.
// The DB still owns the canonical list of Roles (Module 2 — Identity).
// Code values must match the `Role.code` column in `roles`.
// -----------------------------------------------------------------------------
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  REGISTRAR = 'REGISTRAR',
  FACULTY = 'FACULTY',
  FINANCE_OFFICER = 'FINANCE_OFFICER',
  STUDENT = 'STUDENT',

  // Legacy aliases — kept so older modules that import Role.STAFF / SECURITY
  // continue to compile during the transition. Treat them as ADMIN-equivalent.
  STAFF = 'ADMIN',
  SECURITY = 'ADMIN',
}

export interface AuthScope {
  campusIds: string[];
  departmentIds: string[];
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  scope: AuthScope;
}

// Legacy enum — kept for any callers still importing it.
export enum UserRole {
  STUDENT = 'STUDENT',
  FACULTY = 'FACULTY',
}
