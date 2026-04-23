import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGradingDto } from './dto/create-grading.dto';
import { UpdateGradingDto } from './dto/update-grading.dto';

@Injectable()
export class GradingService {
  constructor(private prisma: PrismaService) {}

  private calculateGrade(total: number) {
    if (total >= 85) return { grade: 'A', gpa: 4.0 };
    if (total >= 75) return { grade: 'B', gpa: 3.0 };
    if (total >= 65) return { grade: 'C', gpa: 2.0 };
    if (total >= 50) return { grade: 'D', gpa: 1.0 };
    return { grade: 'F', gpa: 0.0 };
  }

  async create(dto: CreateGradingDto) {
    const total =
      (dto.assignment || 0) +
      (dto.quiz || 0) +
      (dto.midterm || 0) +
      (dto.finalExam || 0);

    const { grade, gpa } = this.calculateGrade(total);

    return this.prisma.grading.create({
      data: {
        ...dto,
        totalMarks: total,
        grade,
        gpa,
      },
    });
  }

  async getStudentResults(studentId: string) {
    return this.prisma.grading.findMany({
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
    });
  }

  async update(id: string, dto: UpdateGradingDto) {
    const existing = await this.prisma.grading.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Result not found');

    const total =
      (dto.assignment ?? existing.assignment ?? 0) +
      (dto.quiz ?? existing.quiz ?? 0) +
      (dto.midterm ?? existing.midterm ?? 0) +
      (dto.finalExam ?? existing.finalExam ?? 0);

    const { grade, gpa } = this.calculateGrade(total);

    return this.prisma.grading.update({
      where: { id },
      data: {
        ...dto,
        totalMarks: total,
        grade,
        gpa,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.grading.delete({ where: { id } });
  }
}