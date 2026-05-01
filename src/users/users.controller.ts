import {
  Controller,
  Get,
  Param,
  Query,
  Patch,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/Jwt auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { Roles, CurrentUser } from '../common/guards/roles.decorator';
import { Role } from '../common/types';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ModuleName } from 'src/common/guards/permissions.module.decorator';
import { Permissions } from 'src/common/guards/permissions.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';

// All routes under /users require a valid JWT
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
@ApiTags('Users')
@ApiBearerAuth('access-token')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── GET /users/me ────────────────────────────────────────────────────────────
  // Any authenticated user can view their own profile
  @Get('me')
  getMyProfile(@CurrentUser() user: { id: string }) {
    return this.usersService.getMyProfile(user.id);
  }

  // ─── GET /users/students ──────────────────────────────────────────────────────
  // Only FACULTY and ADMIN can list all students
  @Get('students')
  @Roles(Role.ADMIN)
  // @ModuleName('Identity')
  // @Permissions('identity.user.read')
  // @Roles('FACULTY', 'SUPER_ADMIN')
  getAllStudents(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.usersService.getAllStudents(page, limit);
  }

  // ─── GET /users/faculty ───────────────────────────────────────────────────────
  // Only ADMIN can list all faculty
  @Get('faculty')
  @Roles(Role.ADMIN)
  // @ModuleName('Identity')
  // @Permissions('identity.user.read')
  getAllFaculty(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.usersService.getAllFaculty(page, limit);
  }

  // ─── GET /users/students/:id ──────────────────────────────────────────────────
  @Get('students/:id')
  @Roles(Role.ADMIN)
  // @ModuleName('Identity')
  // @Permissions('identity.user.read')
  getStudentById(@Param('id') id: string) {
    return this.usersService.getStudentById(id);
  }

  // ─── GET /users/faculty/:id ───────────────────────────────────────────────────
  @Get('faculty/:id')
  @Roles(Role.ADMIN)
  // @ModuleName('Identity')
  // @Permissions('identity.user.read')
  getFacultyById(@Param('id') id: string) {
    return this.usersService.getFacultyById(id);
  }

  // ─── PATCH /users/:id/deactivate ─────────────────────────────────────────────
  @Patch(':id/deactivate')
  @Roles(Role.ADMIN)
  // @ModuleName('Identity')
  // @Permissions('identity.user.update')
  deactivateUser(@Param('id') id: string) {
    return this.usersService.deactivateUser(id);
  }

  @Patch(':id/activate')
  @Roles(Role.ADMIN)
  activateUser(@Param('id') id: string) {
    return this.usersService.activateUser(id);
  }
}
