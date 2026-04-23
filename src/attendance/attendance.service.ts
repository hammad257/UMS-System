import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async markAttendance(dto: MarkAttendanceDto) {
    return this.prisma.attendance.upsert({
      where: {
        enrollmentId_date: {
          enrollmentId: dto.enrollmentId,
          date: new Date(dto.date),
        },
      },
      update: {
        status: dto.status,
        remarks: dto.remarks,
      },
      create: {
        enrollmentId: dto.enrollmentId,
        date: new Date(dto.date),
        status: dto.status,
        remarks: dto.remarks,
      },
    });
  }

  async getStudentAttendance(studentId: string) {
    return this.prisma.attendance.findMany({
      where: {
        enrollment: {
          studentId,
        },
      },
      include: {
        enrollment: {
          include: {
            section: {
              include: {
                course: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getSectionAttendance(sectionId: string) {
    return this.prisma.attendance.findMany({
      where: {
        enrollment: {
          sectionId,
        },
      },
      include: {
        enrollment: {
          include: {
            student: true,
          },
        },
      },
    });
  }

  async updateAttendance(id: string, dto: UpdateAttendanceDto) {
    const exists = await this.prisma.attendance.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Attendance not found');

    return this.prisma.attendance.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
    });
  }

  async deleteAttendance(id: string) {
    return this.prisma.attendance.delete({
      where: { id },
    });
  }
}