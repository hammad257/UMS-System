import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Prisma, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterUserDto } from './dto/auth.dto';

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

const REFRESH_TTL_DAYS = 7;
const REFRESH_TTL_MS = REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ---------------------------------------------------------------------------
  // Hashing helpers
  // ---------------------------------------------------------------------------

  private async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
  }

  private hashRefreshToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  // ---------------------------------------------------------------------------
  // Effective roles + permissions resolution
  // ---------------------------------------------------------------------------

  private async loadUserAuthContext(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } },
              },
            },
          },
        },
        scope: true,
      },
    });

    if (!user) return null;

    const roles = user.userRoles.map((ur) => ur.role.code);
    const permissionSet = new Set<string>();
    for (const ur of user.userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permissionSet.add(rp.permission.code);
      }
    }
    const permissions = [...permissionSet];

    const scope = {
      campusIds: user.scope?.campusIds ?? [],
      departmentIds: user.scope?.departmentIds ?? [],
    };

    return { user, roles, permissions, scope };
  }

  // ---------------------------------------------------------------------------
  // Token issuance
  // ---------------------------------------------------------------------------

  private async issueTokens(args: {
    userId: string;
    email: string;
    roles: string[];
    permissions: string[];
    scope: { campusIds: string[]; departmentIds: string[] };
    tokenVersion: number;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<IssuedTokens> {
    const accessToken = await this.jwtService.signAsync(
      {
        sub: args.userId,
        email: args.email,
        roles: args.roles,
        permissions: args.permissions,
        scope: args.scope,
        tv: args.tokenVersion,
      } as Record<string, unknown>,
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ??
          '15m') as unknown as number,
      },
    );

    // Refresh token is opaque (per Module 1 spec) — 32 random bytes base64url.
    const rawRefreshToken = randomBytes(32).toString('base64url');
    const tokenHash = this.hashRefreshToken(rawRefreshToken);

    await this.prisma.refreshToken.create({
      data: {
        userId: args.userId,
        tokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
        userAgent: args.userAgent,
        ipAddress: args.ipAddress,
      },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  private buildLoginPayload(args: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      photoUrl: string | null;
      status: UserStatus;
    };
    roles: string[];
    permissions: string[];
    scope: { campusIds: string[]; departmentIds: string[] };
    tokens: IssuedTokens;
  }) {
    return {
      message: 'Login successful',
      data: {
        ...args.tokens,
        user: {
          id: args.user.id,
          email: args.user.email,
          firstName: args.user.firstName,
          lastName: args.user.lastName,
          photoUrl: args.user.photoUrl,
          status: args.user.status,
          roles: args.roles,
          permissions: args.permissions,
          scope: args.scope,
        },
      },
    };
  }

  // ---------------------------------------------------------------------------
  // POST /auth/register — kept for current FE; admin user create lives at
  // POST /users in the Identity module (Module 2).
  // ---------------------------------------------------------------------------

  async register(dto: RegisterUserDto) {
    await this.assertEmailUnique(dto.email);

    const isStudent = dto.type === 'STUDENT';
    const isFaculty = dto.type === 'FACULTY';

    if (isStudent && !dto.regNo) {
      throw new BadRequestException('regNo is required for STUDENT');
    }
    if (isFaculty && (!dto.empId || !dto.designation)) {
      throw new BadRequestException(
        'empId and designation are required for FACULTY',
      );
    }

    const passwordHash = await this.hashPassword(dto.password);

    const roleCodes = dto.roleCodes ?? (dto.type ? [dto.type] : []);
    const roleRecords = roleCodes.length
      ? await this.prisma.role.findMany({
          where: { code: { in: roleCodes } },
          select: { id: true, code: true },
        })
      : [];

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        status: 'PENDING',

        userRoles: roleRecords.length
          ? {
              create: roleRecords.map((r) => ({ roleId: r.id })),
            }
          : undefined,

        student: isStudent
          ? {
              create: {
                firstName: dto.firstName,
                lastName: dto.lastName,
                regNo: dto.regNo!,
              },
            }
          : undefined,

        faculty: isFaculty
          ? {
              create: {
                firstName: dto.firstName,
                lastName: dto.lastName,
                empId: dto.empId!,
                designation: dto.designation!,
              },
            }
          : undefined,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });

    return { message: 'User registered successfully', data: user };
  }

  // ---------------------------------------------------------------------------
  // POST /auth/login
  // ---------------------------------------------------------------------------

  async login(
    dto: LoginDto,
    meta: { userAgent?: string; ipAddress?: string } = {},
  ) {
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: dto.email, mode: 'insensitive' } },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        deletedAt: true,
        status: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        tokenVersion: true,
      },
    });

    // Generic message — never leak whether the email exists.
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (user.status === 'INACTIVE') {
      throw new ForbiddenException('Account is inactive');
    }
    if (user.status === 'PENDING') {
      throw new ForbiddenException('Account is pending activation');
    }

    const ctx = await this.loadUserAuthContext(user.id);
    if (!ctx) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokens({
      userId: user.id,
      email: user.email,
      roles: ctx.roles,
      permissions: ctx.permissions,
      scope: ctx.scope,
      tokenVersion: user.tokenVersion,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    });

    return this.buildLoginPayload({
      user,
      roles: ctx.roles,
      permissions: ctx.permissions,
      scope: ctx.scope,
      tokens,
    });
  }

  // ---------------------------------------------------------------------------
  // POST /auth/refresh — single-use rotation with theft detection
  // ---------------------------------------------------------------------------

  async refreshTokens(
    rawRefreshToken: string,
    meta: { userAgent?: string; ipAddress?: string } = {},
  ) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }
    const tokenHash = this.hashRefreshToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Theft signal: someone is presenting a token we already rotated away.
    if (stored.revokedAt) {
      await this.revokeAllForUsers([stored.userId]);
      this.logger.warn(
        `Refresh-token reuse detected for user=${stored.userId}; revoked all sessions.`,
      );
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const ctx = await this.loadUserAuthContext(stored.userId);
    if (!ctx || ctx.user.deletedAt || ctx.user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    const tokens = await this.issueTokens({
      userId: ctx.user.id,
      email: ctx.user.email,
      roles: ctx.roles,
      permissions: ctx.permissions,
      scope: ctx.scope,
      tokenVersion: ctx.user.tokenVersion,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    });

    // Revoke the old token AFTER the new one is issued so we have its id.
    const newHash = this.hashRefreshToken(tokens.refreshToken);
    const newRow = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: newHash },
      select: { id: true },
    });
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date(), replacedBy: newRow?.id ?? null },
    });

    return { message: 'Tokens refreshed', data: tokens };
  }

  // ---------------------------------------------------------------------------
  // POST /auth/logout
  // ---------------------------------------------------------------------------

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = this.hashRefreshToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { userId, tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    // Invalidate all access JWTs for this user (including the one used for this request).
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
    return { message: 'Logged out' };
  }

  // ---------------------------------------------------------------------------
  // GET /auth/me
  // ---------------------------------------------------------------------------

  async me(userId: string) {
    const ctx = await this.loadUserAuthContext(userId);
    if (!ctx || ctx.user.deletedAt || ctx.user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Unauthorized');
    }

    return {
      message: 'Profile fetched',
      data: {
        user: {
          id: ctx.user.id,
          email: ctx.user.email,
          firstName: ctx.user.firstName,
          lastName: ctx.user.lastName,
          photoUrl: ctx.user.photoUrl,
          status: ctx.user.status,
          roles: ctx.roles,
          permissions: ctx.permissions,
          scope: ctx.scope,
        },
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async assertEmailUnique(email: string) {
    const existing = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existing) throw new ConflictException('Email already in use');
  }

  /**
   * Re-export of the password hasher so the Identity (Users) module can reuse
   * the exact same parameters when admins create users.
   */
  hashPasswordPublic(password: string): Promise<string> {
    return this.hashPassword(password);
  }

  /**
   * Revoke every refresh token for the given users. Called by the Identity
   * module when role/permission changes need to bump users to re-login.
   */
  async revokeAllForUsers(userIds: string[]) {
    const unique = [...new Set(userIds)];
    if (unique.length === 0) return;
    await this.prisma.$transaction([
      this.prisma.refreshToken.updateMany({
        where: { userId: { in: unique }, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      ...unique.map((id) =>
        this.prisma.user.update({
          where: { id },
          data: { tokenVersion: { increment: 1 } },
        }),
      ),
    ]);
  }
}

// Re-export Prisma error helper so callers can keep using one import.
export { Prisma };
