import {
    Controller,
    Post,
    Body,
    Get,
    Param,
    Patch,
    Delete,
    UseGuards,
    HttpCode,
    HttpStatus,
  } from '@nestjs/common';
  import { EnrollmentService } from './enrollment.service';
  import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
  import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
  import { JwtAuthGuard } from '../common/guards/Jwt auth.guard';
  import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
  
  @Controller('enrollments')
  @ApiTags('Enrollment')
  export class EnrollmentController {
    constructor(private readonly enrollmentService: EnrollmentService) {}
  
    // ─── CREATE ────────────────────────────────────────────────────────────────
    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Enroll student into section (Admin)' })
    @ApiBody({ type: CreateEnrollmentDto })
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateEnrollmentDto) {
      return this.enrollmentService.create(dto);
    }
  
    // ─── GET ALL ───────────────────────────────────────────────────────────────
    @UseGuards(JwtAuthGuard)
    @Get()
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Get all enrollments (Admin)' })
    findAll() {
      return this.enrollmentService.findAll();
    }
  
    // ─── STUDENT ENROLLMENTS ───────────────────────────────────────────────────
    @UseGuards(JwtAuthGuard)
    @Get('student/:studentId')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Get student enrollments' })
    findByStudent(@Param('studentId') studentId: string) {
      return this.enrollmentService.findByStudent(studentId);
    }
  
    // ─── SECTION STUDENTS ──────────────────────────────────────────────────────
    @UseGuards(JwtAuthGuard)
    @Get('section/:sectionId')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Get students in a section (Faculty)' })
    findBySection(@Param('sectionId') sectionId: string) {
      return this.enrollmentService.findBySection(sectionId);
    }
  
    // ─── UPDATE ────────────────────────────────────────────────────────────────
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Update enrollment status' })
    update(@Param('id') id: string, @Body() dto: UpdateEnrollmentDto) {
      return this.enrollmentService.update(id, dto);
    }
  
    // ─── DELETE ────────────────────────────────────────────────────────────────
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Delete enrollment (Admin)' })
    @HttpCode(HttpStatus.OK)
    remove(@Param('id') id: string) {
      return this.enrollmentService.remove(id);
    }
  }