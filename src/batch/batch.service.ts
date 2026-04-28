import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBatchDto } from './dto/create-batch.dto';

@Injectable()
export class BatchService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBatchDto) {
    // check program exists
    const program = await this.prisma.program.findUnique({
      where: { id: dto.programId },
    });

    if (!program) {
      throw new BadRequestException('Program not found');
    }

    // prevent duplicate batch in same program
    const exists = await this.prisma.batch.findFirst({
      where: {
        name: dto.name,
        programId: dto.programId,
      },
    });

    if (exists) {
      throw new BadRequestException('Batch already exists in this program');
    }

    return this.prisma.batch.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.batch.findMany({
      include: {
        program: true,
        students: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      include: {
        program: true,
        students: true,
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    return batch;
  }
}