import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AddGuardianDto } from './dto/create-student.dto';
import { PrismaService } from 'src/prisma/prisma.service';

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
}
