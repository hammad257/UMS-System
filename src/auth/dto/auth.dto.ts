import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

const NON_STUDENT_ROLES = [Role.FACULTY, Role.ADMIN, Role.STAFF, Role.SECURITY];
export type NonStudentRole = (typeof NON_STUDENT_ROLES)[number];

export class RegisterStudentDto {
  @ApiProperty({ example: 'student1@ums.edu.pk' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  email: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @ApiProperty({ example: 'Ali' })
  @IsString()
  @IsNotEmpty()
  firstName: string;
  @ApiProperty({ example: 'Khan' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'BSCS-F21-001' })
  @IsString()
  @IsNotEmpty()
  regNo: string; // e.g. "BSCS-F21-001"

  @ApiProperty({ example: 'Fall-2021' })
  @IsString()
  @IsNotEmpty()
  batch: string; // e.g. "Fall-2021"

  @ApiPropertyOptional({ example: '+92-300-1234567' })
  @IsOptional()
  @IsString()
  phone?: string;
  @ApiPropertyOptional({ example: 'Lahore, Pakistan' })
  @IsOptional()
  @IsString()
  address?: string;
  @ApiPropertyOptional({ example: '2003-05-10' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}

export class RegisterFacultyDto {
  @ApiProperty({ example: 'teacher1@ums.edu.pk' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  email: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @ApiProperty({ example: 'Ayesha' })
  @IsString()
  @IsNotEmpty()
  firstName: string;
  @ApiProperty({ example: 'Rashid' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'FAC-001' })
  @IsString()
  @IsNotEmpty()
  empId: string; // e.g. "FAC-001"

  @ApiProperty({ example: 'Associate Professor' })
  @IsString()
  @IsNotEmpty()
  designation: string; // e.g. "Associate Professor"

  @ApiPropertyOptional({
    enum: NON_STUDENT_ROLES,
    default: Role.FACULTY,
    example: Role.ADMIN,
    description: 'Select FACULTY, ADMIN, STAFF, or SECURITY',
  })
  @IsOptional()
  @IsEnum(NON_STUDENT_ROLES)
  role?: NonStudentRole;

  @ApiPropertyOptional({ example: '+92-321-0001111' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'student1@ums.edu.pk' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  email: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
