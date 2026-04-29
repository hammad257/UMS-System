import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export enum SystemRole {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT',
  FACULTY = 'FACULTY',
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── GET OWN PROFILE ─────────────────────────────────────────────────────────
  async getMyProfile(userId: string) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        select: {
          role: {
            select: {
              name: true,
            },
          },
        },
      },
      student: {
        include: {
          program: true,
          batch: true,
          currentSemester: true,
          guardians: {
            include: {
              guardian: true,
            },
          },
        },
      },
      faculty: true,
    },
  });

  if (!user) throw new NotFoundException('User not found');

  const roles = user.roles.map((r) => r.role.name);

  let profile = null as any;

  if (roles.includes(SystemRole.STUDENT)) {
    profile = user.student;
  } else if (roles.includes(SystemRole.FACULTY)) {
    profile = user.faculty;
  }

  return {
    message: 'Profile fetched successfully',
    data: {
      id: user.id,
      email: user.email,
      roles,
      isActive: user.isActive,
      createdAt: user.createdAt,
      profile,
    },
  };
}

  // ─── GET STUDENT PROFILE BY ID ───────────────────────────────────────────────
  async getStudentById(studentId: string) {
  const student = await this.prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: {
        select: {
          email: true,
          isActive: true,
          createdAt: true,
        },
      },
      program: true,
      batch: true,
      currentSemester: true,
      guardians: {
        include: {
          guardian: true,
        },
      },
    },
  });

  if (!student) throw new NotFoundException('Student not found');

  return {
    message: 'Student profile fetched',
    data: student,
  };
}

  // ─── GET FACULTY PROFILE BY ID ───────────────────────────────────────────────
  async getFacultyById(facultyId: string) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { id: facultyId },
      include: {
        user: {
          select: {
            email: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    if (!faculty) throw new NotFoundException('Faculty not found');

    return {
      message: 'Faculty profile fetched',
      data: faculty,
    };
  }

  // ─── LIST ALL STUDENTS ───────────────────────────────────────────────────────
  async getAllStudents(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [students, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        skip,
        take: limit,
        where: {
          user: {
            isActive: true,
          },
        },
        include: {
          user: {
            include: {
              roles: {
                include: { role: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.student.count({
        where: {
          user: {
            isActive: true,
          },
        },
      }),
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

  // ─── LIST ALL FACULTY ────────────────────────────────────────────────────────
  async getAllFaculty(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [faculty, total] = await this.prisma.$transaction([
      this.prisma.faculty.findMany({
        skip,
        take: limit,
        where: {
          user: {
            isActive: true,
          },
        },
        include: {
          user: {
            include: {
              roles: {
                include: { role: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.faculty.count({
        where: {
          user: {
            isActive: true,
          },
        },
      }),
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

  // ─── DEACTIVATE USER ─────────────────────────────────────────────────────────
  async deactivateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // revoke all sessions
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return {
      message: 'User deactivated successfully',
      data: null,
    };
  }
}