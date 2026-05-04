import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampusDto } from './dto/create-campus.dto';
import { UpdateCampusDto } from './dto/update-campus.dto';

@Injectable()
export class CampusService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCampusDto) {
    try {
      const campus = await this.prisma.campus.create({ data: dto });
      return { message: 'Campus created', data: campus };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Campus code already exists');
      }
      throw e;
    }
  }

  async findAll() {
    const campuses = await this.prisma.campus.findMany({
      include: { _count: { select: { faculties: true } } },
      orderBy: { code: 'asc' },
    });
    return { message: 'Campuses fetched', data: campuses };
  }

  async findOne(id: string) {
    const campus = await this.prisma.campus.findUnique({
      where: { id },
      include: { faculties: true },
    });
    if (!campus) throw new NotFoundException('Campus not found');
    return { message: 'Campus fetched', data: campus };
  }

  async update(id: string, dto: UpdateCampusDto) {
    const exists = await this.prisma.campus.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Campus not found');

    const updated = await this.prisma.campus.update({
      where: { id },
      data: dto,
    });
    return { message: 'Campus updated', data: updated };
  }

  async remove(id: string) {
    const campus = await this.prisma.campus.findUnique({
      where: { id },
      include: { _count: { select: { faculties: true } } },
    });
    if (!campus) throw new NotFoundException('Campus not found');
    if (campus._count.faculties > 0) {
      throw new ConflictException('Cannot delete: campus has faculties');
    }
    await this.prisma.campus.delete({ where: { id } });
    return { message: 'Campus deleted', data: null };
  }
}
