import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAcademicSessionDto,
  CreateCourseDto,
  CreateDepartmentDto,
  CreateProgramCourseDto,
  CreateProgramDto,
  CreateSectionDto,
  CreateSemesterCourseDto,
  CreateSemesterDto,
  InitializeSessionDto,
  UpdateAcademicSessionDto,
  UpdateDepartmentDto,
  UpdateProgramDto,
  UpdateSemesterDto,
} from './dto/academic.dto';

@Injectable()
export class AcademicService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================================
  // Departments
  // =========================================================================

  async createDepartment(dto: CreateDepartmentDto) {
    const faculty = await this.prisma.academicFaculty.findUnique({
      where: { id: dto.academicFacultyId },
      select: { id: true },
    });
    if (!faculty) {
      throw new NotFoundException('Academic faculty not found');
    }

    try {
      const department = await this.prisma.department.create({
        data: {
          name: dto.name,
          code: dto.code,
          academicFacultyId: dto.academicFacultyId,
          head: dto.head,
          email: dto.email,
          status: dto.status,
        },
      });
      return { message: 'Department created', data: department };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Department code already exists');
      }
      throw e;
    }
  }

  async getDepartments() {
    const departments = await this.prisma.department.findMany({
      include: {
        academicFaculty: { select: { id: true, code: true, name: true } },
        _count: { select: { programs: true, courses: true, faculty: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { message: 'Departments fetched', data: departments };
  }

  async updateDepartment(id: string, dto: UpdateDepartmentDto) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) throw new NotFoundException('Department not found');

    const updated = await this.prisma.department.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        academicFacultyId: dto.academicFacultyId,
        head: dto.head,
        email: dto.email,
        status: dto.status,
      },
    });
    return { message: 'Department updated', data: updated };
  }

  async deleteDepartment(id: string) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { programs: true } } },
    });
    if (!dept) throw new NotFoundException('Department not found');
    if (dept._count.programs > 0) {
      throw new ConflictException('Cannot delete: department has programs');
    }
    await this.prisma.department.delete({ where: { id } });
    return { message: 'Department deleted', data: null };
  }

  // =========================================================================
  // Programs
  // =========================================================================

  async createProgram(dto: CreateProgramDto) {
    const department = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
      select: { id: true },
    });
    if (!department) throw new NotFoundException('Department not found');

    try {
      const program = await this.prisma.program.create({
        data: {
          name: dto.name,
          code: dto.code,
          departmentId: dto.departmentId,
          level: dto.level,
          durationYears: dto.durationYears,
          totalCredits: dto.totalCredits,
          status: dto.status,
        },
      });
      return { message: 'Program created', data: program };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          'Program with this code/name already exists',
        );
      }
      throw e;
    }
  }

  async getPrograms() {
    const programs = await this.prisma.program.findMany({
      include: {
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { students: true, batches: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { message: 'Programs fetched', data: programs };
  }

  async updateProgram(id: string, dto: UpdateProgramDto) {
    const exists = await this.prisma.program.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Program not found');

    const updated = await this.prisma.program.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        departmentId: dto.departmentId,
        level: dto.level,
        durationYears: dto.durationYears,
        totalCredits: dto.totalCredits,
        status: dto.status,
      },
    });
    return { message: 'Program updated', data: updated };
  }

  async deleteProgram(id: string) {
    const program = await this.prisma.program.findUnique({
      where: { id },
      include: { _count: { select: { batches: true } } },
    });
    if (!program) throw new NotFoundException('Program not found');
    if (program._count.batches > 0) {
      throw new ConflictException('Cannot delete: program has batches');
    }
    await this.prisma.program.delete({ where: { id } });
    return { message: 'Program deleted', data: null };
  }

  // =========================================================================
  // Courses
  // =========================================================================

  async createCourse(dto: CreateCourseDto) {
    const department = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
      select: { id: true },
    });
    if (!department) throw new NotFoundException('Department not found');

    const duplicate = await this.prisma.course.findUnique({
      where: { code: dto.code },
    });
    if (duplicate) throw new ConflictException('Course code already exists');

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

  // =========================================================================
  // Academic Sessions  (calendar root)
  // =========================================================================

  async createAcademicSession(dto: CreateAcademicSessionDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end <= start) {
      throw new BadRequestException('endDate must be after startDate');
    }

    try {
      const session = await this.prisma.academicSession.create({
        data: {
          code: dto.code,
          name: dto.name,
          startDate: start,
          endDate: end,
          status: dto.status,
        },
      });
      return { message: 'Academic session created', data: session };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Session code already exists');
      }
      throw e;
    }
  }

  async getAcademicSessions() {
    const sessions = await this.prisma.academicSession.findMany({
      include: {
        _count: { select: { semesters: true, batches: true } },
      },
      orderBy: { startDate: 'desc' },
    });
    return { message: 'Academic sessions fetched', data: sessions };
  }

  async updateAcademicSession(id: string, dto: UpdateAcademicSessionDto) {
    const exists = await this.prisma.academicSession.findUnique({
      where: { id },
    });
    if (!exists) throw new NotFoundException('Academic session not found');

    const start = dto.startDate ? new Date(dto.startDate) : exists.startDate;
    const end = dto.endDate ? new Date(dto.endDate) : exists.endDate;
    if (end <= start) {
      throw new BadRequestException('endDate must be after startDate');
    }

    const updated = await this.prisma.academicSession.update({
      where: { id },
      data: {
        code: dto.code,
        name: dto.name,
        startDate: start,
        endDate: end,
        status: dto.status,
      },
    });
    return { message: 'Academic session updated', data: updated };
  }

  async deleteAcademicSession(id: string) {
    const sess = await this.prisma.academicSession.findUnique({
      where: { id },
      include: { _count: { select: { semesters: true, batches: true } } },
    });
    if (!sess) throw new NotFoundException('Academic session not found');
    if (sess._count.semesters > 0 || sess._count.batches > 0) {
      throw new ConflictException(
        'Cannot delete: session has semesters or batches',
      );
    }
    await this.prisma.academicSession.delete({ where: { id } });
    return { message: 'Academic session deleted', data: null };
  }

  // =========================================================================
  // Semesters  (live inside an AcademicSession)
  // =========================================================================

  async createSemester(dto: CreateSemesterDto) {
    const session = await this.prisma.academicSession.findUnique({
      where: { id: dto.sessionId },
    });
    if (!session) throw new NotFoundException('Academic session not found');

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end <= start) {
      throw new BadRequestException('endDate must be after startDate');
    }
    if (start < session.startDate || end > session.endDate) {
      throw new BadRequestException(
        "Semester dates must fall within the session's window",
      );
    }

    try {
      const semester = await this.prisma.semester.create({
        data: {
          name: dto.name,
          sessionId: dto.sessionId,
          sequence: dto.sequence,
          startDate: start,
          endDate: end,
          status: dto.status,
        },
      });
      return { message: 'Semester created', data: semester };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          'A semester with that sequence already exists in this session',
        );
      }
      throw e;
    }
  }

  async getAllSemesters() {
    const semesters = await this.prisma.semester.findMany({
      include: {
        session: { select: { id: true, code: true, name: true } },
        _count: { select: { sections: true, students: true } },
      },
      orderBy: [{ session: { startDate: 'desc' } }, { sequence: 'asc' }],
    });
    return { message: 'Semesters fetched', data: semesters };
  }

  async updateSemester(id: string, dto: UpdateSemesterDto) {
    const exists = await this.prisma.semester.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Semester not found');

    const updated = await this.prisma.semester.update({
      where: { id },
      data: {
        name: dto.name,
        sequence: dto.sequence,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        status: dto.status,
      },
    });
    return { message: 'Semester updated', data: updated };
  }

  async deleteSemester(id: string) {
    const sem = await this.prisma.semester.findUnique({
      where: { id },
      include: { _count: { select: { sections: true, students: true } } },
    });
    if (!sem) throw new NotFoundException('Semester not found');
    if (sem._count.sections > 0 || sem._count.students > 0) {
      throw new ConflictException(
        'Cannot delete: semester has sections or students',
      );
    }
    await this.prisma.semester.delete({ where: { id } });
    return { message: 'Semester deleted', data: null };
  }

  // =========================================================================
  // Curriculum joins
  // =========================================================================

  async createProgramCourse(dto: CreateProgramCourseDto) {
    const [program, course] = await this.prisma.$transaction([
      this.prisma.program.findUnique({ where: { id: dto.programId } }),
      this.prisma.course.findUnique({ where: { id: dto.courseId } }),
    ]);
    if (!program) throw new NotFoundException('Program not found');
    if (!course) throw new NotFoundException('Course not found');

    const exists = await this.prisma.programCourse.findFirst({
      where: { programId: dto.programId, courseId: dto.courseId },
    });
    if (exists) {
      throw new ConflictException('Course already assigned to program');
    }

    const data = await this.prisma.programCourse.create({ data: dto });
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
      where: { semesterId: dto.semesterId, courseId: dto.courseId },
    });
    if (exists) {
      throw new ConflictException('Course already assigned to semester');
    }

    const data = await this.prisma.semesterCourse.create({ data: dto });
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

  // =========================================================================
  // Sections
  // =========================================================================

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

    if (
      faculty.departmentId &&
      course.departmentId &&
      faculty.departmentId !== course.departmentId
    ) {
      throw new ConflictException(
        'Faculty does not belong to the same department as course',
      );
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
          select: { id: true, code: true, title: true, creditHours: true },
        },
        semester: {
          select: {
            id: true,
            name: true,
            sequence: true,
            session: { select: { id: true, code: true, name: true } },
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
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { message: 'Sections fetched successfully', data: sections };
  }

  // =========================================================================
  // Hierarchy view  (Module 3 §Special endpoint)
  // =========================================================================

  async getHierarchy() {
    const campuses = await this.prisma.campus.findMany({
      include: {
        faculties: {
          include: {
            departments: {
              include: {
                programs: {
                  include: { _count: { select: { batches: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    const data = campuses.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      status: c.status,
      faculties: c.faculties.map((f) => ({
        id: f.id,
        code: f.code,
        name: f.name,
        status: f.status,
        departments: f.departments.map((d) => ({
          id: d.id,
          code: d.code,
          name: d.name,
          status: d.status,
          programs: d.programs.map((p) => ({
            id: p.id,
            code: p.code,
            name: p.name,
            level: p.level,
            status: p.status,
            batchCount: p._count.batches,
          })),
        })),
      })),
    }));

    return { message: 'Academic hierarchy fetched', data: { campuses: data } };
  }

  async getCalendar() {
    const sessions = await this.prisma.academicSession.findMany({
      include: {
        semesters: { orderBy: { sequence: 'asc' } },
      },
      orderBy: { startDate: 'desc' },
    });
    return { message: 'Academic calendar fetched', data: sessions };
  }

  // =========================================================================
  // Bulk initialize a session  (Module 3 §Bulk-create endpoint)
  // =========================================================================

  async initializeSession(sessionId: string, dto: InitializeSessionDto) {
    const session = await this.prisma.academicSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Academic session not found');

    return this.prisma.$transaction(async (tx) => {
      const semesters = await Promise.all(
        dto.semesters.map((s) =>
          tx.semester.create({
            data: {
              sessionId,
              name: s.name,
              sequence: s.sequence,
              startDate: new Date(s.startDate),
              endDate: new Date(s.endDate),
            },
          }),
        ),
      );

      const batches = await Promise.all(
        dto.batches.map((b) =>
          tx.batch.create({
            data: {
              programId: b.programId,
              sessionId,
              name: b.name,
              startYear: b.startYear,
              endYear: b.endYear,
              intake: b.intake ?? 0,
            },
          }),
        ),
      );

      return {
        message: 'Session initialized',
        data: { semesters, batches },
      };
    });
  }
}
