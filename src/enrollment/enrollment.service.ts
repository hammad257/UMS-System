import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Logger,
  } from '@nestjs/common';
  import { PrismaService } from '../prisma/prisma.service';
  import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
  import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
  
  @Injectable()
  export class EnrollmentService {
    private readonly logger = new Logger(EnrollmentService.name);
  
    constructor(private readonly prisma: PrismaService) {}
  
    // ─── CREATE ENROLLMENT (ADMIN) ───────────────────────────────────────────────
    // async create(dto: CreateEnrollmentDto) {
    //   const { studentId, sectionId } = dto;
  
    //   // check student
    //   const student = await this.prisma.student.findUnique({
    //     where: { id: studentId },
    //   });
    //   if (!student) throw new NotFoundException('Student not found');
  
    //   // check section + seats
    //   const section = await this.prisma.section.findUnique({
    //     where: { id: sectionId },
    //     include: { enrollments: true },
    //   });
    //   if (!section) throw new NotFoundException('Section not found');
  
    //   if (section.enrollments.length >= section.maxSeats) {
    //     throw new BadRequestException('Section is full');
    //   }
  
    //   // prevent duplicate
    //   const existing = await this.prisma.enrollment.findUnique({
    //     where: {
    //       studentId_sectionId: {
    //         studentId,
    //         sectionId,
    //       },
    //     },
    //   });
  
    //   if (existing) {
    //     throw new BadRequestException(
    //       'Student already enrolled in this section',
    //     );
    //   }
  
    //   const enrollment = await this.prisma.enrollment.create({
    //     data: { studentId, sectionId },
    //   });
  
    //   this.logger.log(
    //     `Student ${studentId} enrolled in section ${sectionId}`,
    //   );
  
    //   return {
    //     message: 'Enrollment created successfully',
    //     data: enrollment,
    //   };
    // }

  async enrollSelf(userId: string, sectionId: string) {
  // 1. get student from user
  const student = await this.prisma.student.findUnique({
    where: { userId },
  });

  if (!student || !student.programId) {
    throw new NotFoundException('Student not properly registered');
  }

  // 2. check section
  const section = await this.prisma.section.findUnique({
    where: { id: sectionId },
    include: { enrollments: true },
  });

  if (!section) throw new NotFoundException('Section not found');

  // 3. check seats
  if (section.enrollments.length >= section.maxSeats) {
    throw new BadRequestException('Section is full');
  }

  // 4. prevent duplicate
  const existing = await this.prisma.enrollment.findUnique({
    where: {
      studentId_sectionId: {
        studentId: student.id,
        sectionId,
      },
    },
  });

  if (existing) {
    throw new BadRequestException('Already enrolled in this section');
  }

  // 5. create enrollment
  const enrollment = await this.prisma.enrollment.create({
    data: {
      studentId: student.id,
      sectionId,
    },
  });

  return {
    message: 'Enrolled successfully',
    data: enrollment,
  };
}
  
    // ─── GET ALL ENROLLMENTS (ADMIN) ─────────────────────────────────────────────
    async findAll() {
      const enrollments = await this.prisma.enrollment.findMany({
        include: {
          student: true,
          section: {
            include: {
              course: true,
              semester: true,
            },
          },
        },
      });
  
      return {
        message: 'Enrollments fetched successfully',
        data: enrollments,
      };
    }
  
    // ─── GET STUDENT ENROLLMENTS (STUDENT PORTAL) ───────────────────────────────
    async findByStudent(studentId: string) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { studentId },
        include: {
          section: {
            include: {
              course: true,
              semester: true,
              faculty: true,
            },
          },
        },
      });
  
      return {
        message: 'Student enrollments fetched successfully',
        data: enrollments,
      };
    }
  
    // ─── GET SECTION STUDENTS (FACULTY) ─────────────────────────────────────────
    async findBySection(sectionId: string) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { sectionId },
        include: {
          student: true,
        },
      });
  
      return {
        message: 'Section students fetched successfully',
        data: enrollments,
      };
    }
  
    // ─── UPDATE STATUS (DROP / COMPLETE) ────────────────────────────────────────
    async update(id: string, dto: UpdateEnrollmentDto) {
      const exists = await this.prisma.enrollment.findUnique({
        where: { id },
      });
  
      if (!exists) throw new NotFoundException('Enrollment not found');
  
      const updated = await this.prisma.enrollment.update({
        where: { id },
        data: dto,
      });
  
      this.logger.log(`Enrollment updated: ${id}`);
  
      return {
        message: 'Enrollment updated successfully',
        data: updated,
      };
    }
  
    // ─── DELETE ENROLLMENT ──────────────────────────────────────────────────────
    async remove(id: string) {
      const exists = await this.prisma.enrollment.findUnique({
        where: { id },
      });
  
      if (!exists) throw new NotFoundException('Enrollment not found');
  
      await this.prisma.enrollment.delete({
        where: { id },
      });
  
      this.logger.log(`Enrollment deleted: ${id}`);
  
      return {
        message: 'Enrollment deleted successfully',
        data: null,
      };
    }
  }