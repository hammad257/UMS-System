import {
  BadRequestException,
  Injectable,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { createHash } from 'crypto';
import * as argon2 from 'argon2';
import {
  // RegisterStudentDto,
  // RegisterFacultyDto,
  LoginDto,
  RegisterUserDto,
} from './dto/auth.dto';
import { Student, Faculty } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async register(dto: RegisterUserDto) {
  await this.checkEmailUnique(dto.email);

  const passwordHash = await argon2.hash(dto.password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  const isStudent = dto.type === 'STUDENT';
  const isFaculty = dto.type === 'FACULTY';

  // 🔥 VALIDATION GUARD (important)
  if (isStudent) {
    if (!dto.firstName || !dto.lastName || !dto.regNo || !dto.batch) {
      throw new BadRequestException('Missing student fields');
    }
  }

  if (isFaculty) {
    if (!dto.firstName || !dto.lastName || !dto.empId || !dto.designation) {
      throw new BadRequestException('Missing faculty fields');
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
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: dto.email, mode: 'insensitive' } },
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

    const valid = await argon2.verify(user.passwordHash, dto.password);
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
    const accessToken = await this.jwtService.signAsync(payload as any, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m',
    } as any);
    const refreshToken = await this.jwtService.signAsync(payload as any, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
    } as any);
    const hashedRefreshToken = this.hashRefreshToken(refreshToken);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: hashedRefreshToken,
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

  async refreshTokens(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        OR: [{ token: tokenHash }, { token: refreshToken }],
      },
      include: {
        user: {
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
        },
      },
    });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    const user = storedToken.user;
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid user');
    }

    const roles = user.roles.map((r) => r.role.name);
    const permissions = user.roles.flatMap((r) =>
      r.role.permissions.map((p) => p.permission.name),
    );

    return this.generateTokens(user.id, user.email, roles, permissions);
  }

  async logout(userId: string, refreshToken?: string) {
    const hashed = refreshToken ? this.hashRefreshToken(refreshToken) : undefined;
    await this.prisma.refreshToken.deleteMany({
      where: hashed
        ? { userId, OR: [{ token: hashed }, { token: refreshToken! }] }
        : { userId },
    });

    return { message: 'Logged out' };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
      },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Unauthorized');
    }
    const roles = user.roles.map((r) => r.role.name);
    const permissions = user.roles.flatMap((r) =>
      r.role.permissions.map((p) => p.permission.name),
    );
    return {
      message: 'Profile fetched',
      data: {
        user: {
          id: user.id,
          email: user.email,
          roles,
          permissions,
          scope: { campusIds: [], departmentIds: [] },
        },
      },
    };
  }
}