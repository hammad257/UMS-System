import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AcademicService } from './academic.service';
import {
  CreateCourseDto,
  CreateDepartmentDto,
  CreateProgramDto,
  CreateSectionDto,
  CreateSemesterDto,
} from './dto/academic.dto';
import { JwtAuthGuard } from '../common/guards/Jwt auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { Roles } from '../common/guards/roles.decorator';
import { Role } from '../common/types';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Academic')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academic')
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  @Post('departments')
  @Roles(Role.ADMIN)
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
  @Roles(Role.ADMIN)
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
  @Roles(Role.ADMIN)
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
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create semester (Admin only)' })
  @ApiBody({ type: CreateSemesterDto })
  createSemester(@Body() dto: CreateSemesterDto) {
    return this.academicService.createSemester(dto);
  }

  @Get('semesters')
  @ApiOperation({ summary: 'Get all semesters' })
  getSemesters() {
    return this.academicService.getSemesters();
  }

  @Post('sections')
  @Roles(Role.ADMIN, Role.FACULTY)
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
}
