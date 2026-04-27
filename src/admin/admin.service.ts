import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ─── ROLES ─────────────────────────────────────────────
  async createRole(dto: CreateRoleDto) {
    return this.prisma.role.create({
      data: dto,
    });
  }

  async getRoles() {
    return this.prisma.role.findMany({
      include: { permissions: true },
    });
  }

  // ─── PERMISSIONS ───────────────────────────────────────
  async createPermission(dto: CreatePermissionDto) {
    return this.prisma.permission.create({
      data: dto,
    });
  }

  async getPermissions() {
    return this.prisma.permission.findMany();
  }

  // ─── ASSIGN PERMISSIONS TO ROLE ────────────────────────
  async assignPermissionsToRole(roleId: string, permissionIds: string[]) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) throw new NotFoundException('Role not found');

    await this.prisma.rolePermission.createMany({
      data: permissionIds.map((pid) => ({
        roleId,
        permissionId: pid,
      })),
      skipDuplicates: true,
    });

    return { message: 'Permissions assigned to role' };
  }

  // ─── ASSIGN ROLE TO USER ───────────────────────────────
  async assignRolesToUser(userId: string, roleIds: string[]) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    await this.prisma.userRole.createMany({
      data: roleIds.map((rid) => ({
        userId,
        roleId: rid,
      })),
      skipDuplicates: true,
    });

    return { message: 'Roles assigned to user' };
  }
}