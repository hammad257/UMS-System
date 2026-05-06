import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ClassroomStatus,
  Day,
  EmployeeRole,
  EmployeeStatus,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
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

export interface SlotConflict {
  id: string;
  type: 'TEACHER' | 'ROOM';
  slot: unknown;
}

@Injectable()
export class OfferingsService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  // Course (Module 5)
  // ===========================================================================

  async createCourse(dto: CreateCourseDto) {
    const dept = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
      select: { id: true },
    });
    if (!dept) throw new NotFoundException('Department not found');

    try {
      const course = await this.prisma.course.create({
        data: {
          code: dto.code,
          title: dto.title,
          departmentId: dto.departmentId,
          creditHours: dto.creditHours,
          type: dto.type,
          description: dto.description,
          status: dto.status,
        },
      });
      return { message: 'Course created', data: course };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Course code already exists');
      }
      throw e;
    }
  }

  async listCourses(filters: {
    departmentId?: string;
    type?: string;
    status?: string;
    search?: string;
  }) {
    const where: Prisma.CourseWhereInput = {};
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.type) where.type = filters.type as any;
    if (filters.status) where.status = filters.status as any;
    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { title: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const courses = await this.prisma.course.findMany({
      where,
      include: {
        department: { select: { id: true, code: true, name: true } },
        _count: { select: { offerings: true } },
      },
      orderBy: { code: 'asc' },
    });
    return { message: 'Courses fetched', data: courses };
  }

  async getCourse(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        department: true,
        _count: { select: { offerings: true } },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    return { message: 'Course fetched', data: course };
  }

  async updateCourse(id: string, dto: UpdateCourseDto) {
    const exists = await this.prisma.course.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Course not found');

    try {
      const updated = await this.prisma.course.update({
        where: { id },
        data: dto,
      });
      return { message: 'Course updated', data: updated };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Course code already exists');
      }
      throw e;
    }
  }

  async deleteCourse(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { _count: { select: { offerings: true, sections: true } } },
    });
    if (!course) throw new NotFoundException('Course not found');
    if (course._count.offerings > 0 || course._count.sections > 0) {
      throw new ConflictException(
        'Cannot delete: course has offerings or sections',
      );
    }
    await this.prisma.course.delete({ where: { id } });
    return { message: 'Course deleted', data: null };
  }

  // ===========================================================================
  // Classroom
  // ===========================================================================

  async createClassroom(dto: CreateClassroomDto) {
    try {
      const classroom = await this.prisma.classroom.create({ data: dto });
      return { message: 'Classroom created', data: classroom };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Classroom code already exists');
      }
      throw e;
    }
  }

  async listClassrooms() {
    const classrooms = await this.prisma.classroom.findMany({
      orderBy: { code: 'asc' },
    });
    return { message: 'Classrooms fetched', data: classrooms };
  }

  async getClassroom(id: string) {
    const c = await this.prisma.classroom.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Classroom not found');
    return { message: 'Classroom fetched', data: c };
  }

  async updateClassroom(id: string, dto: UpdateClassroomDto) {
    const exists = await this.prisma.classroom.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Classroom not found');

    const updated = await this.prisma.classroom.update({
      where: { id },
      data: dto,
    });
    return { message: 'Classroom updated', data: updated };
  }

  async deleteClassroom(id: string) {
    const c = await this.prisma.classroom.findUnique({
      where: { id },
      include: { _count: { select: { slots: true } } },
    });
    if (!c) throw new NotFoundException('Classroom not found');
    if (c._count.slots > 0) {
      throw new ConflictException('Cannot delete: classroom has timetable slots');
    }
    await this.prisma.classroom.delete({ where: { id } });
    return { message: 'Classroom deleted', data: null };
  }

  // ===========================================================================
  // Offering
  // ===========================================================================

  async createOffering(dto: CreateOfferingDto) {
    const [course, semester, batch] = await Promise.all([
      this.prisma.course.findUnique({ where: { id: dto.courseId } }),
      this.prisma.semester.findUnique({ where: { id: dto.semesterId } }),
      this.prisma.batch.findUnique({ where: { id: dto.batchId } }),
    ]);
    if (!course) throw new NotFoundException('Course not found');
    if (!semester) throw new NotFoundException('Semester not found');
    if (!batch) throw new NotFoundException('Batch not found');

    try {
      const offering = await this.prisma.offering.create({ data: dto });
      return { message: 'Offering created', data: offering };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(
          'Offering already exists for this course/semester/batch/section',
        );
      }
      throw e;
    }
  }

  async listOfferings(filters: {
    courseId?: string;
    semesterId?: string;
    batchId?: string;
    teacherId?: string;
    status?: string;
  }) {
    const where: Prisma.OfferingWhereInput = {};
    if (filters.courseId) where.courseId = filters.courseId;
    if (filters.semesterId) where.semesterId = filters.semesterId;
    if (filters.batchId) where.batchId = filters.batchId;
    if (filters.status) where.status = filters.status as any;
    if (filters.teacherId) {
      where.assignments = { some: { teacherId: filters.teacherId } };
    }

    const offerings = await this.prisma.offering.findMany({
      where,
      include: {
        course: { select: { id: true, code: true, title: true, creditHours: true } },
        semester: { select: { id: true, name: true, sequence: true } },
        batch: { select: { id: true, name: true } },
        _count: { select: { assignments: true, slots: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { message: 'Offerings fetched', data: offerings };
  }

  async getOffering(id: string) {
    const offering = await this.prisma.offering.findUnique({
      where: { id },
      include: {
        course: true,
        semester: true,
        batch: true,
        assignments: { include: { teacher: true } },
        slots: { include: { teacher: true, room: true } },
      },
    });
    if (!offering) throw new NotFoundException('Offering not found');
    return { message: 'Offering fetched', data: offering };
  }

  async updateOffering(id: string, dto: UpdateOfferingDto) {
    const exists = await this.prisma.offering.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Offering not found');

    try {
      const updated = await this.prisma.offering.update({
        where: { id },
        data: dto,
      });
      return { message: 'Offering updated', data: updated };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(
          'Offering already exists for this course/semester/batch/section',
        );
      }
      throw e;
    }
  }

  async deleteOffering(id: string) {
    const exists = await this.prisma.offering.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Offering not found');

    // Cascade through schema (CourseAssignment / TimetableSlot / AttendanceSession / Exam).
    await this.prisma.offering.delete({ where: { id } });
    return { message: 'Offering deleted', data: null };
  }

  // ===========================================================================
  // CourseAssignment
  // ===========================================================================

  async listAssignments(offeringId: string) {
    const offering = await this.prisma.offering.findUnique({
      where: { id: offeringId },
    });
    if (!offering) throw new NotFoundException('Offering not found');

    const assignments = await this.prisma.courseAssignment.findMany({
      where: { offeringId },
      include: { teacher: true },
      orderBy: { createdAt: 'asc' },
    });
    return { message: 'Assignments fetched', data: assignments };
  }

  async assignTeacher(offeringId: string, dto: CreateCourseAssignmentDto) {
    const offering = await this.prisma.offering.findUnique({
      where: { id: offeringId },
    });
    if (!offering) throw new NotFoundException('Offering not found');

    const teacher = await this.prisma.employee.findUnique({
      where: { id: dto.teacherId },
    });
    if (!teacher) throw new NotFoundException('Teacher (employee) not found');
    if (teacher.role !== EmployeeRole.TEACHER) {
      throw new BadRequestException('Employee role must be TEACHER');
    }
    if (teacher.status === EmployeeStatus.INACTIVE) {
      throw new BadRequestException('Cannot assign an INACTIVE teacher');
    }

    try {
      const assignment = await this.prisma.courseAssignment.create({
        data: {
          offeringId,
          teacherId: dto.teacherId,
          role: dto.role,
        },
        include: { teacher: true },
      });
      return { message: 'Teacher assigned', data: assignment };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(
          'This teacher is already assigned to this offering',
        );
      }
      throw e;
    }
  }

  async unassignTeacher(offeringId: string, assignmentId: string) {
    const assignment = await this.prisma.courseAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment || assignment.offeringId !== offeringId) {
      throw new NotFoundException('Assignment not found for this offering');
    }
    await this.prisma.courseAssignment.delete({ where: { id: assignmentId } });
    return { message: 'Teacher unassigned', data: null };
  }

  // ===========================================================================
  // TimetableSlot — conflict detection
  // ===========================================================================

  /// Detect TEACHER / ROOM hard conflicts (and BATCH_SECTION soft conflicts).
  private async detectConflicts(args: {
    teacherId?: string;
    roomId?: string;
    offeringId?: string;
    day: Day;
    startTime: string;
    endTime: string;
    excludeSlotId?: string;
  }) {
    const { teacherId, roomId, offeringId, day, startTime, endTime, excludeSlotId } =
      args;

    if (endTime <= startTime) {
      throw new BadRequestException('endTime must be greater than startTime');
    }

    const ors: Prisma.TimetableSlotWhereInput[] = [];
    if (teacherId) ors.push({ teacherId });
    if (roomId) ors.push({ roomId });
    if (ors.length === 0) return { hard: [], soft: [] };

    // Strict overlap: a.start < b.end AND b.start < a.end
    const overlapping = await this.prisma.timetableSlot.findMany({
      where: {
        day,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
        ...(excludeSlotId ? { NOT: { id: excludeSlotId } } : {}),
        OR: ors,
      },
      include: {
        offering: { select: { id: true, batchId: true, section: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
        room: { select: { id: true, code: true, name: true } },
      },
    });

    const hard: SlotConflict[] = [];
    for (const s of overlapping) {
      if (teacherId && s.teacherId === teacherId) {
        hard.push({ id: s.id, type: 'TEACHER', slot: s });
      } else if (roomId && s.roomId === roomId) {
        hard.push({ id: s.id, type: 'ROOM', slot: s });
      }
    }

    // Soft conflict: same batch+section overlap.
    let soft: SlotConflict[] = [];
    if (offeringId) {
      const target = await this.prisma.offering.findUnique({
        where: { id: offeringId },
        select: { batchId: true, section: true },
      });
      if (target) {
        const batchOverlap = await this.prisma.timetableSlot.findMany({
          where: {
            day,
            startTime: { lt: endTime },
            endTime: { gt: startTime },
            ...(excludeSlotId ? { NOT: { id: excludeSlotId } } : {}),
            offering: { batchId: target.batchId, section: target.section },
            offeringId: { not: offeringId },
          },
          include: {
            offering: { select: { id: true, batchId: true, section: true } },
          },
        });
        soft = batchOverlap.map((s) => ({
          id: s.id,
          type: 'TEACHER' as const,
          slot: s,
        }));
      }
    }

    return { hard, soft };
  }

  async checkConflicts(query: ConflictCheckQueryDto) {
    const { hard, soft } = await this.detectConflicts({
      teacherId: query.teacherId,
      roomId: query.roomId,
      day: query.day,
      startTime: query.startTime,
      endTime: query.endTime,
      excludeSlotId: query.excludeSlotId,
    });
    return {
      message: 'Conflict preview',
      data: { conflicts: hard, warnings: soft },
    };
  }

  async createTimetableSlot(dto: CreateTimetableSlotDto) {
    const offering = await this.prisma.offering.findUnique({
      where: { id: dto.offeringId },
    });
    if (!offering) throw new NotFoundException('Offering not found');

    const room = await this.prisma.classroom.findUnique({
      where: { id: dto.roomId },
    });
    if (!room) throw new NotFoundException('Classroom not found');
    if (room.status === ClassroomStatus.MAINTENANCE) {
      throw new BadRequestException('Classroom is under maintenance');
    }

    const assignment = await this.prisma.courseAssignment.findFirst({
      where: { offeringId: dto.offeringId, teacherId: dto.teacherId },
    });
    if (!assignment) {
      throw new BadRequestException(
        'Teacher must be assigned to this offering before being placed on the timetable',
      );
    }

    const { hard, soft } = await this.detectConflicts({
      teacherId: dto.teacherId,
      roomId: dto.roomId,
      offeringId: dto.offeringId,
      day: dto.day,
      startTime: dto.startTime,
      endTime: dto.endTime,
    });

    if (hard.length > 0) {
      throw new ConflictException({
        message: 'Timetable conflict detected',
        fields: { conflicts: hard },
      });
    }

    const slot = await this.prisma.timetableSlot.create({
      data: dto,
      include: { teacher: true, room: true, offering: true },
    });
    return {
      message: 'Timetable slot created',
      data: slot,
      warnings: soft,
    };
  }

  async listTimetableSlots(filters: {
    teacherId?: string;
    roomId?: string;
    offeringId?: string;
    day?: Day;
  }) {
    const where: Prisma.TimetableSlotWhereInput = {};
    if (filters.teacherId) where.teacherId = filters.teacherId;
    if (filters.roomId) where.roomId = filters.roomId;
    if (filters.offeringId) where.offeringId = filters.offeringId;
    if (filters.day) where.day = filters.day;

    const slots = await this.prisma.timetableSlot.findMany({
      where,
      include: {
        offering: { include: { course: true, batch: true } },
        teacher: true,
        room: true,
      },
      orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
    });
    return { message: 'Timetable slots fetched', data: slots };
  }

  async getTimetableSlot(id: string) {
    const slot = await this.prisma.timetableSlot.findUnique({
      where: { id },
      include: { offering: true, teacher: true, room: true },
    });
    if (!slot) throw new NotFoundException('Timetable slot not found');
    return { message: 'Timetable slot fetched', data: slot };
  }

  async updateTimetableSlot(id: string, dto: UpdateTimetableSlotDto) {
    const existing = await this.prisma.timetableSlot.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Timetable slot not found');

    const merged = {
      offeringId: dto.offeringId ?? existing.offeringId,
      teacherId: dto.teacherId ?? existing.teacherId,
      roomId: dto.roomId ?? existing.roomId,
      day: dto.day ?? existing.day,
      startTime: dto.startTime ?? existing.startTime,
      endTime: dto.endTime ?? existing.endTime,
    };

    const { hard, soft } = await this.detectConflicts({
      ...merged,
      excludeSlotId: id,
    });
    if (hard.length > 0) {
      throw new ConflictException({
        message: 'Timetable conflict detected',
        fields: { conflicts: hard },
      });
    }

    const updated = await this.prisma.timetableSlot.update({
      where: { id },
      data: merged,
    });
    return { message: 'Timetable slot updated', data: updated, warnings: soft };
  }

  async deleteTimetableSlot(id: string) {
    const existing = await this.prisma.timetableSlot.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Timetable slot not found');
    await this.prisma.timetableSlot.delete({ where: { id } });
    return { message: 'Timetable slot deleted', data: null };
  }

  async bulkCreateTimetableSlots(dto: BulkCreateTimetableSlotsDto) {
    return this.prisma.$transaction(async (tx) => {
      const created: Array<unknown> = [];
      for (const slot of dto.slots) {
        const { hard } = await this.detectConflicts({
          teacherId: slot.teacherId,
          roomId: slot.roomId,
          offeringId: slot.offeringId,
          day: slot.day,
          startTime: slot.startTime,
          endTime: slot.endTime,
        });
        if (hard.length > 0) {
          throw new ConflictException({
            message: 'Bulk timetable creation aborted: conflict detected',
            fields: { conflicts: hard, slot },
          });
        }
        const inserted = await tx.timetableSlot.create({ data: slot });
        created.push(inserted);
      }
      return { message: 'Timetable slots bulk-created', data: created };
    });
  }

  // ===========================================================================
  // Composite timetable view
  // ===========================================================================

  async timetableView(filters: {
    batchId?: string;
    teacherId?: string;
    roomId?: string;
    offeringId?: string;
  }) {
    const where: Prisma.TimetableSlotWhereInput = {};
    if (filters.teacherId) where.teacherId = filters.teacherId;
    if (filters.roomId) where.roomId = filters.roomId;
    if (filters.offeringId) where.offeringId = filters.offeringId;
    if (filters.batchId) where.offering = { batchId: filters.batchId };

    const slots = await this.prisma.timetableSlot.findMany({
      where,
      include: {
        offering: { include: { course: true, batch: true } },
        teacher: true,
        room: true,
      },
      orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
    });

    const grouped: Record<string, typeof slots> = {
      MON: [],
      TUE: [],
      WED: [],
      THU: [],
      FRI: [],
      SAT: [],
    };
    for (const slot of slots) {
      grouped[slot.day]?.push(slot);
    }
    return { message: 'Timetable fetched', data: grouped };
  }
}
