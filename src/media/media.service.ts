import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMediaDto } from './dto/create-media.dto';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

 async upload(file: Express.Multer.File, dto: CreateMediaDto, userId: string) {
  if (!file) {
    throw new Error('File is required');
  }

  return this.prisma.media.create({
    data: {
      fileName: file.originalname,
      url: `/uploads/${file.filename}`,
      fileType: dto.fileType,

      uploadedById: userId,
      studentId: dto.studentId,
      facultyId: dto.facultyId,
      courseId: dto.courseId,
      sectionId: dto.sectionId,
    },
  });
}

  async findAll() {
    return this.prisma.media.findMany({
      include: {
        uploadedBy: true,
        student: true,
        faculty: true,
        course: true,
        section: true,
      },
    });
  }

  async findBySection(sectionId: string) {
    return this.prisma.media.findMany({
      where: { sectionId },
    });
  }

  async remove(id: string) {
    return this.prisma.media.delete({
      where: { id },
    });
  }
}