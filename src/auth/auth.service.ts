import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import {
  // RegisterStudentDto,
  // RegisterFacultyDto,
  LoginDto,
  RegisterUserDto,
} from './dto/auth.dto';
import { Student, Faculty } from '@prisma/client';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterUserDto) {
  await this.checkEmailUnique(dto.email);

  const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

  const isStudent = dto.type === 'STUDENT';
  const isFaculty = dto.type === 'FACULTY';

  // 🔥 VALIDATION GUARD (important)
  if (isStudent) {
    if (!dto.firstName || !dto.lastName || !dto.regNo || !dto.batch) {
      throw new Error('Missing student fields');
    }
  }

  if (isFaculty) {
    if (!dto.firstName || !dto.lastName || !dto.empId || !dto.designation) {
      throw new Error('Missing faculty fields');
    }
  }

  const user = await this.prisma.user.create({
    data: {
      email: dto.email,
      passwordHash,

      student: isStudent
        ? {
            create: {
              firstName: dto.firstName!,
              lastName: dto.lastName!,
              regNo: dto.regNo!,
              // batch: dto.batch!,
            },
          }
        : undefined,

      faculty: isFaculty
        ? {
            create: {
              firstName: dto.firstName!,
              lastName: dto.lastName!,
              empId: dto.empId!,
              designation: dto.designation!,
            },
          }
        : undefined,
    },
    include: {
      student: true,
      faculty: true,
    },
  });

  return {
    message: 'User registered successfully',
    data: user,
  };
}


  // // ───────────────────────── REGISTER STUDENT
  // async registerStudent(dto: RegisterStudentDto) {
  //   await this.checkEmailUnique(dto.email);

  //   const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

  //   const user = await this.prisma.$transaction(async (tx) => {
  //     const role = await tx.role.findUnique({
  //       where: { name: 'STUDENT' },
  //     });

  //     return tx.user.create({
  //       data: {
  //         email: dto.email,
  //         passwordHash,
  //         student: {
  //           create: {
  //             firstName: dto.firstName,
  //             lastName: dto.lastName,
  //             regNo: dto.regNo,
  //             batch: dto.batch,
  //           },
  //         },
  //         roles: {
  //           create: { roleId: role!.id },
  //         },
  //       },
  //       include: { student: true, roles: { include: { role: true } } },
  //     });
  //   });

  //   return this.buildAuthResponse(user, user.student);
  // }

  // // ───────────────────────── REGISTER FACULTY
  // async registerFaculty(dto: RegisterFacultyDto) {
  //   await this.checkEmailUnique(dto.email);

  //   const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

  //   const user = await this.prisma.$transaction(async (tx) => {
  //     const role = await tx.role.findUnique({
  //       where: { name: dto.role ?? 'FACULTY' },
  //     });

  //     return tx.user.create({
  //       data: {
  //         email: dto.email,
  //         passwordHash,
  //         faculty: {
  //           create: {
  //             firstName: dto.firstName,
  //             lastName: dto.lastName,
  //             empId: dto.empId,
  //             designation: dto.designation,
  //           },
  //         },
  //         roles: {
  //           create: { roleId: role!.id },
  //         },
  //       },
  //       include: { faculty: true, roles: { include: { role: true } } },
  //     });
  //   });

  //   return this.buildAuthResponse(user, user.faculty);
  // }

  // ───────────────────────── LOGIN
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        student: true,
        faculty: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const roles = user.roles.map((r) => r.role.name);

    const permissions = user.roles.flatMap((r) =>
      r.role.permissions.map((p) => p.permission.name),
    );

    const profile = roles.includes('STUDENT')
      ? user.student
      : user.faculty;

    return this.buildAuthResponse(user, profile, roles, permissions);
  }

  // ───────────────────────── TOKENS
  async generateTokens(
    userId: string,
    email: string,
    roles: string[],
    permissions: string[],
  ) {
    const payload = { sub: userId, email, roles, permissions };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 86400000),
      },
    });

    return { accessToken, refreshToken };
  }

  // ───────────────────────── RESPONSE
  private async buildAuthResponse(
  user: any,
  profile: Student | Faculty | null,
  roles?: string[],
  permissions?: string[],
) {
  // ✅ Always ensure array (fix error)
  const safeRoles =
    roles ?? user.roles.map((r) => r.role.name);

  const safePermissions =
    permissions ??
    user.roles.flatMap((r) =>
      r.role.permissions.map((p) => p.permission.name),
    );

  const tokens = await this.generateTokens(
    user.id,
    user.email,
    safeRoles,        // ✅ always string[]
    safePermissions,  // ✅ always string[]
  );

  return {
    message: 'Success',
    data: {
      user: {
        id: user.id,
        email: user.email,
        roles: safeRoles,
        permissions: safePermissions,
      },
      profile,
      ...tokens,
    },
  };
}

  private async checkEmailUnique(email: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existing) throw new ConflictException('Email exists');
  }

  async refreshTokens(userId: string, refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    const roles = user!.roles.map((r) => r.role.name);
    const permissions = user!.roles.flatMap((r) =>
      r.role.permissions.map((p) => p.permission.name),
    );

    return this.generateTokens(userId, user!.email, roles, permissions);
  }

  async logout(userId: string, refreshToken?: string) {
    await this.prisma.refreshToken.deleteMany({
      where: refreshToken ? { token: refreshToken } : { userId },
    });

    return { message: 'Logged out' };
  }
}