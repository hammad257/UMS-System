import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCourseDto,
  CreateDepartmentDto,
  CreateProgramCourseDto,
  CreateProgramDto,
  CreateSectionDto,
  CreateSemesterCourseDto,
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

    const department = await this.prisma.department.create({ 
      data: {
    name: dto.name,
    code: dto.code,
    academicFaculty: {
      connect: { id: dto.academicFacultyId },
    },
  },
     });
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
  const duplicate = await this.prisma.semester.findFirst({
    where: { name: dto.name },
  });

  if (duplicate) {
    throw new ConflictException('Semester already exists');
  }

  const semester = await this.prisma.semester.create({
    data: {
      name: dto.name,
      academicYear: dto.academicYear,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      programId: dto.programId ?? null,
    },
  });

  return {
    message: 'Semester created successfully',
    data: semester,
  };
}

async getAllSemesters() {
  return this.prisma.semester.findMany({
    include: {
      program: {
        include: {
          department: {
            include: {
              academicFaculty: {
                include: {
                  campus: true,
                },
              },
            },
          },
        },
      },
      sections: true,
    },
  });
}

async createProgramCourse(dto: CreateProgramCourseDto) {
  const [program, course] = await this.prisma.$transaction([
    this.prisma.program.findUnique({ where: { id: dto.programId } }),
    this.prisma.course.findUnique({ where: { id: dto.courseId } }),
  ]);

  if (!program) throw new NotFoundException('Program not found');
  if (!course) throw new NotFoundException('Course not found');

  const exists = await this.prisma.programCourse.findFirst({
    where: {
      programId: dto.programId,
      courseId: dto.courseId,
    },
  });

  if (exists) {
    throw new ConflictException('Course already assigned to program');
  }

  const data = await this.prisma.programCourse.create({
    data: dto,
  });

  return { message: 'Course assigned to program', data };
}

async getProgramCourses() {
  const data = await this.prisma.programCourse.findMany({
    include: {
      program: { select: { id: true, name: true } },
      course: { select: { id: true, title: true, code: true } },
    },
  });

  return { message: 'Program courses fetched', data };
}

async createSemesterCourse(dto: CreateSemesterCourseDto) {
  const [semester, course, program] = await this.prisma.$transaction([
    this.prisma.semester.findUnique({ where: { id: dto.semesterId } }),
    this.prisma.course.findUnique({ where: { id: dto.courseId } }),
    this.prisma.program.findUnique({ where: { id: dto.programId } }),
  ]);

  if (!semester) throw new NotFoundException('Semester not found');
  if (!course) throw new NotFoundException('Course not found');
  if (!program) throw new NotFoundException('Program not found');

  const exists = await this.prisma.semesterCourse.findFirst({
    where: {
      semesterId: dto.semesterId,
      courseId: dto.courseId,
    },
  });

  if (exists) {
    throw new ConflictException('Course already assigned to semester');
  }

  const data = await this.prisma.semesterCourse.create({
    data: dto,
  });

  return { message: 'Course assigned to semester', data };
}

async getSemesterCourses() {
  const data = await this.prisma.semesterCourse.findMany({
    include: {
      semester: { select: { id: true, name: true } },
      course: { select: { id: true, title: true, code: true } },
      program: { select: { id: true, name: true } },
    },
  });

  return { message: 'Semester courses fetched', data };
}

  // async getSemesters() {
  //   const semesters = await this.prisma.semester.findMany({
  //     include: { _count: { select: { sections: true } } },
  //     orderBy: { startDate: 'desc' },
  //   });
  //   return { message: 'Semesters fetched', data: semesters };
  // }

  async createSection(dto: CreateSectionDto) {
    const [course, semester, faculty] = await this.prisma.$transaction([
      this.prisma.course.findUnique({
        where: { id: dto.courseId },
        select: { id: true, departmentId: true },
      }),
      this.prisma.semester.findUnique({
        where: { id: dto.semesterId },
        select: { id: true },
      }),
      this.prisma.faculty.findUnique({
        where: { id: dto.facultyId },
        select: { id: true, departmentId: true },
      }),
    ]);

    if (!course) throw new NotFoundException('Course not found');
    if (!semester) throw new NotFoundException('Semester not found');
    if (!faculty) throw new NotFoundException('Faculty profile not found');

    // 🔥 NEW: ensure faculty belongs to same department as course
  if (faculty.departmentId && course.departmentId) {
    if (faculty.departmentId !== course.departmentId) {
      throw new ConflictException(
        'Faculty does not belong to the same department as course',
      );
    }
  }

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
      course: {
        select: {
          id: true,
          code: true,
          title: true,
          creditHours: true,
        },
      },
      semester: {
        select: {
          id: true,
          name: true,
          academicYear: true,
          isActive: true,
        },
      },
      faculty: {
        select: {
          id: true,
          empId: true,
          firstName: true,
          lastName: true,
          designation: true,
        },
      },

      // 🔥 future-ready for enrollment
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    message: 'Sections fetched successfully',
    data: sections,
  };
}
}
