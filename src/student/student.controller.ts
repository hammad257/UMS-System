import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { StudentService } from './student.service';
import { AddGuardianDto } from './dto/create-student.dto';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateStudentAcademicDto, UpdateStudentProfileDto } from './dto/update-student.dto';
import { Roles } from 'src/common/guards/roles.decorator';
import { Role } from 'src/generated/prisma/enums';
import { ModuleName } from 'src/common/guards/permissions.module.decorator';
import { Permissions } from 'src/common/guards/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/Jwt auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Controller('student')
@ApiTags('Guardian')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) { }

  @Post(':studentId/guardians')
  @Roles(Role.ADMIN)
  @ModuleName('Student')
  @Permissions('studentGuardian.create')
  @ApiOperation({ summary: 'Add guardian' })
  @ApiBody({ type: AddGuardianDto })
  addGuardian(
    @Param('studentId') studentId: string,
    @Body() dto: AddGuardianDto,
  ) {
    return this.studentService.addGuardian(studentId, dto);
  }


  @Patch(':id/profile')
  @Roles(Role.ADMIN)
  @ModuleName('Student')
  @Permissions('StudentProfile.update')
  @ApiOperation({ summary: 'update student profile' })
  updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateStudentProfileDto,
  ) {
    return this.studentService.updateProfile(id, dto);
  }

  @Patch(':id/academic')
  @Roles(Role.ADMIN)
  @ModuleName('Student')
  @Permissions('AcademicProfile.update')
  @ApiOperation({ summary: 'Set Academic information' })
  updateAcademic(
    @Param('id') id: string,
    @Body() dto: UpdateStudentAcademicDto,
  ) {
    return this.studentService.updateAcademic(id, dto);
  }

}
