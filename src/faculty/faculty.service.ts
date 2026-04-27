import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAcademicFacultyDto } from './dto/create-faculty.dto';

@Injectable()
export class AcademicFacultyService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateAcademicFacultyDto) {
    // check campus exists
    const campus = await this.prisma.campus.findUnique({
      where: { id: dto.campusId },
    });

    if (!campus) {
      throw new BadRequestException('Campus not found');
    }

    // prevent duplicates (name + campus)
    const exists = await this.prisma.academicFaculty.findFirst({
      where: {
        name: dto.name,
        campusId: dto.campusId,
      },
    });

    if (exists) {
      throw new BadRequestException('Academic Faculty already exists in this campus');
    }

    return this.prisma.academicFaculty.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.academicFaculty.findMany({
      include: {
        campus: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const faculty = await this.prisma.academicFaculty.findUnique({
      where: { id },
      include: {
        campus: true,
        departments: true,
      },
    });

    if (!faculty) {
      throw new NotFoundException('Academic Faculty not found');
    }

    return faculty;
  }
}