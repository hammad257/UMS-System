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

import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

import { JwtAuthGuard } from '../common/guards/Jwt auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { Roles } from '../common/guards/roles.decorator';

import { Role } from '../common/types';

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

@Controller('attendance')
@ApiTags('Attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ─── MARK ATTENDANCE ────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FACULTY, Role.ADMIN)
  @Post('mark')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mark attendance (Faculty/Admin)' })
  @ApiBody({ type: MarkAttendanceDto })
  @ApiResponse({ status: 201, description: 'Attendance marked successfully' })
  markAttendance(@Body() dto: MarkAttendanceDto) {
    return this.attendanceService.markAttendance(dto);
  }

  // ─── STUDENT ATTENDANCE ─────────────────────────────────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT, Role.ADMIN)
  @Get('student/:studentId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get attendance of a student' })
  @ApiParam({ name: 'studentId', example: 'student-uuid' })
  @ApiResponse({ status: 200, description: 'Student attendance fetched' })
  getStudentAttendance(@Param('studentId') studentId: string) {
    return this.attendanceService.getStudentAttendance(studentId);
  }

  // ─── SECTION ATTENDANCE ─────────────────────────────────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FACULTY, Role.ADMIN)
  @Get('section/:sectionId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get attendance of a section' })
  @ApiParam({ name: 'sectionId', example: 'section-uuid' })
  @ApiResponse({ status: 200, description: 'Section attendance fetched' })
  getSectionAttendance(@Param('sectionId') sectionId: string) {
    return this.attendanceService.getSectionAttendance(sectionId);
  }

  // ─── UPDATE ─────────────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FACULTY, Role.ADMIN)
  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update attendance record' })
  @ApiParam({ name: 'id', example: 'attendance-uuid' })
  @ApiBody({ type: UpdateAttendanceDto })
  @ApiResponse({ status: 200, description: 'Attendance updated successfully' })
  update(@Param('id') id: string, @Body() dto: UpdateAttendanceDto) {
    return this.attendanceService.updateAttendance(id, dto);
  }

  // ─── DELETE ─────────────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete attendance (Admin only)' })
  @ApiParam({ name: 'id', example: 'attendance-uuid' })
  @ApiResponse({ status: 200, description: 'Attendance deleted successfully' })
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.attendanceService.deleteAttendance(id);
  }
}