import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { AddGuardianDto } from './dto/create-student.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateStudentAcademicDto, UpdateStudentProfileDto } from './dto/update-student.dto';

const LOCAL_PROFILE_PREFIX = '/uploads/students/';

@Injectable()
export class StudentService {
   constructor(private readonly prisma: PrismaService) {}

  async addGuardian(
  studentId: string,
  dto: AddGuardianDto,
) {
  const { guardianId, relation } = dto;

  if (!guardianId) {
    throw new BadRequestException('guardianId is required');
  }

  const student = await this.prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student) throw new NotFoundException('Student not found');

  const guardian = await this.prisma.guardian.findUnique({
    where: { id: guardianId },
  });

  if (!guardian) throw new NotFoundException('Guardian not found');

  return this.prisma.studentGuardian.create({
    data: {
      studentId,
      guardianId,
      relation,
    },
  });
}


  async updateProfile(
    studentId: string,
    dto: UpdateStudentProfileDto,
    profilePhotoPath?: string,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) throw new NotFoundException('Student not found');

    if (profilePhotoPath) {
      this.tryRemoveLocalProfileFile(student.profilePhoto);
    }

    return this.prisma.student.update({
      where: { id: studentId },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        ...(profilePhotoPath ? { profilePhoto: profilePhotoPath } : {}),
      },
    });
  }

  private tryRemoveLocalProfileFile(storedPath: string | null) {
    if (!storedPath?.startsWith(LOCAL_PROFILE_PREFIX)) return;
    const relative = storedPath.replace(/^\//, '');
    const full = join(process.cwd(), relative);
    if (existsSync(full)) {
      try {
        unlinkSync(full);
      } catch {
        /* ignore */
      }
    }
  }


async updateAcademic(studentId: string, dto: UpdateStudentAcademicDto) {
  const student = await this.prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student) throw new NotFoundException('Student not found');

  return this.prisma.student.update({
    where: { id: studentId },
    data: {
      programId: dto.programId,
      batchId: dto.batchId,
      currentSemesterId: dto.currentSemesterId,
      status: dto.status as any,
    },
  });
}

}
