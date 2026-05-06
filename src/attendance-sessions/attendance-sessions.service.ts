import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Day, Prisma, SessionStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAttendanceSessionDto,
  GenerateSessionsDto,
  MarkAttendanceDto,
  UpdateAttendanceRecordDto,
  UpdateAttendanceSessionDto,
} from './dto/attendance-session.dto';

const DAY_BY_INDEX: Record<number, Day> = {
  1: Day.MON,
  2: Day.TUE,
  3: Day.WED,
  4: Day.THU,
  5: Day.FRI,
  6: Day.SAT,
};

@Injectable()
export class AttendanceSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  // Sessions CRUD
  // ===========================================================================

  async createSession(dto: CreateAttendanceSessionDto, userId?: string) {
    if (dto.endTime <= dto.startTime) {
      throw new BadRequestException('endTime must be greater than startTime');
    }
    const offering = await this.prisma.offering.findUnique({
      where: { id: dto.offeringId },
    });
    if (!offering) throw new NotFoundException('Offering not found');

    try {
      const session = await this.prisma.attendanceSession.create({
        data: {
          offeringId: dto.offeringId,
          date: new Date(dto.date),
          startTime: dto.startTime,
          endTime: dto.endTime,
          topic: dto.topic,
          notes: dto.notes,
          status: dto.status,
          createdById: userId,
        },
      });
      return { message: 'Attendance session created', data: session };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(
          'A session already exists for this offering at the same date/start time',
        );
      }
      throw e;
    }
  }

  async listSessions(filters: {
    offeringId?: string;
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    teacherId?: string;
    status?: SessionStatus;
  }) {
    const where: Prisma.AttendanceSessionWhereInput = {};
    if (filters.offeringId) where.offeringId = filters.offeringId;
    if (filters.status) where.status = filters.status;
    if (filters.date) where.date = new Date(filters.date);
    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) (where.date as Prisma.DateTimeFilter).gte = new Date(filters.dateFrom);
      if (filters.dateTo) (where.date as Prisma.DateTimeFilter).lte = new Date(filters.dateTo);
    }
    if (filters.teacherId) {
      where.offering = {
        assignments: { some: { teacherId: filters.teacherId } },
      };
    }

    const sessions = await this.prisma.attendanceSession.findMany({
      where,
      include: {
        offering: { include: { course: true, batch: true } },
        _count: { select: { records: true } },
      },
      orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
    });
    return { message: 'Attendance sessions fetched', data: sessions };
  }

  async getSession(id: string) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id },
      include: {
        offering: { include: { course: true, batch: true } },
        records: { include: { student: true } },
      },
    });
    if (!session) throw new NotFoundException('Attendance session not found');

    const summary = session.records.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return { message: 'Attendance session fetched', data: { ...session, summary } };
  }

  async updateSession(
    id: string,
    dto: UpdateAttendanceSessionDto,
    userId?: string,
  ) {
    const session = await this.prisma.attendanceSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Attendance session not found');

    if (dto.startTime && dto.endTime && dto.endTime <= dto.startTime) {
      throw new BadRequestException('endTime must be greater than startTime');
    }

    const updated = await this.prisma.attendanceSession.update({
      where: { id },
      data: {
        date: dto.date ? new Date(dto.date) : undefined,
        startTime: dto.startTime,
        endTime: dto.endTime,
        topic: dto.topic,
        notes: dto.notes,
        status: dto.status,
        updatedById: userId,
      },
    });
    return { message: 'Attendance session updated', data: updated };
  }

  async deleteSession(id: string) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id },
      include: { _count: { select: { records: true } } },
    });
    if (!session) throw new NotFoundException('Attendance session not found');
    if (session._count.records > 0) {
      throw new ConflictException(
        'Cannot delete a session with records. Cancel it instead (status=CANCELLED).',
      );
    }
    await this.prisma.attendanceSession.delete({ where: { id } });
    return { message: 'Attendance session deleted', data: null };
  }

  // ===========================================================================
  // Records (mark / read / update)
  // ===========================================================================

  async getRecords(sessionId: string) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        offering: { select: { id: true, batchId: true } },
        records: { include: { student: true } },
      },
    });
    if (!session) throw new NotFoundException('Attendance session not found');

    const roster = await this.prisma.student.findMany({
      where: { batchId: session.offering.batchId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        regNo: true,
        admissionNumber: true,
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    const recordsByStudent = new Map(
      session.records.map((r) => [r.studentId, r]),
    );
    const merged = roster.map((s) => ({
      student: s,
      record: recordsByStudent.get(s.id) ?? null,
    }));

    return { message: 'Attendance records fetched', data: merged };
  }

  async markAttendance(
    sessionId: string,
    dto: MarkAttendanceDto,
    userId?: string,
  ) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Attendance session not found');
    if (session.status === SessionStatus.CANCELLED) {
      throw new ConflictException('Cannot mark attendance for a CANCELLED session');
    }

    return this.prisma.$transaction(async (tx) => {
      for (const entry of dto.records) {
        await tx.attendanceRecord.upsert({
          where: {
            sessionId_studentId: { sessionId, studentId: entry.studentId },
          },
          create: {
            sessionId,
            studentId: entry.studentId,
            status: entry.status,
            notes: entry.notes,
            markedBy: userId,
          },
          update: {
            status: entry.status,
            notes: entry.notes,
            markedBy: userId,
            markedAt: new Date(),
          },
        });
      }

      const updated = await tx.attendanceSession.update({
        where: { id: sessionId },
        data: {
          markedAt: new Date(),
          status: dto.newSessionStatus ?? SessionStatus.COMPLETED,
        },
        include: { records: true },
      });
      return { message: 'Attendance marked', data: updated };
    });
  }

  async updateRecord(
    sessionId: string,
    recordId: string,
    dto: UpdateAttendanceRecordDto,
    userId?: string,
  ) {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id: recordId },
    });
    if (!record || record.sessionId !== sessionId) {
      throw new NotFoundException('Attendance record not found for this session');
    }
    const updated = await this.prisma.attendanceRecord.update({
      where: { id: recordId },
      data: {
        status: dto.status,
        notes: dto.notes,
        markedBy: userId,
        markedAt: new Date(),
      },
    });
    return { message: 'Attendance record updated', data: updated };
  }

  // ===========================================================================
  // Generate-from-timetable
  // ===========================================================================

  async generateSessions(dto: GenerateSessionsDto, userId?: string) {
    const offering = await this.prisma.offering.findUnique({
      where: { id: dto.offeringId },
      include: { semester: true, slots: true },
    });
    if (!offering) throw new NotFoundException('Offering not found');

    const skipExisting = dto.skipExisting ?? true;
    const fromDate = dto.from ? new Date(dto.from) : offering.semester.startDate;
    const toDate = dto.to ? new Date(dto.to) : offering.semester.endDate;

    if (toDate < fromDate) {
      throw new BadRequestException('"to" must be after "from"');
    }

    return this.prisma.$transaction(async (tx) => {
      const sessions: Array<unknown> = [];
      let createdCount = 0;
      let skippedCount = 0;

      for (const slot of offering.slots) {
        const cursor = new Date(fromDate);
        while (cursor <= toDate) {
          const dow = cursor.getDay(); // 0=Sun, 1=Mon, ...
          const slotDay = DAY_BY_INDEX[dow];
          if (slotDay === slot.day) {
            const dateOnly = new Date(
              Date.UTC(
                cursor.getUTCFullYear(),
                cursor.getUTCMonth(),
                cursor.getUTCDate(),
              ),
            );

            const existing = await tx.attendanceSession.findUnique({
              where: {
                offeringId_date_startTime: {
                  offeringId: offering.id,
                  date: dateOnly,
                  startTime: slot.startTime,
                },
              },
            });

            if (existing) {
              if (skipExisting) {
                skippedCount++;
              } else {
                throw new ConflictException(
                  `Session already exists at ${dateOnly.toISOString().slice(0, 10)} ${slot.startTime}`,
                );
              }
            } else {
              const created = await tx.attendanceSession.create({
                data: {
                  offeringId: offering.id,
                  date: dateOnly,
                  startTime: slot.startTime,
                  endTime: slot.endTime,
                  status: SessionStatus.SCHEDULED,
                  createdById: userId,
                },
              });
              sessions.push(created);
              createdCount++;
            }
          }
          cursor.setDate(cursor.getDate() + 1);
        }
      }

      return {
        message: 'Sessions generated from timetable',
        data: {
          created: createdCount,
          skipped: skippedCount,
          sessions,
        },
      };
    });
  }

  // ===========================================================================
  // Reports
  // ===========================================================================

  async studentReport(
    studentId: string,
    filters: { offeringId?: string; from?: string; to?: string },
  ) {
    const sessionWhere: Prisma.AttendanceSessionWhereInput = {};
    if (filters.offeringId) sessionWhere.offeringId = filters.offeringId;
    if (filters.from || filters.to) {
      sessionWhere.date = {
        ...(filters.from ? { gte: new Date(filters.from) } : {}),
        ...(filters.to ? { lte: new Date(filters.to) } : {}),
      };
    }
    const where: Prisma.AttendanceRecordWhereInput = { studentId };
    if (filters.offeringId || filters.from || filters.to) {
      where.session = sessionWhere;
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where,
      include: {
        session: {
          include: { offering: { include: { course: true } } },
        },
      },
    });

    const byOfferingMap = new Map<string, any>();
    for (const r of records) {
      const offeringId = r.session.offeringId;
      const entry = byOfferingMap.get(offeringId) ?? {
        offering: r.session.offering,
        totalSessions: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      };
      entry.totalSessions++;
      switch (r.status) {
        case 'PRESENT':
          entry.present++;
          break;
        case 'ABSENT':
          entry.absent++;
          break;
        case 'LATE':
          entry.late++;
          break;
        case 'EXCUSED':
          entry.excused++;
          break;
      }
      byOfferingMap.set(offeringId, entry);
    }

    const byOffering = [...byOfferingMap.values()].map((e) => ({
      ...e,
      percentage: e.totalSessions
        ? Number((((e.present + e.late) / e.totalSessions) * 100).toFixed(2))
        : 0,
    }));

    const totals = byOffering.reduce(
      (acc, e) => {
        acc.totalSessions += e.totalSessions;
        acc.attended += e.present + e.late;
        return acc;
      },
      { totalSessions: 0, attended: 0 },
    );

    return {
      message: 'Student attendance report',
      data: {
        studentId,
        byOffering,
        overall: {
          totalSessions: totals.totalSessions,
          percentage: totals.totalSessions
            ? Number(((totals.attended / totals.totalSessions) * 100).toFixed(2))
            : 0,
        },
      },
    };
  }

  async offeringReport(offeringId: string) {
    const offering = await this.prisma.offering.findUnique({
      where: { id: offeringId },
      include: { course: true, batch: true },
    });
    if (!offering) throw new NotFoundException('Offering not found');

    const totalSessions = await this.prisma.attendanceSession.count({
      where: { offeringId, status: { not: SessionStatus.CANCELLED } },
    });

    const students = await this.prisma.student.findMany({
      where: { batchId: offering.batchId, deletedAt: null },
      include: {
        attendanceRecords: { where: { session: { offeringId } } },
      },
    });

    const rows = students.map((s) => {
      const present = s.attendanceRecords.filter((r) => r.status === 'PRESENT').length;
      const absent = s.attendanceRecords.filter((r) => r.status === 'ABSENT').length;
      const late = s.attendanceRecords.filter((r) => r.status === 'LATE').length;
      const excused = s.attendanceRecords.filter((r) => r.status === 'EXCUSED').length;
      return {
        student: {
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          admissionNumber: s.admissionNumber,
          regNo: s.regNo,
        },
        totalSessions,
        present,
        absent,
        late,
        excused,
        percentage: totalSessions
          ? Number((((present + late) / totalSessions) * 100).toFixed(2))
          : 0,
      };
    });

    return {
      message: 'Offering attendance report',
      data: { offering, totalSessions, students: rows },
    };
  }

  async institutionReport(filters: {
    from?: string;
    to?: string;
    departmentId?: string;
  }) {
    const where: Prisma.AttendanceSessionWhereInput = {
      status: { not: SessionStatus.CANCELLED },
    };
    if (filters.from || filters.to) {
      where.date = {
        ...(filters.from ? { gte: new Date(filters.from) } : {}),
        ...(filters.to ? { lte: new Date(filters.to) } : {}),
      };
    }
    if (filters.departmentId) {
      where.offering = {
        course: { departmentId: filters.departmentId },
      };
    }

    const sessions = await this.prisma.attendanceSession.findMany({
      where,
      include: { records: true },
    });
    const totalSessions = sessions.length;
    const totalRecords = sessions.reduce((acc, s) => acc + s.records.length, 0);
    const attended = sessions.reduce(
      (acc, s) =>
        acc + s.records.filter((r) => ['PRESENT', 'LATE'].includes(r.status)).length,
      0,
    );

    return {
      message: 'Institution attendance roll-up',
      data: {
        totalSessions,
        totalRecords,
        averagePercentage: totalRecords
          ? Number(((attended / totalRecords) * 100).toFixed(2))
          : 0,
      },
    };
  }
}
