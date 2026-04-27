import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampusDto } from './dto/create-campus.dto';

@Injectable()
export class CampusService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCampusDto) {
    return this.prisma.campus.upsert({
      where: { code: dto.code },
      update: {},
      create: dto,
    });
  }

  async findAll() {
    return this.prisma.campus.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}