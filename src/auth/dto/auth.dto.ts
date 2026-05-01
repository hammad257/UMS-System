import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsDateString,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─────────────────────────────────────────────
// RBAC ROLES (STATIC LIST ONLY FOR VALIDATION)
// (DB still holds real roles)
// ─────────────────────────────────────────────
export const NON_STUDENT_ROLES = [
  'FACULTY',
  'ADMIN',
  'STAFF',
  'SECURITY',
] as const;

export type NonStudentRole = (typeof NON_STUDENT_ROLES)[number];

export class RegisterUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;

  // profile type decides table
  @ApiProperty({ example: 'STUDENT' })
  @IsString()
  @IsNotEmpty()
  type!: 'STUDENT' | 'FACULTY';

  // STUDENT fields
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  regNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batch?: string;

  // FACULTY fields
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  empId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  designation?: string;
}

// ─────────────────────────────────────────────
// LOGIN DTO
// ─────────────────────────────────────────────
export class LoginDto {
  @ApiProperty({ example: 'student1@ums.edu.pk' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  email!: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}