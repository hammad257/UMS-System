import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AcademicService } from './academic.service';
import {
  CreateCourseDto,
  CreateDepartmentDto,
  CreateProgramCourseDto,
  CreateProgramDto,
  CreateSectionDto,
  CreateSemesterCourseDto,
  CreateSemesterDto,
} from './dto/academic.dto';
import { JwtAuthGuard } from '../common/guards/Jwt auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { Roles } from '../common/guards/roles.decorator';
// import { Role } from '../common/types';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from 'src/common/guards/permissions.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { ModuleName } from 'src/common/guards/permissions.module.decorator';

@ApiTags('Academic')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('academic')
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  @Post('departments')
  @ModuleName('Academic')
  @Permissions("department.create")
  @ApiOperation({ summary: 'Create department (Admin only)' })
  @ApiBody({ type: CreateDepartmentDto })
  createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.academicService.createDepartment(dto);
  }

  @Get('departments')
  @ApiOperation({ summary: 'Get all departments' })
  getDepartments() {
    return this.academicService.getDepartments();
  }

  @Post('programs')
  @ModuleName('Academic')
  // @Roles('ADMIN')
  @Permissions("programs.create")
  @ApiOperation({ summary: 'Create program under department (Admin only)' })
  @ApiBody({ type: CreateProgramDto })
  createProgram(@Body() dto: CreateProgramDto) {
    return this.academicService.createProgram(dto);
  }

  @Get('programs')
  @ApiOperation({ summary: 'Get all programs' })
  getPrograms() {
    return this.academicService.getPrograms();
  }

  @Post('courses')
  @ModuleName('Academic')
  @Permissions("course.create")
  // @Roles('ADMIN')
  @ApiOperation({ summary: 'Create course (Admin only)' })
  @ApiBody({ type: CreateCourseDto })
  createCourse(@Body() dto: CreateCourseDto) {
    return this.academicService.createCourse(dto);
  }

  @Get('courses')
  @ApiOperation({ summary: 'Get all courses' })
  getCourses() {
    return this.academicService.getCourses();
  }

  @Post('semesters')
  @ModuleName('Academic')
  @Permissions("semester.create")
  // @Roles('ADMIN')
  @ApiOperation({ summary: 'Create semester (Admin only)' })
  @ApiBody({ type: CreateSemesterDto })
  createSemester(@Body() dto: CreateSemesterDto) {
    return this.academicService.createSemester(dto);
  }

  @Get('semesters')
  @ApiOperation({ summary: 'Get all semesters' })
  getSemesters() {
    return this.academicService.getAllSemesters();
  }

  @Post('sections')
  @ModuleName('Academic')
  @Permissions("section.create")
  // @Roles('ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Create section (Admin/Faculty)' })
  @ApiBody({ type: CreateSectionDto })
  createSection(@Body() dto: CreateSectionDto) {
    return this.academicService.createSection(dto);
  }

  @Get('sections')
  @ApiOperation({ summary: 'Get all sections' })
  getSections() {
    return this.academicService.getSections();
  }

  @Post('program-courses')
// @ModuleName('Academic')
// @Permissions("programcourse.create")
@ApiOperation({ summary: 'Assign course to program' })
createProgramCourse(@Body() dto: CreateProgramCourseDto) {
  return this.academicService.createProgramCourse(dto);
}

@Get('program-courses')
@ApiOperation({ summary: 'Get program courses' })
getProgramCourses() {
  return this.academicService.getProgramCourses();
}

@Post('semester-courses')
// @ModuleName('Academic')
// @Permissions("semestercourse.create")
@ApiOperation({ summary: 'Assign course to semester' })
createSemesterCourse(@Body() dto: CreateSemesterCourseDto) {
  return this.academicService.createSemesterCourse(dto);
}

@Get('semester-courses')
@ApiOperation({ summary: 'Get semester courses' })
getSemesterCourses() {
  return this.academicService.getSemesterCourses();
}
}
