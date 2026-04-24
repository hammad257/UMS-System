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
  @Roles(Role.FACULTY, Role.ADMIN)
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
  getAllFaculty(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.usersService.getAllFaculty(page, limit);
  }

  // ─── GET /users/students/:id ──────────────────────────────────────────────────
  @Get('students/:id')
  @Roles(Role.FACULTY, Role.ADMIN)
  getStudentById(@Param('id') id: string) {
    return this.usersService.getStudentById(id);
  }

  // ─── GET /users/faculty/:id ───────────────────────────────────────────────────
  @Get('faculty/:id')
  @Roles(Role.ADMIN)
  getFacultyById(@Param('id') id: string) {
    return this.usersService.getFacultyById(id);
  }

  // ─── PATCH /users/:id/deactivate ─────────────────────────────────────────────
  @Patch(':id/deactivate')
  @Roles(Role.ADMIN)
  deactivateUser(@Param('id') id: string) {
    return this.usersService.deactivateUser(id);
  }
}
