/**
 * Database seed.
 *
 * Bootstraps:
 *   1. The full Permission catalog (Module 2 §Permission catalog).
 *   2. The 6 system Roles + their permission grants.
 *   3. One root SUPER_ADMIN user (Module 1 §Seed data) so the system has
 *      a valid first login.
 *
 * Re-runnable: every operation is idempotent (upsert / skipDuplicates).
 *
 * Usage:
 *   npx prisma db seed
 *
 * Add to package.json once if not present:
 *   "prisma": { "seed": "ts-node prisma/seed.ts" }
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Add it to your .env file.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

// -----------------------------------------------------------------------------
// Permission catalog — single source of truth.
// Code format: "<module>.<resource>.<action>"
// -----------------------------------------------------------------------------

const STANDARD = ['read', 'create', 'update', 'delete'];

const PERMISSION_GROUPS: Array<{
  module: string;
  resources: Record<string, string[]>;
}> = [
  {
    module: 'identity',
    resources: {
      user: STANDARD,
      role: STANDARD,
      permission: ['read'],
    },
  },
  {
    module: 'academic',
    resources: {
      campus: STANDARD,
      faculty: STANDARD,
      department: STANDARD,
      program: STANDARD,
      batch: STANDARD,
      semester: STANDARD,
    },
  },
  {
    module: 'students',
    resources: {
      student: [...STANDARD, 'export'],
      enrollment: STANDARD,
      guardian: STANDARD,
    },
  },
  {
    module: 'employees',
    resources: { employee: [...STANDARD, 'export'] },
  },
  {
    module: 'courses',
    resources: { course: STANDARD, offering: STANDARD, registration: STANDARD },
  },
  {
    module: 'attendance',
    resources: { attendance: ['read', 'create', 'update'] },
  },
  {
    module: 'exams',
    resources: { exam: STANDARD, marks: ['read', 'create', 'update'] },
  },
  {
    module: 'finance',
    resources: {
      feeStructure: STANDARD,
      invoice: [...STANDARD, 'approve'],
      payment: STANDARD,
    },
  },
  {
    module: 'communication',
    resources: {
      notification: ['read', 'create'],
      message: ['read', 'create'],
    },
  },
];

// -----------------------------------------------------------------------------
// Role catalog — Module 2 §Seed data.
// `permissionRule` is a function so we can compute the grant list against the
// permissions actually present in the DB after the catalog upsert.
// -----------------------------------------------------------------------------

interface PermissionRow {
  id: string;
  code: string;
  module: string;
  resource: string;
  action: string;
}

interface RoleSpec {
  code: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissionRule: (perms: PermissionRow[]) => PermissionRow[];
}

const ROLES: RoleSpec[] = [
  {
    code: 'SUPER_ADMIN',
    name: 'Super Admin',
    description: 'Full access. Cannot be deleted.',
    isSystem: true,
    permissionRule: (perms) => perms,
  },
  {
    code: 'ADMIN',
    name: 'Admin',
    description:
      'Identity, Academic, Students, Employees, Courses — full CRUD.',
    isSystem: false,
    permissionRule: (perms) =>
      perms.filter((p) =>
        ['identity', 'academic', 'students', 'employees', 'courses'].includes(
          p.module,
        ),
      ),
  },
  {
    code: 'REGISTRAR',
    name: 'Registrar',
    description: 'Academic + Students + Course offerings.',
    isSystem: false,
    permissionRule: (perms) =>
      perms.filter(
        (p) =>
          p.module === 'academic' ||
          p.module === 'students' ||
          (p.module === 'courses' && p.resource === 'offering'),
      ),
  },
  {
    code: 'FACULTY',
    name: 'Faculty',
    description: 'Courses, Attendance, Exams + read Students.',
    isSystem: false,
    permissionRule: (perms) =>
      perms.filter(
        (p) =>
          p.module === 'courses' ||
          p.module === 'attendance' ||
          p.module === 'exams' ||
          (p.module === 'students' && p.action === 'read'),
      ),
  },
  {
    code: 'FINANCE_OFFICER',
    name: 'Finance Officer',
    description: 'Finance + read Students.',
    isSystem: false,
    permissionRule: (perms) =>
      perms.filter(
        (p) =>
          p.module === 'finance' ||
          (p.module === 'students' && p.action === 'read'),
      ),
  },
  {
    code: 'STUDENT',
    name: 'Student',
    description:
      'Read-only on Students, Courses, Attendance, Exams + invoice/payment read.',
    isSystem: false,
    permissionRule: (perms) =>
      perms.filter(
        (p) =>
          (['students', 'courses', 'attendance', 'exams'].includes(p.module) &&
            p.action === 'read') ||
          (p.module === 'finance' &&
            ['invoice', 'payment'].includes(p.resource) &&
            p.action === 'read'),
      ),
  },
];

// -----------------------------------------------------------------------------
// Root admin user — Module 1 §Seed data.
// -----------------------------------------------------------------------------

const ROOT_ADMIN = {
  email: 'admin@uni.edu',
  password: 'ChangeMe!2026',
  firstName: 'Maria',
  lastName: 'Khan',
} as const;

// =============================================================================
// Seed implementation
// =============================================================================

async function seedPermissions() {
  console.log('• Seeding permissions…');
  const data: Prisma.PermissionCreateManyInput[] = [];
  for (const group of PERMISSION_GROUPS) {
    for (const [resource, actions] of Object.entries(group.resources)) {
      for (const action of actions) {
        const code = `${group.module}.${resource}.${action}`.toLowerCase();
        data.push({
          code,
          module: group.module,
          resource,
          action,
        });
      }
    }
  }

  // Upsert one-by-one so we don't blow away existing description fields.
  for (const row of data) {
    await prisma.permission.upsert({
      where: { code: row.code },
      update: {
        module: row.module,
        resource: row.resource,
        action: row.action,
      },
      create: row,
    });
  }
  const total = await prisma.permission.count();
  console.log(`  ↳ ${total} permission codes total`);
}

async function seedRoles() {
  console.log('• Seeding roles…');
  const allPerms = await prisma.permission.findMany();

  for (const spec of ROLES) {
    const role = await prisma.role.upsert({
      where: { code: spec.code },
      update: {
        name: spec.name,
        description: spec.description,
        isSystem: spec.isSystem,
      },
      create: {
        code: spec.code,
        name: spec.name,
        description: spec.description,
        isSystem: spec.isSystem,
      },
    });

    const grants = spec.permissionRule(allPerms);
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (grants.length > 0) {
      await prisma.rolePermission.createMany({
        data: grants.map((p) => ({ roleId: role.id, permissionId: p.id })),
        skipDuplicates: true,
      });
    }
    console.log(`  ↳ ${role.code} (${grants.length} permissions)`);
  }
}

async function seedRootAdmin() {
  console.log('• Seeding root SUPER_ADMIN…');
  const superAdmin = await prisma.role.findUnique({
    where: { code: 'SUPER_ADMIN' },
    select: { id: true },
  });
  if (!superAdmin) throw new Error('SUPER_ADMIN role missing — abort.');

  const existing = await prisma.user.findUnique({
    where: { email: ROOT_ADMIN.email },
  });
  if (existing) {
    console.log('  ↳ root admin already exists, skipping');
    return;
  }

  const passwordHash = await argon2.hash(ROOT_ADMIN.password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  await prisma.user.create({
    data: {
      email: ROOT_ADMIN.email,
      passwordHash,
      firstName: ROOT_ADMIN.firstName,
      lastName: ROOT_ADMIN.lastName,
      status: 'ACTIVE',
      userRoles: { create: [{ roleId: superAdmin.id }] },
      scope: { create: { campusIds: [], departmentIds: [] } },
    },
  });

  console.log(
    `  ↳ ${ROOT_ADMIN.email} created (password: ${ROOT_ADMIN.password} — change on first login)`,
  );
}

async function main() {
  await seedPermissions();
  await seedRoles();
  await seedRootAdmin();
  console.log('✔ Seed complete');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
