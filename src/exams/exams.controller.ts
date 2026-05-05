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

import { ExamsService } from './exams.service';
import {
  CreateExamDto,
  CreateExamTypeDto,
  CreateGradingSchemeDto,
  MarkExamDto,
  SetActiveSchemeDto,
  UpdateExamDto,
  UpdateExamTypeDto,
  UpdateGradingSchemeDto,
  UpdateMarkDto,
} from './dto/exams.dto';
import { ExamStatus } from '@prisma/client';

// ----------------------------------------------------------------------------
// /exam-types
// ----------------------------------------------------------------------------

@ApiTags('Exam Types')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('exam-types')
export class ExamTypesController {
  constructor(private readonly service: ExamsService) {}

  @Get()
  @ModuleName('Exams')
  @Permissions('exams.exam.read')
  list() {
    return this.service.listExamTypes();
  }

  @Get(':id')
  @ModuleName('Exams')
  @Permissions('exams.exam.read')
  get(@Param('id') id: string) {
    return this.service.getExamType(id);
  }

  @Post()
  @ModuleName('Exams')
  @Permissions('exams.exam.create')
  create(@Body() dto: CreateExamTypeDto) {
    return this.service.createExamType(dto);
  }

  @Patch(':id')
  @ModuleName('Exams')
  @Permissions('exams.exam.update')
  update(@Param('id') id: string, @Body() dto: UpdateExamTypeDto) {
    return this.service.updateExamType(id, dto);
  }

  @Delete(':id')
  @ModuleName('Exams')
  @Permissions('exams.exam.delete')
  remove(@Param('id') id: string) {
    return this.service.deleteExamType(id);
  }
}

// ----------------------------------------------------------------------------
// /exams + /exams/:id/marks
// ----------------------------------------------------------------------------

@ApiTags('Exams')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('exams')
export class ExamsController {
  constructor(private readonly service: ExamsService) {}

  @Get()
  @ModuleName('Exams')
  @Permissions('exams.exam.read')
  list(
    @Query('offeringId') offeringId?: string,
    @Query('examTypeId') examTypeId?: string,
    @Query('status') status?: ExamStatus,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.service.listExams({
      offeringId,
      examTypeId,
      status,
      dateFrom,
      dateTo,
    });
  }

  @Get(':id')
  @ModuleName('Exams')
  @Permissions('exams.exam.read')
  get(@Param('id') id: string) {
    return this.service.getExam(id);
  }

  @Post()
  @ModuleName('Exams')
  @Permissions('exams.exam.create')
  create(@Body() dto: CreateExamDto) {
    return this.service.createExam(dto);
  }

  @Patch(':id')
  @ModuleName('Exams')
  @Permissions('exams.exam.update')
  update(@Param('id') id: string, @Body() dto: UpdateExamDto) {
    return this.service.updateExam(id, dto);
  }

  @Delete(':id')
  @ModuleName('Exams')
  @Permissions('exams.exam.delete')
  remove(@Param('id') id: string) {
    return this.service.deleteExam(id);
  }

  @Get(':id/marks')
  @ModuleName('Exams')
  @Permissions('exams.marks.read')
  marksRoster(@Param('id') id: string) {
    return this.service.getMarksRoster(id);
  }

  @Put(':id/marks')
  @ModuleName('Exams')
  @Permissions('exams.marks.create')
  @ApiOperation({ summary: 'Bulk submit/upsert marks for an exam' })
  submitMarks(
    @Param('id') id: string,
    @Body() dto: MarkExamDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.submitMarks(id, dto, user?.id);
  }

  @Patch(':id/marks/:markId')
  @ModuleName('Exams')
  @Permissions('exams.marks.update')
  updateMark(
    @Param('id') id: string,
    @Param('markId') markId: string,
    @Body() dto: UpdateMarkDto,
  ) {
    return this.service.updateSingleMark(id, markId, dto);
  }
}

// ----------------------------------------------------------------------------
// /grading-schemes
// ----------------------------------------------------------------------------

@ApiTags('Grading Schemes')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('grading-schemes')
export class GradingSchemesController {
  constructor(private readonly service: ExamsService) {}

  @Get()
  @ModuleName('Exams')
  @Permissions('exams.exam.read')
  list() {
    return this.service.listSchemes();
  }

  @Get('active')
  @ModuleName('Exams')
  @Permissions('exams.exam.read')
  active() {
    return this.service.getActiveScheme();
  }

  @Get(':id')
  @ModuleName('Exams')
  @Permissions('exams.exam.read')
  get(@Param('id') id: string) {
    return this.service.getScheme(id);
  }

  @Post()
  @ModuleName('Exams')
  @Permissions('exams.exam.create')
  create(@Body() dto: CreateGradingSchemeDto) {
    return this.service.createScheme(dto);
  }

  @Patch(':id')
  @ModuleName('Exams')
  @Permissions('exams.exam.update')
  update(@Param('id') id: string, @Body() dto: UpdateGradingSchemeDto) {
    return this.service.updateScheme(id, dto);
  }

  @Post('active')
  @ModuleName('Exams')
  @Permissions('exams.exam.update')
  setActive(@Body() dto: SetActiveSchemeDto) {
    return this.service.setActiveScheme(dto);
  }

  @Delete(':id')
  @ModuleName('Exams')
  @Permissions('exams.exam.delete')
  remove(@Param('id') id: string) {
    return this.service.deleteScheme(id);
  }
}

// ----------------------------------------------------------------------------
// /results
// ----------------------------------------------------------------------------

@ApiTags('Results')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('results')
export class ResultsController {
  constructor(private readonly service: ExamsService) {}

  @Get('offering/:offeringId')
  @ModuleName('Exams')
  @Permissions('exams.marks.read')
  offering(@Param('offeringId') offeringId: string) {
    return this.service.offeringResults(offeringId);
  }

  @Get('student/:studentId/offering/:offeringId')
  @ModuleName('Exams')
  @Permissions('exams.marks.read')
  studentOffering(
    @Param('studentId') studentId: string,
    @Param('offeringId') offeringId: string,
  ) {
    return this.service.studentOfferingResult(studentId, offeringId);
  }

  @Get('student/:studentId/transcript')
  @ModuleName('Exams')
  @Permissions('exams.marks.read')
  transcript(
    @Param('studentId') studentId: string,
    @Query('semesterId') semesterId?: string,
  ) {
    return this.service.studentTranscript(studentId, semesterId);
  }
}
