import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTimetableDto } from './dto/create-timetable.dto';
import { UpdateTimetableDto } from './dto/update-timetable.dto';

@Injectable()
export class TimetableService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTimetableDto) {
    // basic conflict check
    const conflict = await this.prisma.timetable.findFirst({
      where: {
        sectionId: dto.sectionId,
        day: dto.day,
        OR: [
          {
            startTime: { lt: new Date(dto.endTime) },
            endTime: { gt: new Date(dto.startTime) },
          },
        ],
      },
    });

    if (conflict) {
      throw new BadRequestException('Time conflict for this section');
    }

    return this.prisma.timetable.create({
      data: {
        ...dto,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
      },
    });
  }

  async findAll() {
    return this.prisma.timetable.findMany({
      include: {
        section: {
          include: {
            course: true,
            faculty: true,
          },
        },
      },
    });
  }

  async findBySection(sectionId: string) {
    return this.prisma.timetable.findMany({
      where: { sectionId },
    });
  }

  async update(id: string, dto: UpdateTimetableDto) {
    return this.prisma.timetable.update({
      where: { id },
      data: {
        ...dto,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.timetable.delete({ where: { id } });
  }
}