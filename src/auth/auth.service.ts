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
  RegisterStudentDto,
  RegisterFacultyDto,
  LoginDto,
} from './dto/auth.dto';
import { Faculty, Role, Student, User } from '@prisma/client';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private getRefreshTokenExpiryDate(): Date {
    const expiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    const value = parseInt(expiresIn, 10);
    const expiresAt = new Date();

    if (expiresIn.endsWith('h')) {
      expiresAt.setHours(expiresAt.getHours() + value);
      return expiresAt;
    }

    if (expiresIn.endsWith('m')) {
      expiresAt.setMinutes(expiresAt.getMinutes() + value);
      return expiresAt;
    }

    expiresAt.setDate(expiresAt.getDate() + (Number.isNaN(value) ? 7 : value));
    return expiresAt;
  }

  // ─── REGISTER STUDENT ────────────────────────────────────────────────────────
  async registerStudent(dto: RegisterStudentDto) {
    await this.checkEmailUnique(dto.email);

    // Check reg number uniqueness
    const existingReg = await this.prisma.student.findUnique({
      where: { regNo: dto.regNo },
    });
    if (existingReg) {
      throw new ConflictException('Registration number already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    // Use Prisma transaction to create User + Student profile atomically
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          role: Role.STUDENT,
          student: {
            create: {
              firstName: dto.firstName,
              lastName: dto.lastName,
              regNo: dto.regNo,
              batch: dto.batch,
              phone: dto.phone,
              address: dto.address,
              dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
            },
          },
        },
        include: { student: true },
      });
      return newUser;
    });

    this.logger.log(`Student registered: ${user.email}`);
    return this.buildAuthResponse(user, user.student);
  }

  // ─── REGISTER FACULTY ────────────────────────────────────────────────────────
  async registerFaculty(dto: RegisterFacultyDto) {
    await this.checkEmailUnique(dto.email);

    const existingEmp = await this.prisma.faculty.findUnique({
      where: { empId: dto.empId },
    });
    if (existingEmp) {
      throw new ConflictException('Employee ID already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          role: dto.role ?? Role.FACULTY,
          faculty: {
            create: {
              firstName: dto.firstName,
              lastName: dto.lastName,
              empId: dto.empId,
              designation: dto.designation,
              phone: dto.phone,
            },
          },
        },
        include: { faculty: true },
      });
      return newUser;
    });

    this.logger.log(`Faculty registered: ${user.email}`);
    return this.buildAuthResponse(user, user.faculty);
  }

  // ─── LOGIN ───────────────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    // Find user with their profile
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { student: true, faculty: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated. Contact admin.');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const profile = user.role === Role.STUDENT ? user.student : user.faculty;
    this.logger.log(`User logged in: ${user.email} [${user.role}]`);

    return this.buildAuthResponse(user, profile);
  }

  // ─── REFRESH TOKENS ──────────────────────────────────────────────────────────
  async refreshTokens(userId: string, oldRefreshToken: string) {
    // Rotate: delete old refresh token, issue new pair
    await this.prisma.refreshToken.delete({
      where: { token: oldRefreshToken },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { message: 'Tokens refreshed', data: tokens };
  }

  // ─── LOGOUT ──────────────────────────────────────────────────────────────────
  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      // Delete specific session
      await this.prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    } else {
      // Delete ALL sessions for this user (logout from all devices)
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
    }
    this.logger.log(`User logged out: ${userId}`);
    return { message: 'Logged out successfully', data: null };
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────────

  private async checkEmailUnique(email: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');
  }

  async generateTokens(userId: string, email: string, role: Role) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    const expiresAt = this.getRefreshTokenExpiryDate();

    await this.prisma.refreshToken.create({
      data: { userId, token: refreshToken, expiresAt },
    });

    return { accessToken, refreshToken };
  }

  private async buildAuthResponse(
    user: Pick<User, 'id' | 'email' | 'role'>,
    profile: Student | Faculty | null,
  ) {
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      message: 'Success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        profile,
        ...tokens,
      },
    };
  }
}
