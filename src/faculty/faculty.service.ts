import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAcademicFacultyDto } from './dto/create-faculty.dto';
import { UpdateAcademicFacultyDto } from './dto/update-faculty.dto';

@Injectable()
export class AcademicFacultyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAcademicFacultyDto) {
    const campus = await this.prisma.campus.findUnique({
      where: { id: dto.campusId },
      select: { id: true },
    });
    if (!campus) throw new NotFoundException('Campus not found');

    try {
      const faculty = await this.prisma.academicFaculty.create({ data: dto });
      return { message: 'Academic faculty created', data: faculty };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          'Academic faculty with this code/name already exists',
        );
      }
      throw e;
    }
  }

  async findAll() {
    const faculties = await this.prisma.academicFaculty.findMany({
      include: {
        campus: { select: { id: true, code: true, name: true } },
        _count: { select: { departments: true } },
      },
      orderBy: { code: 'asc' },
    });
    return { message: 'Academic faculties fetched', data: faculties };
  }

  async findOne(id: string) {
    const faculty = await this.prisma.academicFaculty.findUnique({
      where: { id },
      include: { campus: true, departments: true },
    });
    if (!faculty) throw new NotFoundException('Academic faculty not found');
    return { message: 'Academic faculty fetched', data: faculty };
  }

  async update(id: string, dto: UpdateAcademicFacultyDto) {
    const exists = await this.prisma.academicFaculty.findUnique({
      where: { id },
    });
    if (!exists) throw new NotFoundException('Academic faculty not found');

    const updated = await this.prisma.academicFaculty.update({
      where: { id },
      data: dto,
    });
    return { message: 'Academic faculty updated', data: updated };
  }

  async remove(id: string) {
    const faculty = await this.prisma.academicFaculty.findUnique({
      where: { id },
      include: { _count: { select: { departments: true } } },
    });
    if (!faculty) throw new NotFoundException('Academic faculty not found');
    if (faculty._count.departments > 0) {
      throw new ConflictException('Cannot delete: faculty has departments');
    }
    await this.prisma.academicFaculty.delete({ where: { id } });
    return { message: 'Academic faculty deleted', data: null };
  }
}
