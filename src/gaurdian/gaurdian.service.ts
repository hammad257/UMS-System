import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGuardianDto } from './dto/create-gaurdian.dto';
import { UpdateGuardianDto } from './dto/update-gaurdian.dto';

@Injectable()
export class GuardianService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── CREATE ─────────────────────────────────────────────
  async create(dto: CreateGuardianDto) {
    // prevent duplicate CNIC
    const existing = await this.prisma.guardian.findUnique({
      where: { cnic: dto.cnic },
    });

    if (existing) {
      throw new ConflictException('Guardian with this CNIC already exists');
    }

    const guardian = await this.prisma.guardian.create({
      data: dto,
    });

    return {
      message: 'Guardian created successfully',
      data: guardian,
    };
  }

  // ─── GET ALL ────────────────────────────────────────────
  async findAll() {
    const guardians = await this.prisma.guardian.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: 'Guardians fetched successfully',
      data: guardians,
    };
  }

  // ─── GET BY ID ──────────────────────────────────────────
  async findOne(id: string) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id },
      include: {
        students: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }

    return {
      message: 'Guardian fetched successfully',
      data: guardian,
    };
  }

  // ─── UPDATE ─────────────────────────────────────────────
  async update(id: string, dto: UpdateGuardianDto) {
    const exists = await this.prisma.guardian.findUnique({
      where: { id },
    });

    if (!exists) {
      throw new NotFoundException('Guardian not found');
    }

    const updated = await this.prisma.guardian.update({
      where: { id },
      data: dto,
    });

    return {
      message: 'Guardian updated successfully',
      data: updated,
    };
  }

  // ─── DELETE ─────────────────────────────────────────────
  async remove(id: string) {
    const exists = await this.prisma.guardian.findUnique({
      where: { id },
    });

    if (!exists) {
      throw new NotFoundException('Guardian not found');
    }

    await this.prisma.guardian.delete({
      where: { id },
    });

    return {
      message: 'Guardian deleted successfully',
      data: null,
    };
  }
}