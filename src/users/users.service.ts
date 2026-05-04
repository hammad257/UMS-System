import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

export enum SystemRoleCode {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  REGISTRAR = 'REGISTRAR',
  FACULTY = 'FACULTY',
  FINANCE_OFFICER = 'FINANCE_OFFICER',
  STUDENT = 'STUDENT',
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  // ---------------------------------------------------------------------------
  // GET /users/me
  // ---------------------------------------------------------------------------
  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        userRoles: { select: { role: { select: { code: true, name: true } } } },
        scope: true,
        student: {
          include: {
            program: true,
            batch: true,
            currentSemester: true,
            guardians: { include: { guardian: true } },
          },
        },
        faculty: { include: { department: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const roles = user.userRoles.map((ur) => ur.role.code);

    let profile: unknown = null;
    if (roles.includes(SystemRoleCode.STUDENT)) profile = user.student;
    else if (roles.includes(SystemRoleCode.FACULTY)) profile = user.faculty;

    return {
      message: 'Profile fetched successfully',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
        status: user.status,
        roles,
        scope: {
          campusIds: user.scope?.campusIds ?? [],
          departmentIds: user.scope?.departmentIds ?? [],
        },
        createdAt: user.createdAt,
        profile,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // GET /users/students/:id
  // ---------------------------------------------------------------------------
  async getStudentById(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: { email: true, status: true, createdAt: true },
        },
        program: true,
        batch: true,
        currentSemester: true,
        guardians: { include: { guardian: true } },
      },
    });

    if (!student) throw new NotFoundException('Student not found');
    return { message: 'Student profile fetched', data: student };
  }

  // ---------------------------------------------------------------------------
  // GET /users/faculty/:id
  // ---------------------------------------------------------------------------
  async getFacultyById(facultyId: string) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { id: facultyId },
      include: {
        user: { select: { email: true, status: true, createdAt: true } },
        department: true,
      },
    });

    if (!faculty) throw new NotFoundException('Faculty not found');
    return { message: 'Faculty profile fetched', data: faculty };
  }

  // ---------------------------------------------------------------------------
  // GET /users/students
  // ---------------------------------------------------------------------------
  async getAllStudents(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: Prisma.StudentWhereInput = {
      user: { status: 'ACTIVE', deletedAt: null },
    };

    const [students, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        skip,
        take: limit,
        where,
        include: {
          user: {
            include: {
              userRoles: { include: { role: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      message: 'Students fetched',
      data: {
        students,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  // ---------------------------------------------------------------------------
  // GET /users/faculty
  // ---------------------------------------------------------------------------
  async getAllFaculty(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: Prisma.FacultyWhereInput = {
      user: { status: 'ACTIVE', deletedAt: null },
    };

    const [faculty, total] = await this.prisma.$transaction([
      this.prisma.faculty.findMany({
        skip,
        take: limit,
        where,
        include: {
          user: {
            include: {
              userRoles: { include: { role: true } },
            },
          },
          department: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.faculty.count({ where }),
    ]);

    return {
      message: 'Faculty fetched',
      data: {
        faculty,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  // ---------------------------------------------------------------------------
  // PATCH /users/:id/deactivate
  // ---------------------------------------------------------------------------
  async deactivateUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'INACTIVE' },
    });

    // Bump them out of any active session.
    await this.authService.revokeAllForUsers([userId]);

    return { message: 'User deactivated successfully', data: null };
  }

  async activateUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    });

    return { message: 'User activated successfully', data: null };
  }
}
