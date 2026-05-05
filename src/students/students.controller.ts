import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/permissions.decorator';
import { ModuleName } from '../common/guards/permissions.module.decorator';

import { StudentsService } from './students.service';
import {
  CreateGuardianDto,
  CreateStudentDto,
  LinkGuardianDto,
  ListStudentsQueryDto,
  PromoteStudentToUserDto,
  TransitionStudentDto,
  UpdateGuardianDto,
  UpdateLinkGuardianDto,
  UpdateStudentDto,
} from './dto/students.dto';

// ----------------------------------------------------------------------------
// /students
// ----------------------------------------------------------------------------

@ApiTags('Students')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly service: StudentsService) {}

  @Get()
  @ModuleName('Students')
  @Permissions('students.student.read')
  list(@Query() query: ListStudentsQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ModuleName('Students')
  @Permissions('students.student.read')
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ModuleName('Students')
  @Permissions('students.student.create')
  @ApiOperation({ summary: 'Create student (optionally with login user)' })
  create(@Body() dto: CreateStudentDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ModuleName('Students')
  @Permissions('students.student.update')
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ModuleName('Students')
  @Permissions('students.student.delete')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/transition')
  @ModuleName('Students')
  @Permissions('students.enrollment.update')
  @ApiOperation({ summary: 'Atomic semester / program transition' })
  transition(@Param('id') id: string, @Body() dto: TransitionStudentDto) {
    return this.service.transition(id, dto);
  }

  @Get(':id/enrollment-history')
  @ModuleName('Students')
  @Permissions('students.enrollment.read')
  enrollmentHistory(@Param('id') id: string) {
    return this.service.enrollmentHistory(id);
  }

  @Post(':id/user')
  @ModuleName('Identity')
  @Permissions('identity.user.create')
  promote(@Param('id') id: string, @Body() dto: PromoteStudentToUserDto) {
    return this.service.promoteToUser(id, dto);
  }

  @Delete(':id/user')
  @ModuleName('Identity')
  @Permissions('identity.user.delete')
  demote(@Param('id') id: string) {
    return this.service.demoteFromUser(id);
  }

  // ---- nested guardians ----

  @Get(':id/guardians')
  @ModuleName('Students')
  @Permissions('students.guardian.read')
  listGuardians(@Param('id') id: string) {
    return this.service.listGuardians(id);
  }

  @Post(':id/guardians')
  @ModuleName('Students')
  @Permissions('students.guardian.create')
  linkGuardian(@Param('id') id: string, @Body() dto: LinkGuardianDto) {
    return this.service.linkGuardian(id, dto);
  }

  @Patch(':id/guardians/:guardianId')
  @ModuleName('Students')
  @Permissions('students.guardian.update')
  updateLink(
    @Param('id') id: string,
    @Param('guardianId') guardianId: string,
    @Body() dto: UpdateLinkGuardianDto,
  ) {
    return this.service.updateLink(id, guardianId, dto);
  }

  @Delete(':id/guardians/:guardianId')
  @ModuleName('Students')
  @Permissions('students.guardian.delete')
  unlinkGuardian(
    @Param('id') id: string,
    @Param('guardianId') guardianId: string,
  ) {
    return this.service.unlinkGuardian(id, guardianId);
  }
}

// ----------------------------------------------------------------------------
// /guardians (independent CRUD)
// ----------------------------------------------------------------------------

@ApiTags('Guardians')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('guardians')
export class GuardiansController {
  constructor(private readonly service: StudentsService) {}

  @Get()
  @ModuleName('Students')
  @Permissions('students.guardian.read')
  list(
    @Query('search') search?: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.service.listAllGuardians({ search, studentId });
  }

  @Get(':id')
  @ModuleName('Students')
  @Permissions('students.guardian.read')
  get(@Param('id') id: string) {
    return this.service.getGuardian(id);
  }

  @Post()
  @ModuleName('Students')
  @Permissions('students.guardian.create')
  create(@Body() dto: CreateGuardianDto) {
    return this.service.createGuardian(dto);
  }

  @Patch(':id')
  @ModuleName('Students')
  @Permissions('students.guardian.update')
  update(@Param('id') id: string, @Body() dto: UpdateGuardianDto) {
    return this.service.updateGuardian(id, dto);
  }

  @Delete(':id')
  @ModuleName('Students')
  @Permissions('students.guardian.delete')
  remove(@Param('id') id: string) {
    return this.service.deleteGuardian(id);
  }
}
