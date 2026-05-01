import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/Jwt auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { Roles } from '../common/guards/roles.decorator';

import { CreateRoleDto } from './dto/create-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { Role } from 'src/common/types';
import { PermissionScannerService } from 'src/common/rbac/permissions-scanner.service';

@UseGuards(JwtAuthGuard, RolesGuard)
// @Roles(Role.ADMIN, 'SUPER ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService,
private readonly permissionScanner: PermissionScannerService
  ) {
    
  }

  @Get('permissions/catalog')
  getPermissionCatalog() {
    return this.permissionScanner.scanPermissions();
  }

  // ─── ROLES ─────────────────────────────────────
  @Post('roles')
  createRole(@Body() dto: CreateRoleDto) {
    return this.adminService.createRole(dto);
  }

  @Get('roles')
  getRoles() {
    return this.adminService.getRoles();
  }

  // ─── PERMISSIONS ───────────────────────────────
  @Post('permissions')
  createPermission(@Body() dto: CreatePermissionDto) {
    return this.adminService.createPermission(dto);
  }

  @Get('permissions')
  getPermissions() {
    return this.adminService.getPermissions();
  }

  // ─── ASSIGN PERMISSIONS TO ROLE ────────────────
  @Post('roles/:roleId/permissions')
  assignPermissions(
    @Param('roleId') roleId: string,
    @Body() dto: AssignPermissionDto,
  ) {
    return this.adminService.assignPermissionsToRole(
      roleId,
      dto.permissionIds,
    );
  }

  // ─── ASSIGN ROLE TO USER ───────────────────────
  @Post('users/:userId/roles')
  assignRoles(
    @Param('userId') userId: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.adminService.assignRolesToUser(userId, dto.roleIds);
  }
}