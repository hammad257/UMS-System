import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles, CurrentUser } from '../common/guards/roles.decorator';
import { Permissions } from '../common/guards/permissions.decorator';
import { ModuleName } from '../common/guards/permissions.module.decorator';
import { Role } from '../common/types';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('users')
@ApiTags('Users')
@ApiBearerAuth('access-token')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMyProfile(@CurrentUser() user: { id: string }) {
    return this.usersService.getMyProfile(user.id);
  }

  @Get('students')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.REGISTRAR)
  @ModuleName('Identity')
  @Permissions('identity.user.read')
  getAllStudents(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.usersService.getAllStudents(page, limit);
  }

  @Get('faculty')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ModuleName('Identity')
  @Permissions('identity.user.read')
  getAllFaculty(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.usersService.getAllFaculty(page, limit);
  }

  @Get('students/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.REGISTRAR)
  @ModuleName('Identity')
  @Permissions('identity.user.read')
  getStudentById(@Param('id') id: string) {
    return this.usersService.getStudentById(id);
  }

  @Get('faculty/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ModuleName('Identity')
  @Permissions('identity.user.read')
  getFacultyById(@Param('id') id: string) {
    return this.usersService.getFacultyById(id);
  }

  @Patch(':id/deactivate')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ModuleName('Identity')
  @Permissions('identity.user.update')
  deactivateUser(@Param('id') id: string) {
    return this.usersService.deactivateUser(id);
  }

  @Patch(':id/activate')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ModuleName('Identity')
  @Permissions('identity.user.update')
  activateUser(@Param('id') id: string) {
    return this.usersService.activateUser(id);
  }
}
