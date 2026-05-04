import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AcademicService } from './academic.service';
import {
  CreateAcademicSessionDto,
  CreateCourseDto,
  CreateDepartmentDto,
  CreateProgramCourseDto,
  CreateProgramDto,
  CreateSectionDto,
  CreateSemesterCourseDto,
  CreateSemesterDto,
  InitializeSessionDto,
  UpdateAcademicSessionDto,
  UpdateDepartmentDto,
  UpdateProgramDto,
  UpdateSemesterDto,
} from './dto/academic.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/guards/roles.decorator';
import { Permissions } from '../common/guards/permissions.decorator';
import { ModuleName } from '../common/guards/permissions.module.decorator';
import { Role } from '../common/types';

@ApiTags('Academic')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('academic')
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  // -------------------------------------------------------------------------
  // Hierarchy & Calendar (Module 3 §Special endpoint)
  // -------------------------------------------------------------------------
  @Get('hierarchy')
  @ApiOperation({ summary: 'Programmatic hierarchy tree' })
  getHierarchy() {
    return this.academicService.getHierarchy();
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Sessions with their semesters' })
  getCalendar() {
    return this.academicService.getCalendar();
  }

  // -------------------------------------------------------------------------
  // Departments
  // -------------------------------------------------------------------------
  @Post('departments')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.REGISTRAR)
  @ModuleName('Academic')
  @Permissions('academic.department.create')
  createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.academicService.createDepartment(dto);
  }

  @Get('departments')
  @ModuleName('Academic')
  @Permissions('academic.department.read')
  getDepartments() {
    return this.academicService.getDepartments();
  }

  @Patch('departments/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ModuleName('Academic')
  @Permissions('academic.department.update')
  updateDepartment(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.academicService.updateDepartment(id, dto);
  }

  @Delete('departments/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ModuleName('Academic')
  @Permissions('academic.department.delete')
  deleteDepartment(@Param('id') id: string) {
    return this.academicService.deleteDepartment(id);
  }

  // -------------------------------------------------------------------------
  // Programs
  // -------------------------------------------------------------------------
  @Post('programs')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.REGISTRAR)
  @ModuleName('Academic')
  @Permissions('academic.program.create')
  createProgram(@Body() dto: CreateProgramDto) {
    return this.academicService.createProgram(dto);
  }

  @Get('programs')
  @ModuleName('Academic')
  @Permissions('academic.program.read')
  getPrograms() {
    return this.academicService.getPrograms();
  }

  @Patch('programs/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ModuleName('Academic')
  @Permissions('academic.program.update')
  updateProgram(@Param('id') id: string, @Body() dto: UpdateProgramDto) {
    return this.academicService.updateProgram(id, dto);
  }

  @Delete('programs/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ModuleName('Academic')
  @Permissions('academic.program.delete')
  deleteProgram(@Param('id') id: string) {
    return this.academicService.deleteProgram(id);
  }

  // -------------------------------------------------------------------------
  // Courses
  // -------------------------------------------------------------------------
  @Post('courses')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.REGISTRAR)
  createCourse(@Body() dto: CreateCourseDto) {
    return this.academicService.createCourse(dto);
  }

  @Get('courses')
  getCourses() {
    return this.academicService.getCourses();
  }

  // -------------------------------------------------------------------------
  // Academic Sessions
  // -------------------------------------------------------------------------
  @Post('sessions')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ModuleName('Academic')
  @Permissions('academic.semester.create')
  createSession(@Body() dto: CreateAcademicSessionDto) {
    return this.academicService.createAcademicSession(dto);
  }

  @Get('sessions')
  @ModuleName('Academic')
  @Permissions('academic.semester.read')
  getSessions() {
    return this.academicService.getAcademicSessions();
  }

  @Patch('sessions/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ModuleName('Academic')
  @Permissions('academic.semester.update')
  updateSession(
    @Param('id') id: string,
    @Body() dto: UpdateAcademicSessionDto,
  ) {
    return this.academicService.updateAcademicSession(id, dto);
  }

  @Delete('sessions/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ModuleName('Academic')
  @Permissions('academic.semester.delete')
  deleteSession(@Param('id') id: string) {
    return this.academicService.deleteAcademicSession(id);
  }

  @Post('sessions/:id/initialize')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ModuleName('Academic')
  @Permissions('academic.semester.create')
  initializeSession(
    @Param('id') id: string,
    @Body() dto: InitializeSessionDto,
  ) {
    return this.academicService.initializeSession(id, dto);
  }

  // -------------------------------------------------------------------------
  // Semesters
  // -------------------------------------------------------------------------
  @Post('semesters')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ModuleName('Academic')
  @Permissions('academic.semester.create')
  createSemester(@Body() dto: CreateSemesterDto) {
    return this.academicService.createSemester(dto);
  }

  @Get('semesters')
  @ModuleName('Academic')
  @Permissions('academic.semester.read')
  getSemesters() {
    return this.academicService.getAllSemesters();
  }

  @Patch('semesters/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ModuleName('Academic')
  @Permissions('academic.semester.update')
  updateSemester(@Param('id') id: string, @Body() dto: UpdateSemesterDto) {
    return this.academicService.updateSemester(id, dto);
  }

  @Delete('semesters/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ModuleName('Academic')
  @Permissions('academic.semester.delete')
  deleteSemester(@Param('id') id: string) {
    return this.academicService.deleteSemester(id);
  }

  // -------------------------------------------------------------------------
  // Sections
  // -------------------------------------------------------------------------
  @Post('sections')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.REGISTRAR)
  createSection(@Body() dto: CreateSectionDto) {
    return this.academicService.createSection(dto);
  }

  @Get('sections')
  getSections() {
    return this.academicService.getSections();
  }

  // -------------------------------------------------------------------------
  // Curriculum joins
  // -------------------------------------------------------------------------
  @Post('program-courses')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  createProgramCourse(@Body() dto: CreateProgramCourseDto) {
    return this.academicService.createProgramCourse(dto);
  }

  @Get('program-courses')
  getProgramCourses() {
    return this.academicService.getProgramCourses();
  }

  @Post('semester-courses')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  createSemesterCourse(@Body() dto: CreateSemesterCourseDto) {
    return this.academicService.createSemesterCourse(dto);
  }

  @Get('semester-courses')
  getSemesterCourses() {
    return this.academicService.getSemesterCourses();
  }
}
