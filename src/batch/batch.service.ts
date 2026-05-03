import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

@Injectable()
export class BatchService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBatchDto) {
    if (dto.endYear < dto.startYear) {
      throw new BadRequestException('endYear must be ≥ startYear');
    }

    const [program, session] = await this.prisma.$transaction([
      this.prisma.program.findUnique({ where: { id: dto.programId } }),
      this.prisma.academicSession.findUnique({
        where: { id: dto.sessionId },
      }),
    ]);
    if (!program) throw new NotFoundException('Program not found');
    if (!session) throw new NotFoundException('Academic session not found');

    try {
      const batch = await this.prisma.batch.create({
        data: {
          name: dto.name,
          programId: dto.programId,
          sessionId: dto.sessionId,
          startYear: dto.startYear,
          endYear: dto.endYear,
          intake: dto.intake ?? 0,
          status: dto.status,
        },
      });
      return { message: 'Batch created', data: batch };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          'A batch already exists for this program + session',
        );
      }
      throw e;
    }
  }

  async findAll() {
    const batches = await this.prisma.batch.findMany({
      include: {
        program: { select: { id: true, code: true, name: true } },
        session: { select: { id: true, code: true, name: true } },
        _count: { select: { students: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { message: 'Batches fetched', data: batches };
  }

  async findOne(id: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      include: {
        program: true,
        session: true,
        students: true,
      },
    });
    if (!batch) throw new NotFoundException('Batch not found');
    return { message: 'Batch fetched', data: batch };
  }

  async update(id: string, dto: UpdateBatchDto) {
    const exists = await this.prisma.batch.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Batch not found');

    if (
      dto.startYear !== undefined &&
      dto.endYear !== undefined &&
      dto.endYear < dto.startYear
    ) {
      throw new BadRequestException('endYear must be ≥ startYear');
    }

    const updated = await this.prisma.batch.update({
      where: { id },
      data: dto,
    });
    return { message: 'Batch updated', data: updated };
  }

  async remove(id: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      include: { _count: { select: { students: true } } },
    });
    if (!batch) throw new NotFoundException('Batch not found');
    if (batch._count.students > 0) {
      throw new ConflictException('Cannot delete: batch has students');
    }
    await this.prisma.batch.delete({ where: { id } });
    return { message: 'Batch deleted', data: null };
  }
}
