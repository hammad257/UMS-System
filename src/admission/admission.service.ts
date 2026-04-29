import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAdmissionRequestDto } from './dto/create-admission.dto';

@Injectable()
export class AdmissionService {
  constructor(private readonly prisma: PrismaService) {}

async apply(dto: CreateAdmissionRequestDto) {
  const existing = await this.prisma.admissionRequest.findFirst({
    where: { email: dto.email },
  });

  if (existing) {
    throw new BadRequestException('Application already exists');
  }

  return this.prisma.admissionRequest.create({
    data: {
      ...dto,
       dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
      status: 'PENDING',
    },
  });
}

 async getAll() {
    const requests = await this.prisma.admissionRequest.findMany({
      include: {
        program: true,
        batch: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: 'Admission requests fetched successfully',
      data: requests,
    };
  }


async approve(id: string) {
  const request = await this.prisma.admissionRequest.findUnique({
    where: { id },
  });

  if (!request) throw new NotFoundException('Request not found');

  // 1. create user
  const password = Math.random().toString(36).slice(-8);

  const user = await this.prisma.user.create({
    data: {
      email: request.email,
      passwordHash: password, // later hash this properly
      roles: {
        create: {
          role: { connect: { name: 'STUDENT' } },
        },
      },
    },
  });

  // 2. create student profile
  const student = await this.prisma.student.create({
    data: {
      userId: user.id,
      firstName: request.firstName,
      lastName: request.lastName,
      programId: request.programId,
      batchId: request.batchId,
      regNo: `STU-${Date.now()}`,
    },
  });

  // 3. update request status
  await this.prisma.admissionRequest.update({
    where: { id },
    data: { status: 'APPROVED' },
  });

  return {
    message: 'Student approved successfully',
    data: { user, student, password }, // later send email instead
  };
}

async reject(id: string) {
  return this.prisma.admissionRequest.update({
    where: { id },
    data: { status: 'REJECTED' },
  });
}
}