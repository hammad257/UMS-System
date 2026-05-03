import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles, CurrentUser } from '../common/guards/roles.decorator';
import { Permissions } from '../common/guards/permissions.decorator';
import { ModuleName } from '../common/guards/permissions.module.decorator';
import { Role } from '../common/types';
import type { AuthUser } from '../common/types';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { UpdateUserScopeDto } from './dto/update-user-scope.dto';
import { PermissionScannerService } from '../common/rbac/permissions-scanner.service';

@ApiTags('Identity (Admin)')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly permissionScanner: PermissionScannerService,
  ) {}

  // -------------------------------------------------------------------------
  // Decorator-driven catalog (helpful during development)
  // -------------------------------------------------------------------------
  @Get('permissions/catalog')
  @ApiOperation({ summary: 'Permissions advertised by @Permissions() decorators' })
  getPermissionCatalog() {
    return this.permissionScanner.scanPermissions();
  }

  // -------------------------------------------------------------------------
  // Roles
  // -------------------------------------------------------------------------
  @Get('roles')
  @ModuleName('Identity')
  @Permissions('identity.role.read')
  getRoles() {
    return this.adminService.getRoles();
  }

  @Get('roles/:id')
  @ModuleName('Identity')
  @Permissions('identity.role.read')
  getRole(@Param('id') id: string) {
    return this.adminService.getRole(id);
  }

  @Post('roles')
  @ModuleName('Identity')
  @Permissions('identity.role.create')
  createRole(@Body() dto: CreateRoleDto) {
    return this.adminService.createRole(dto);
  }

  @Patch('roles/:id')
  @ModuleName('Identity')
  @Permissions('identity.role.update')
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.adminService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  @ModuleName('Identity')
  @Permissions('identity.role.delete')
  deleteRole(@Param('id') id: string) {
    return this.adminService.deleteRole(id);
  }

  // -------------------------------------------------------------------------
  // Permissions
  // -------------------------------------------------------------------------
  @Get('permissions')
  @ModuleName('Identity')
  @Permissions('identity.permission.read')
  getPermissions() {
    return this.adminService.getPermissions();
  }

  @Get('permissions/grouped')
  @ModuleName('Identity')
  @Permissions('identity.permission.read')
  getPermissionsGrouped() {
    return this.adminService.getPermissionsGrouped();
  }

  @Post('permissions')
  @ModuleName('Identity')
  @Permissions('identity.permission.read')
  createPermission(@Body() dto: CreatePermissionDto) {
    return this.adminService.createPermission(dto);
  }

  // -------------------------------------------------------------------------
  // Role ⇄ Permission
  // -------------------------------------------------------------------------
  @Put('roles/:roleId/permissions')
  @ModuleName('Identity')
  @Permissions('identity.role.update')
  setPermissions(
    @Param('roleId') roleId: string,
    @Body() dto: AssignPermissionDto,
  ) {
    return this.adminService.setRolePermissions(roleId, dto.permissionIds);
  }

  // Backward-compatible additive route (kept for current frontend wiring).
  @Post('roles/:roleId/permissions')
  @ModuleName('Identity')
  @Permissions('identity.role.update')
  addPermissions(
    @Param('roleId') roleId: string,
    @Body() dto: AssignPermissionDto,
  ) {
    return this.adminService.addRolePermissions(roleId, dto.permissionIds);
  }

  // -------------------------------------------------------------------------
  // User ⇄ Role
  // -------------------------------------------------------------------------
  @Put('users/:userId/roles')
  @ModuleName('Identity')
  @Permissions('identity.user.update')
  setUserRoles(
    @Param('userId') userId: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() actingUser: AuthUser,
  ) {
    return this.adminService.setUserRoles(userId, dto.roleIds, actingUser?.id);
  }

  @Post('users/:userId/roles')
  @ModuleName('Identity')
  @Permissions('identity.user.update')
  addUserRoles(
    @Param('userId') userId: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() actingUser: AuthUser,
  ) {
    return this.adminService.addRolesToUser(userId, dto.roleIds, actingUser?.id);
  }

  // -------------------------------------------------------------------------
  // User Scope
  // -------------------------------------------------------------------------
  @Put('users/:userId/scope')
  @ModuleName('Identity')
  @Permissions('identity.user.update')
  setUserScope(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserScopeDto,
  ) {
    return this.adminService.setUserScope(userId, dto);
  }
}
