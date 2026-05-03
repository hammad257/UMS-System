import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdateUserScopeDto } from './dto/update-user-scope.dto';

const SUPER_ADMIN_CODE = 'SUPER_ADMIN';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  // ---------------------------------------------------------------------------
  // Roles
  // ---------------------------------------------------------------------------

  async createRole(dto: CreateRoleDto) {
    try {
      const role = await this.prisma.role.create({
        data: {
          code: dto.code,
          name: dto.name,
          description: dto.description,
          isSystem: dto.isSystem ?? false,
        },
      });
      return { message: 'Role created', data: role };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('A role with this code already exists');
      }
      throw e;
    }
  }

  async getRoles() {
    const roles = await this.prisma.role.findMany({
      include: {
        _count: { select: { userRoles: true, rolePermissions: true } },
      },
      orderBy: { code: 'asc' },
    });
    return {
      message: 'Roles fetched',
      data: roles.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        description: r.description,
        isSystem: r.isSystem,
        userCount: r._count.userRoles,
        permissionCount: r._count.rolePermissions,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    };
  }

  async getRole(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: { include: { permission: true } },
      },
    });
    if (!role) throw new NotFoundException('Role not found');
    return {
      message: 'Role fetched',
      data: {
        id: role.id,
        code: role.code,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        permissions: role.rolePermissions.map((rp) => rp.permission),
      },
    };
  }

  async updateRole(roleId: string, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    // Cannot mutate the canonical SUPER_ADMIN code.
    if (role.isSystem && dto.code && dto.code !== role.code) {
      throw new ForbiddenException("Cannot change a system role's code");
    }

    const updated = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        isSystem: dto.isSystem,
      },
    });
    return { message: 'Role updated', data: updated };
  }

  async deleteRole(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { _count: { select: { userRoles: true } } },
    });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) {
      throw new ForbiddenException('Cannot delete a system role');
    }
    if (role._count.userRoles > 0) {
      throw new ConflictException('Role still assigned to users');
    }
    await this.prisma.role.delete({ where: { id: roleId } });
    return { message: 'Role deleted', data: null };
  }

  // ---------------------------------------------------------------------------
  // Permissions
  // ---------------------------------------------------------------------------

  async createPermission(dto: CreatePermissionDto) {
    try {
      const perm = await this.prisma.permission.create({ data: dto });
      return { message: 'Permission created', data: perm };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('A permission with this code already exists');
      }
      throw e;
    }
  }

  async getPermissions() {
    const perms = await this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { resource: 'asc' }, { action: 'asc' }],
    });
    return { message: 'Permissions fetched', data: perms };
  }

  async getPermissionsGrouped() {
    const perms = await this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { resource: 'asc' }, { action: 'asc' }],
    });

    const grouped: Record<string, Record<string, string[]>> = {};
    for (const p of perms) {
      grouped[p.module] ??= {};
      grouped[p.module][p.resource] ??= [];
      grouped[p.module][p.resource].push(p.action);
    }
    return { message: 'Permission catalog', data: grouped };
  }

  // ---------------------------------------------------------------------------
  // Role ⇄ Permission assignment (full-replace semantics)
  // ---------------------------------------------------------------------------

  async setRolePermissions(roleId: string, permissionIds: string[]) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    const valid = await this.prisma.permission.findMany({
      where: { id: { in: permissionIds } },
      select: { id: true },
    });
    if (valid.length !== permissionIds.length) {
      throw new BadRequestException('One or more permission IDs are invalid');
    }

    const userIdsAffected = await this.prisma.userRole
      .findMany({ where: { roleId }, select: { userId: true } })
      .then((rows) => rows.map((r) => r.userId));

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
        skipDuplicates: true,
      }),
    ]);

    // Bump everyone holding this role so their JWT carries fresh perms.
    await this.authService.revokeAllForUsers(userIdsAffected);

    return { message: 'Role permissions updated', data: { count: permissionIds.length } };
  }

  /**
   * Convenience additive endpoint used by the original `/admin/roles/:id/permissions`
   * POST. Kept for backward-compat. The PUT version (`setRolePermissions`) is
   * the preferred Module-2 path.
   */
  async addRolePermissions(roleId: string, permissionIds: string[]) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    await this.prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      skipDuplicates: true,
    });

    const userIds = await this.prisma.userRole
      .findMany({ where: { roleId }, select: { userId: true } })
      .then((rows) => rows.map((r) => r.userId));
    await this.authService.revokeAllForUsers(userIds);

    return { message: 'Permissions appended to role' };
  }

  // ---------------------------------------------------------------------------
  // User ⇄ Role assignment (full-replace) + Scope
  // ---------------------------------------------------------------------------

  async setUserRoles(userId: string, roleIds: string[], actingUserId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (actingUserId && actingUserId === userId) {
      throw new ForbiddenException('You cannot change your own role set');
    }

    const validRoles = await this.prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { id: true, code: true },
    });
    if (validRoles.length !== roleIds.length) {
      throw new BadRequestException('One or more role IDs are invalid');
    }

    // Last-SUPER_ADMIN guard: if removing SUPER_ADMIN from a user, ensure
    // there's still at least one other.
    await this.assertNotRemovingLastSuperAdmin(userId, validRoles);

    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId } }),
      this.prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({
          userId,
          roleId,
          assignedBy: actingUserId,
        })),
        skipDuplicates: true,
      }),
    ]);

    await this.authService.revokeAllForUsers([userId]);
    return { message: 'User roles updated', data: { count: roleIds.length } };
  }

  /**
   * Backward-compat additive variant.
   */
  async addRolesToUser(
    userId: string,
    roleIds: string[],
    actingUserId?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.userRole.createMany({
      data: roleIds.map((roleId) => ({
        userId,
        roleId,
        assignedBy: actingUserId,
      })),
      skipDuplicates: true,
    });

    await this.authService.revokeAllForUsers([userId]);
    return { message: 'Roles assigned to user' };
  }

  async setUserScope(userId: string, dto: UpdateUserScopeDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const scope = await this.prisma.userScope.upsert({
      where: { userId },
      update: {
        campusIds: dto.campusIds,
        departmentIds: dto.departmentIds,
      },
      create: {
        userId,
        campusIds: dto.campusIds,
        departmentIds: dto.departmentIds,
      },
    });

    await this.authService.revokeAllForUsers([userId]);
    return { message: 'User scope updated', data: scope };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async assertNotRemovingLastSuperAdmin(
    userId: string,
    nextRoles: Array<{ id: string; code: string }>,
  ) {
    const willHaveSuperAdmin = nextRoles.some(
      (r) => r.code === SUPER_ADMIN_CODE,
    );
    if (willHaveSuperAdmin) return;

    const currentSuperAdmins = await this.prisma.userRole.count({
      where: { role: { code: SUPER_ADMIN_CODE } },
    });
    if (currentSuperAdmins <= 1) {
      const isCurrentlySuperAdmin = await this.prisma.userRole.findFirst({
        where: { userId, role: { code: SUPER_ADMIN_CODE } },
        select: { userId: true },
      });
      if (isCurrentlySuperAdmin) {
        throw new ForbiddenException(
          'Cannot remove SUPER_ADMIN role from the last SUPER_ADMIN user',
        );
      }
    }
  }
}
