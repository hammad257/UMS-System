import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateAdmissionRequestDto } from './dto/create-admission.dto';

@Injectable()
export class AdmissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async apply(dto: CreateAdmissionRequestDto) {
    const existing = await this.prisma.admissionRequest.findFirst({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('Application already exists');
    }

    const created = await this.prisma.admissionRequest.create({
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        status: 'PENDING',
      },
    });
    return { message: 'Admission request submitted', data: created };
  }

  async getAll() {
    const requests = await this.prisma.admissionRequest.findMany({
      include: { program: true, batch: true },
      orderBy: { createdAt: 'desc' },
    });
    return { message: 'Admission requests fetched', data: requests };
  }

  async approve(id: string) {
    const request = await this.prisma.admissionRequest.findUnique({
      where: { id },
    });
    if (!request) throw new NotFoundException('Request not found');

    const studentRole = await this.prisma.role.findUnique({
      where: { code: 'STUDENT' },
      select: { id: true },
    });
    if (!studentRole) {
      throw new BadRequestException(
        'STUDENT role is not configured. Run the seed first.',
      );
    }

    // Generate a one-time password and hash it via argon2id (per Module 1 spec).
    const tempPassword = randomBytes(8).toString('base64url');
    const passwordHash = await this.authService.hashPasswordPublic(tempPassword);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: request.email,
          passwordHash,
          firstName: request.firstName,
          lastName: request.lastName,
          status: 'ACTIVE',
          userRoles: { create: [{ roleId: studentRole.id }] },
        },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          firstName: request.firstName,
          lastName: request.lastName,
          programId: request.programId,
          batchId: request.batchId,
          regNo: `STU-${Date.now()}`,
        },
      });

      await tx.admissionRequest.update({
        where: { id },
        data: { status: 'APPROVED' },
      });

      return { user, student };
    });

    return {
      message: 'Student approved successfully',
      data: { ...result, tempPassword },
    };
  }

  async reject(id: string) {
    const updated = await this.prisma.admissionRequest.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
    return { message: 'Admission rejected', data: updated };
  }
}
