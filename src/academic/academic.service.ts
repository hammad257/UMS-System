import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCourseDto,
  CreateDepartmentDto,
  CreateProgramDto,
  CreateSectionDto,
  CreateSemesterDto,
} from './dto/academic.dto';

@Injectable()
export class AcademicService {
  constructor(private readonly prisma: PrismaService) {}

  async createDepartment(dto: CreateDepartmentDto) {
    const duplicate = await this.prisma.department.findFirst({
      where: { OR: [{ name: dto.name }, { code: dto.code }] },
    });
    if (duplicate) {
      throw new ConflictException('Department name/code already exists');
    }

    const department = await this.prisma.department.create({ data: dto });
    return { message: 'Department created', data: department };
  }

  async getDepartments() {
    const departments = await this.prisma.department.findMany({
      include: {
        _count: { select: { programs: true, courses: true, faculty: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { message: 'Departments fetched', data: departments };
  }

  async createProgram(dto: CreateProgramDto) {
    const department = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
      select: { id: true },
    });
    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const duplicate = await this.prisma.program.findFirst({
      where: {
        OR: [
          { code: dto.code },
          { departmentId: dto.departmentId, name: dto.name },
        ],
      },
    });
    if (duplicate) {
      throw new ConflictException('Program already exists for this department');
    }

    const program = await this.prisma.program.create({ data: dto });
    return { message: 'Program created', data: program };
  }

  async getPrograms() {
    const programs = await this.prisma.program.findMany({
      include: {
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { students: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { message: 'Programs fetched', data: programs };
  }

  async createCourse(dto: CreateCourseDto) {
    const department = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
      select: { id: true },
    });
    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const duplicate = await this.prisma.course.findUnique({
      where: { code: dto.code },
    });
    if (duplicate) {
      throw new ConflictException('Course code already exists');
    }

    const course = await this.prisma.course.create({ data: dto });
    return { message: 'Course created', data: course };
  }

  async getCourses() {
    const courses = await this.prisma.course.findMany({
      include: {
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { sections: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { message: 'Courses fetched', data: courses };
  }

  async createSemester(dto: CreateSemesterDto) {
    const duplicate = await this.prisma.semester.findUnique({
      where: { name: dto.name },
    });
    if (duplicate) {
      throw new ConflictException('Semester name already exists');
    }

    const semester = await this.prisma.semester.create({
      data: {
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
    return { message: 'Semester created', data: semester };
  }

  async getSemesters() {
    const semesters = await this.prisma.semester.findMany({
      include: { _count: { select: { sections: true } } },
      orderBy: { startDate: 'desc' },
    });
    return { message: 'Semesters fetched', data: semesters };
  }

  async createSection(dto: CreateSectionDto) {
    const [course, semester, faculty] = await this.prisma.$transaction([
      this.prisma.course.findUnique({
        where: { id: dto.courseId },
        select: { id: true },
      }),
      this.prisma.semester.findUnique({
        where: { id: dto.semesterId },
        select: { id: true },
      }),
      this.prisma.faculty.findUnique({
        where: { id: dto.facultyId },
        select: { id: true },
      }),
    ]);

    if (!course) throw new NotFoundException('Course not found');
    if (!semester) throw new NotFoundException('Semester not found');
    if (!faculty) throw new NotFoundException('Faculty profile not found');

    const duplicate = await this.prisma.section.findFirst({
      where: {
        courseId: dto.courseId,
        semesterId: dto.semesterId,
        name: dto.name,
      },
    });
    if (duplicate) {
      throw new ConflictException(
        'Section already exists for this course and semester',
      );
    }

    const section = await this.prisma.section.create({
      data: {
        name: dto.name,
        courseId: dto.courseId,
        semesterId: dto.semesterId,
        facultyId: dto.facultyId,
        maxSeats: dto.maxSeats ?? 40,
      },
    });
    return { message: 'Section created', data: section };
  }

  async getSections() {
    const sections = await this.prisma.section.findMany({
      include: {
        course: { select: { id: true, code: true, title: true } },
        semester: { select: { id: true, name: true, isActive: true } },
        faculty: {
          select: { id: true, empId: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { message: 'Sections fetched', data: sections };
  }
}
