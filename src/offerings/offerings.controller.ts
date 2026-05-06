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

import { OfferingsService } from './offerings.service';
import {
  BulkCreateTimetableSlotsDto,
  ConflictCheckQueryDto,
  CreateClassroomDto,
  CreateCourseAssignmentDto,
  CreateCourseDto,
  CreateOfferingDto,
  CreateTimetableSlotDto,
  UpdateClassroomDto,
  UpdateCourseDto,
  UpdateOfferingDto,
  UpdateTimetableSlotDto,
} from './dto/offerings.dto';
import { Day } from '@prisma/client';

// ----------------------------------------------------------------------------
// /courses (Module 5)
// ----------------------------------------------------------------------------

@ApiTags('Courses')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('courses')
export class CoursesV2Controller {
  constructor(private readonly service: OfferingsService) {}

  @Get()
  @ModuleName('Courses')
  @Permissions('courses.course.read')
  list(
    @Query('departmentId') departmentId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.service.listCourses({ departmentId, type, status, search });
  }

  @Get(':id')
  @ModuleName('Courses')
  @Permissions('courses.course.read')
  get(@Param('id') id: string) {
    return this.service.getCourse(id);
  }

  @Post()
  @ModuleName('Courses')
  @Permissions('courses.course.create')
  create(@Body() dto: CreateCourseDto) {
    return this.service.createCourse(dto);
  }

  @Patch(':id')
  @ModuleName('Courses')
  @Permissions('courses.course.update')
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.service.updateCourse(id, dto);
  }

  @Delete(':id')
  @ModuleName('Courses')
  @Permissions('courses.course.delete')
  remove(@Param('id') id: string) {
    return this.service.deleteCourse(id);
  }
}

// ----------------------------------------------------------------------------
// /classrooms
// ----------------------------------------------------------------------------

@ApiTags('Classrooms')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('classrooms')
export class ClassroomsController {
  constructor(private readonly service: OfferingsService) {}

  @Get()
  @ModuleName('Courses')
  @Permissions('courses.course.read')
  list() {
    return this.service.listClassrooms();
  }

  @Get(':id')
  @ModuleName('Courses')
  @Permissions('courses.course.read')
  get(@Param('id') id: string) {
    return this.service.getClassroom(id);
  }

  @Post()
  @ModuleName('Courses')
  @Permissions('courses.course.create')
  create(@Body() dto: CreateClassroomDto) {
    return this.service.createClassroom(dto);
  }

  @Patch(':id')
  @ModuleName('Courses')
  @Permissions('courses.course.update')
  update(@Param('id') id: string, @Body() dto: UpdateClassroomDto) {
    return this.service.updateClassroom(id, dto);
  }

  @Delete(':id')
  @ModuleName('Courses')
  @Permissions('courses.course.delete')
  remove(@Param('id') id: string) {
    return this.service.deleteClassroom(id);
  }
}

// ----------------------------------------------------------------------------
// /offerings + nested /teachers + /timetable
// ----------------------------------------------------------------------------

@ApiTags('Offerings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('offerings')
export class OfferingsController {
  constructor(private readonly service: OfferingsService) {}

  @Get()
  @ModuleName('Courses')
  @Permissions('courses.offering.read')
  list(
    @Query('courseId') courseId?: string,
    @Query('semesterId') semesterId?: string,
    @Query('batchId') batchId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.listOfferings({
      courseId,
      semesterId,
      batchId,
      teacherId,
      status,
    });
  }

  @Get(':id')
  @ModuleName('Courses')
  @Permissions('courses.offering.read')
  get(@Param('id') id: string) {
    return this.service.getOffering(id);
  }

  @Post()
  @ModuleName('Courses')
  @Permissions('courses.offering.create')
  create(@Body() dto: CreateOfferingDto) {
    return this.service.createOffering(dto);
  }

  @Patch(':id')
  @ModuleName('Courses')
  @Permissions('courses.offering.update')
  update(@Param('id') id: string, @Body() dto: UpdateOfferingDto) {
    return this.service.updateOffering(id, dto);
  }

  @Delete(':id')
  @ModuleName('Courses')
  @Permissions('courses.offering.delete')
  remove(@Param('id') id: string) {
    return this.service.deleteOffering(id);
  }

  // ---------- nested teachers ----------

  @Get(':id/teachers')
  @ModuleName('Courses')
  @Permissions('courses.offering.read')
  listTeachers(@Param('id') id: string) {
    return this.service.listAssignments(id);
  }

  @Post(':id/teachers')
  @ModuleName('Courses')
  @Permissions('courses.offering.update')
  assignTeacher(
    @Param('id') id: string,
    @Body() dto: CreateCourseAssignmentDto,
  ) {
    return this.service.assignTeacher(id, dto);
  }

  @Delete(':id/teachers/:assignmentId')
  @ModuleName('Courses')
  @Permissions('courses.offering.update')
  unassignTeacher(
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.service.unassignTeacher(id, assignmentId);
  }

  @Get(':id/timetable')
  @ModuleName('Courses')
  @Permissions('courses.offering.read')
  offeringTimetable(@Param('id') id: string) {
    return this.service.listTimetableSlots({ offeringId: id });
  }
}

// ----------------------------------------------------------------------------
// /timetable-slots and /timetable
// ----------------------------------------------------------------------------

@ApiTags('Timetable')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller()
export class TimetableSlotsController {
  constructor(private readonly service: OfferingsService) {}

  @Get('timetable-slots')
  @ModuleName('Courses')
  @Permissions('courses.offering.read')
  list(
    @Query('teacherId') teacherId?: string,
    @Query('roomId') roomId?: string,
    @Query('offeringId') offeringId?: string,
    @Query('day') day?: Day,
  ) {
    return this.service.listTimetableSlots({ teacherId, roomId, offeringId, day });
  }

  @Get('timetable-slots/:id')
  @ModuleName('Courses')
  @Permissions('courses.offering.read')
  get(@Param('id') id: string) {
    return this.service.getTimetableSlot(id);
  }

  @Post('timetable-slots')
  @ModuleName('Courses')
  @Permissions('courses.offering.update')
  create(@Body() dto: CreateTimetableSlotDto) {
    return this.service.createTimetableSlot(dto);
  }

  @Patch('timetable-slots/:id')
  @ModuleName('Courses')
  @Permissions('courses.offering.update')
  update(@Param('id') id: string, @Body() dto: UpdateTimetableSlotDto) {
    return this.service.updateTimetableSlot(id, dto);
  }

  @Delete('timetable-slots/:id')
  @ModuleName('Courses')
  @Permissions('courses.offering.update')
  remove(@Param('id') id: string) {
    return this.service.deleteTimetableSlot(id);
  }

  @Post('timetable-slots/bulk')
  @ModuleName('Courses')
  @Permissions('courses.offering.update')
  bulkCreate(@Body() dto: BulkCreateTimetableSlotsDto) {
    return this.service.bulkCreateTimetableSlots(dto);
  }

  @Get('timetable/conflicts')
  @ModuleName('Courses')
  @Permissions('courses.offering.read')
  @ApiOperation({ summary: 'Check timetable conflicts before saving' })
  conflicts(@Query() query: ConflictCheckQueryDto) {
    return this.service.checkConflicts(query);
  }

  @Get('timetable')
  @ModuleName('Courses')
  @Permissions('courses.offering.read')
  @ApiOperation({ summary: 'Composite timetable grid (by batch / teacher / room)' })
  composite(
    @Query('batchId') batchId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('roomId') roomId?: string,
    @Query('offeringId') offeringId?: string,
  ) {
    return this.service.timetableView({ batchId, teacherId, roomId, offeringId });
  }
}
