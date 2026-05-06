import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import {
  EnrollmentSemesterStatus,
  Prisma,
  StudentEnrollmentStatus,
  StudentStatus,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { SystemRoleCode } from '../users/users.service';
import {
  CreateGuardianDto,
  CreateStudentDto,
  LinkGuardianDto,
  ListStudentsQueryDto,
  PromoteStudentToUserDto,
  TransitionStudentDto,
  UpdateGuardianDto,
  UpdateLinkGuardianDto,
  UpdateStudentDto,
} from './dto/students.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  // Helpers
  // ===========================================================================

  private async generateAdmissionNumber(
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `STD-${year}-`;
    const last = await tx.student.findFirst({
      where: { admissionNumber: { startsWith: prefix } },
      orderBy: { admissionNumber: 'desc' },
      select: { admissionNumber: true },
    });
    const lastSeq = last?.admissionNumber
      ? parseInt(last.admissionNumber.slice(prefix.length), 10) || 0
      : 0;
    const next = lastSeq + 1;
    return `${prefix}${String(next).padStart(5, '0')}`;
  }

  private validateAge(dob: string, enrolledAt?: string) {
    const birth = new Date(dob);
    const reference = enrolledAt ? new Date(enrolledAt) : new Date();
    const minDate = new Date(birth);
    minDate.setFullYear(minDate.getFullYear() + 16);
    if (reference < minDate) {
      throw new BadRequestException(
        'Student must be at least 16 years old at admission',
      );
    }
  }

  private async ensureBatchInProgram(programId: string, batchId: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      select: { programId: true },
    });
    if (!batch) throw new NotFoundException('Batch not found');
    if (batch.programId !== programId) {
      throw new BadRequestException(
        'Batch does not belong to the specified program',
      );
    }
  }

  private async getStudentRoleId(
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<string | null> {
    const role = await tx.role.findUnique({
      where: { code: SystemRoleCode.STUDENT },
      select: { id: true },
    });
    return role?.id ?? null;
  }

  // ===========================================================================
  // CRUD
  // ===========================================================================

  async create(dto: CreateStudentDto) {
    this.validateAge(dto.dob, dto.enrolledAt);
    await this.ensureBatchInProgram(dto.programId, dto.batchId);

    return this.prisma.$transaction(async (tx) => {
      const admissionNumber =
        dto.admissionNumber ?? (await this.generateAdmissionNumber(tx));

      let userId: string | undefined;
      if (dto.createUser) {
        const passwordHash = await argon2.hash(dto.createUser.password);
        const studentRoleId = await this.getStudentRoleId(tx);
        const user = await tx.user.create({
          data: {
            email: dto.email.toLowerCase(),
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            status: 'ACTIVE',
            userRoles: studentRoleId
              ? { create: [{ roleId: studentRoleId }] }
              : undefined,
          },
        });
        userId = user.id;
      }

      try {
        const student = await tx.student.create({
          data: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email.toLowerCase(),
            phone: dto.phone,
            dateOfBirth: new Date(dto.dob),
            gender: dto.gender,
            address: dto.address,
            nationality: dto.nationality,
            bloodGroup: dto.bloodGroup,
            cnic: dto.cnic,
            profilePhoto: dto.photoUrl,
            programId: dto.programId,
            batchId: dto.batchId,
            currentSemesterId: dto.currentSemesterId,
            status: dto.status ?? StudentStatus.PENDING,
            enrollmentStatus:
              dto.enrollmentStatus ?? StudentEnrollmentStatus.ACTIVE,
            enrolledAt: dto.enrolledAt ? new Date(dto.enrolledAt) : undefined,
            admissionNumber,
            regNo: admissionNumber,
            userId: userId!,
          } as Prisma.StudentUncheckedCreateInput,
        });

        // Seed initial enrollment-history row when a current semester is set.
        if (dto.currentSemesterId) {
          await tx.enrollmentHistory.create({
            data: {
              studentId: student.id,
              programId: dto.programId,
              batchId: dto.batchId,
              semesterId: dto.currentSemesterId,
              status: EnrollmentSemesterStatus.ACTIVE,
              startedAt: dto.enrolledAt ? new Date(dto.enrolledAt) : new Date(),
            },
          });
        }

        return { message: 'Student created', data: student };
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          const fields = (e.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
          throw new ConflictException(
            `Student with this ${fields} already exists`,
          );
        }
        throw e;
      }
    });
  }

  async findAll(query: ListStudentsQueryDto) {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.pageSize ?? 20);
    const skip = (page - 1) * pageSize;

    const where: Prisma.StudentWhereInput = { deletedAt: null };
    if (query.programId) where.programId = query.programId;
    if (query.batchId) where.batchId = query.batchId;
    if (query.currentSemesterId) where.currentSemesterId = query.currentSemesterId;
    if (query.status) where.status = query.status;
    if (query.enrollmentStatus) where.enrollmentStatus = query.enrollmentStatus;
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { admissionNumber: { contains: query.search, mode: 'insensitive' } },
        { regNo: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          program: { select: { id: true, code: true, name: true } },
          batch: { select: { id: true, name: true } },
          currentSemester: { select: { id: true, name: true, sequence: true } },
          user: { select: { id: true, email: true, status: true } },
        },
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      message: 'Students fetched',
      data: {
        items,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    };
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        program: true,
        batch: true,
        currentSemester: true,
        guardians: { include: { guardian: true } },
        user: { select: { id: true, email: true, status: true } },
      },
    });
    if (!student || student.deletedAt) {
      throw new NotFoundException('Student not found');
    }
    return { message: 'Student fetched', data: student };
  }

  async update(id: string, dto: UpdateStudentDto) {
    const existing = await this.prisma.student.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Student not found');
    }

    if (dto.dob) {
      this.validateAge(dto.dob, dto.enrolledAt);
    }
    if (dto.batchId && (dto.programId ?? existing.programId)) {
      await this.ensureBatchInProgram(
        dto.programId ?? existing.programId!,
        dto.batchId,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const previousSemesterId = existing.currentSemesterId;
      const updated = await tx.student.update({
        where: { id },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email?.toLowerCase(),
          phone: dto.phone,
          dateOfBirth: dto.dob ? new Date(dto.dob) : undefined,
          gender: dto.gender,
          address: dto.address,
          nationality: dto.nationality,
          bloodGroup: dto.bloodGroup,
          cnic: dto.cnic,
          profilePhoto: dto.photoUrl,
          programId: dto.programId,
          batchId: dto.batchId,
          currentSemesterId: dto.currentSemesterId,
          status: dto.status,
          enrollmentStatus: dto.enrollmentStatus,
          enrolledAt: dto.enrolledAt ? new Date(dto.enrolledAt) : undefined,
        },
      });

      // History bookkeeping when the current semester changes via PATCH.
      if (
        dto.currentSemesterId &&
        dto.currentSemesterId !== previousSemesterId
      ) {
        if (previousSemesterId) {
          await tx.enrollmentHistory.updateMany({
            where: {
              studentId: id,
              semesterId: previousSemesterId,
              endedAt: null,
            },
            data: {
              endedAt: new Date(),
              status: EnrollmentSemesterStatus.COMPLETED,
            },
          });
        }
        await tx.enrollmentHistory.create({
          data: {
            studentId: id,
            programId: updated.programId!,
            batchId: updated.batchId!,
            semesterId: dto.currentSemesterId,
            status: EnrollmentSemesterStatus.ACTIVE,
            startedAt: new Date(),
          },
        });
      }

      // Sync linked user.
      if (existing.userId && (dto.email || dto.firstName || dto.lastName)) {
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            email: dto.email?.toLowerCase(),
            firstName: dto.firstName,
            lastName: dto.lastName,
          },
        });
      }

      return { message: 'Student updated', data: updated };
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.student.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Student not found');
    }
    await this.prisma.student.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: 'Student deleted', data: null };
  }

  // ===========================================================================
  // Transition
  // ===========================================================================

  async transition(id: string, dto: TransitionStudentDto) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student || student.deletedAt) {
      throw new NotFoundException('Student not found');
    }

    const effectiveDate = dto.effectiveDate
      ? new Date(dto.effectiveDate)
      : new Date();

    if (dto.toBatchId && student.programId) {
      await this.ensureBatchInProgram(student.programId, dto.toBatchId);
    }

    return this.prisma.$transaction(async (tx) => {
      // Close out current history row.
      if (student.currentSemesterId) {
        await tx.enrollmentHistory.updateMany({
          where: {
            studentId: id,
            semesterId: student.currentSemesterId,
            endedAt: null,
          },
          data: {
            endedAt: effectiveDate,
            status: dto.currentSemesterStatus,
          },
        });
      }

      const newBatchId = dto.toBatchId ?? student.batchId;
      const newSemesterId = dto.toSemesterId ?? student.currentSemesterId;
      const newEnrollment =
        dto.newEnrollmentStatus ?? student.enrollmentStatus;

      const updated = await tx.student.update({
        where: { id },
        data: {
          batchId: newBatchId,
          currentSemesterId: newSemesterId,
          enrollmentStatus: newEnrollment,
        },
      });

      const newRow =
        dto.toSemesterId && newEnrollment === StudentEnrollmentStatus.ACTIVE
          ? await tx.enrollmentHistory.create({
              data: {
                studentId: id,
                programId: updated.programId!,
                batchId: newBatchId!,
                semesterId: dto.toSemesterId,
                status: EnrollmentSemesterStatus.ACTIVE,
                startedAt: effectiveDate,
              },
            })
          : null;

      return {
        message: 'Student transitioned',
        data: { student: updated, newHistoryRow: newRow },
      };
    });
  }

  async enrollmentHistory(id: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');
    const history = await this.prisma.enrollmentHistory.findMany({
      where: { studentId: id },
      include: {
        program: true,
        batch: true,
        semester: true,
      },
      orderBy: { startedAt: 'asc' },
    });
    return { message: 'Enrollment history fetched', data: history };
  }

  // ===========================================================================
  // Promote / Demote login user
  // ===========================================================================

  async promoteToUser(id: string, dto: PromoteStudentToUserDto) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student || student.deletedAt) {
      throw new NotFoundException('Student not found');
    }
    if (student.userId) {
      throw new ConflictException('Student already has a linked user account');
    }
    if (!student.email) {
      throw new BadRequestException('Student must have an email');
    }

    const passwordHash = await argon2.hash(dto.password);

    return this.prisma.$transaction(async (tx) => {
      const studentRoleId = await this.getStudentRoleId(tx);
      const user = await tx.user.create({
        data: {
          email: student.email!,
          passwordHash,
          firstName: student.firstName,
          lastName: student.lastName,
          status: 'ACTIVE',
          userRoles: studentRoleId
            ? { create: [{ roleId: studentRoleId }] }
            : undefined,
        },
      });
      const updated = await tx.student.update({
        where: { id },
        data: { userId: user.id },
      });
      return { message: 'Student promoted to login user', data: updated };
    });
  }

  async demoteFromUser(id: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');
    if (!student.userId) {
      throw new ConflictException('Student has no linked user account');
    }

    return this.prisma.$transaction(async (tx) => {
      const userId = student.userId!;
      // Cannot null student.userId because schema requires it (legacy field).
      // Soft-delete the user instead.
      await tx.user.update({
        where: { id: userId },
        data: { deletedAt: new Date(), status: 'INACTIVE' },
      });
      return { message: 'Login user soft-deleted', data: null };
    });
  }

  // ===========================================================================
  // Guardian linking
  // ===========================================================================

  async listGuardians(studentId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');
    const links = await this.prisma.studentGuardian.findMany({
      where: { studentId, deletedAt: null },
      include: { guardian: true },
    });
    return { message: 'Guardians fetched', data: links };
  }

  async linkGuardian(studentId: string, dto: LinkGuardianDto) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    return this.prisma.$transaction(async (tx) => {
      let guardianId = dto.guardianId;
      if (!guardianId) {
        if (!dto.firstName || !dto.lastName) {
          throw new BadRequestException(
            'Provide guardianId or full guardian details (firstName/lastName)',
          );
        }
        const created = await tx.guardian.create({
          data: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            email: dto.email,
            occupation: dto.occupation,
            cnic: dto.cnic,
            address: dto.address,
          },
        });
        guardianId = created.id;
      } else {
        const existing = await tx.guardian.findUnique({
          where: { id: guardianId },
        });
        if (!existing) throw new NotFoundException('Guardian not found');
      }

      try {
        const link = await tx.studentGuardian.create({
          data: {
            studentId,
            guardianId,
            relation: dto.relation,
            isPrimary: dto.isPrimary ?? false,
          },
          include: { guardian: true },
        });
        return { message: 'Guardian linked', data: link };
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          throw new ConflictException(
            'Guardian is already linked to this student',
          );
        }
        throw e;
      }
    });
  }

  async updateLink(
    studentId: string,
    guardianId: string,
    dto: UpdateLinkGuardianDto,
  ) {
    const link = await this.prisma.studentGuardian.findUnique({
      where: { studentId_guardianId: { studentId, guardianId } },
    });
    if (!link) throw new NotFoundException('Guardian link not found');

    const updated = await this.prisma.studentGuardian.update({
      where: { studentId_guardianId: { studentId, guardianId } },
      data: {
        relation: dto.relation,
        isPrimary: dto.isPrimary,
      },
      include: { guardian: true },
    });
    return { message: 'Guardian link updated', data: updated };
  }

  async unlinkGuardian(studentId: string, guardianId: string) {
    const link = await this.prisma.studentGuardian.findUnique({
      where: { studentId_guardianId: { studentId, guardianId } },
    });
    if (!link) throw new NotFoundException('Guardian link not found');
    await this.prisma.studentGuardian.delete({
      where: { studentId_guardianId: { studentId, guardianId } },
    });
    return { message: 'Guardian unlinked', data: null };
  }

  // ===========================================================================
  // Standalone Guardians
  // ===========================================================================

  async createGuardian(dto: CreateGuardianDto) {
    try {
      const guardian = await this.prisma.guardian.create({ data: dto });
      return { message: 'Guardian created', data: guardian };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Guardian with this CNIC already exists');
      }
      throw e;
    }
  }

  async listAllGuardians(filters: { search?: string; studentId?: string }) {
    const where: Prisma.GuardianWhereInput = { deletedAt: null };
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { cnic: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.studentId) {
      where.students = { some: { studentId: filters.studentId } };
    }
    const guardians = await this.prisma.guardian.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return { message: 'Guardians fetched', data: guardians };
  }

  async getGuardian(id: string) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id },
      include: { students: { include: { student: true } } },
    });
    if (!guardian || guardian.deletedAt) {
      throw new NotFoundException('Guardian not found');
    }
    return { message: 'Guardian fetched', data: guardian };
  }

  async updateGuardian(id: string, dto: UpdateGuardianDto) {
    const exists = await this.prisma.guardian.findUnique({ where: { id } });
    if (!exists || exists.deletedAt) {
      throw new NotFoundException('Guardian not found');
    }
    const updated = await this.prisma.guardian.update({ where: { id }, data: dto });
    return { message: 'Guardian updated', data: updated };
  }

  async deleteGuardian(id: string) {
    const exists = await this.prisma.guardian.findUnique({ where: { id } });
    if (!exists || exists.deletedAt) {
      throw new NotFoundException('Guardian not found');
    }
    await this.prisma.guardian.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: 'Guardian deleted', data: null };
  }
}
