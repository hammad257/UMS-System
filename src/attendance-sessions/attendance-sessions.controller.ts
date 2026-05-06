import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/permissions.decorator';
import { ModuleName } from '../common/guards/permissions.module.decorator';
import { CurrentUser } from '../common/guards/roles.decorator';
import type { AuthUser } from '../common/types';

import { AttendanceSessionsService } from './attendance-sessions.service';
import {
  CreateAttendanceSessionDto,
  GenerateSessionsDto,
  MarkAttendanceDto,
  UpdateAttendanceRecordDto,
  UpdateAttendanceSessionDto,
} from './dto/attendance-session.dto';
import { SessionStatus } from '@prisma/client';

@ApiTags('Attendance Sessions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('attendance/sessions')
export class AttendanceSessionsController {
  constructor(private readonly service: AttendanceSessionsService) {}

  @Get()
  @ModuleName('Attendance')
  @Permissions('attendance.session.read')
  list(
    @Query('offeringId') offeringId?: string,
    @Query('date') date?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('teacherId') teacherId?: string,
    @Query('status') status?: SessionStatus,
  ) {
    return this.service.listSessions({
      offeringId,
      date,
      dateFrom,
      dateTo,
      teacherId,
      status,
    });
  }

  @Get(':id')
  @ModuleName('Attendance')
  @Permissions('attendance.session.read')
  get(@Param('id') id: string) {
    return this.service.getSession(id);
  }

  @Post()
  @ModuleName('Attendance')
  @Permissions('attendance.session.create')
  create(
    @Body() dto: CreateAttendanceSessionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.createSession(dto, user?.id);
  }

  @Patch(':id')
  @ModuleName('Attendance')
  @Permissions('attendance.session.update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceSessionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.updateSession(id, dto, user?.id);
  }

  @Delete(':id')
  @ModuleName('Attendance')
  @Permissions('attendance.session.update')
  remove(@Param('id') id: string) {
    return this.service.deleteSession(id);
  }

  @Post('generate')
  @ModuleName('Attendance')
  @Permissions('attendance.session.create')
  @ApiOperation({ summary: 'Generate sessions from a timetable for a date window' })
  generate(@Body() dto: GenerateSessionsDto, @CurrentUser() user: AuthUser) {
    return this.service.generateSessions(dto, user?.id);
  }

  // -------- records --------

  @Get(':id/records')
  @ModuleName('Attendance')
  @Permissions('attendance.record.read')
  records(@Param('id') id: string) {
    return this.service.getRecords(id);
  }

  @Put(':id/records')
  @ModuleName('Attendance')
  @Permissions('attendance.record.create')
  @ApiOperation({ summary: 'Bulk-mark attendance for a session (upsert)' })
  mark(
    @Param('id') id: string,
    @Body() dto: MarkAttendanceDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.markAttendance(id, dto, user?.id);
  }

  @Patch(':id/records/:recordId')
  @ModuleName('Attendance')
  @Permissions('attendance.record.update')
  updateRecord(
    @Param('id') id: string,
    @Param('recordId') recordId: string,
    @Body() dto: UpdateAttendanceRecordDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.updateRecord(id, recordId, dto, user?.id);
  }
}

@ApiTags('Attendance Reports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('attendance/reports')
export class AttendanceReportsController {
  constructor(private readonly service: AttendanceSessionsService) {}

  @Get('student/:studentId')
  @ModuleName('Attendance')
  @Permissions('attendance.session.read')
  studentReport(
    @Param('studentId') studentId: string,
    @Query('offeringId') offeringId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.studentReport(studentId, { offeringId, from, to });
  }

  @Get('offering/:offeringId')
  @ModuleName('Attendance')
  @Permissions('attendance.session.read')
  offeringReport(@Param('offeringId') offeringId: string) {
    return this.service.offeringReport(offeringId);
  }

  @Get('institution')
  @ModuleName('Attendance')
  @Permissions('attendance.session.read')
  institutionReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.service.institutionReport({ from, to, departmentId });
  }
}
