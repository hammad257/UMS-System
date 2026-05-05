import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  EnrollmentSemesterStatus,
  GuardianRelation,
  StudentEnrollmentStatus,
  StudentStatus,
} from '@prisma/client';

// ---------------------------------------------------------------------------
// Student
// ---------------------------------------------------------------------------

export class CreateUserForStudentDto {
  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class CreateStudentDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(50)
  lastName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty()
  @IsDateString()
  dob!: string;

  @ApiProperty()
  @IsString()
  gender!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5)
  bloodGroup?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cnic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiProperty()
  @IsUUID('4')
  programId!: string;

  @ApiProperty()
  @IsUUID('4')
  batchId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  currentSemesterId?: string;

  @ApiPropertyOptional({ enum: StudentStatus })
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @ApiPropertyOptional({ enum: StudentEnrollmentStatus })
  @IsOptional()
  @IsEnum(StudentEnrollmentStatus)
  enrollmentStatus?: StudentEnrollmentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  enrolledAt?: string;

  @ApiPropertyOptional({ description: 'Override admission number (auto-generated otherwise)' })
  @IsOptional()
  @IsString()
  admissionNumber?: string;

  @ApiPropertyOptional({ type: () => CreateUserForStudentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateUserForStudentDto)
  createUser?: CreateUserForStudentDto;
}

export class UpdateStudentDto extends PartialType(
  OmitType(CreateStudentDto, ['createUser'] as const),
) {}

export class TransitionStudentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  toBatchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  toSemesterId?: string;

  @ApiProperty({ enum: EnrollmentSemesterStatus })
  @IsEnum(EnrollmentSemesterStatus)
  currentSemesterStatus!: EnrollmentSemesterStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional({ enum: StudentEnrollmentStatus })
  @IsOptional()
  @IsEnum(StudentEnrollmentStatus)
  newEnrollmentStatus?: StudentEnrollmentStatus;
}

export class PromoteStudentToUserDto {
  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}

// ---------------------------------------------------------------------------
// Guardian
// ---------------------------------------------------------------------------

export class CreateGuardianDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(50)
  lastName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cnic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photoUrl?: string;
}

export class UpdateGuardianDto extends PartialType(CreateGuardianDto) {}

export class LinkGuardianDto {
  @ApiPropertyOptional({ description: 'Existing guardian id; provide either this or full guardian fields' })
  @IsOptional()
  @IsUUID('4')
  guardianId?: string;

  @ApiProperty({ enum: GuardianRelation })
  @IsEnum(GuardianRelation)
  relation!: GuardianRelation;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  // Inline guardian creation fields (used if guardianId is not provided)
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
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cnic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;
}

export class UpdateLinkGuardianDto {
  @ApiPropertyOptional({ enum: GuardianRelation })
  @IsOptional()
  @IsEnum(GuardianRelation)
  relation?: GuardianRelation;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

// ---------------------------------------------------------------------------
// Listing
// ---------------------------------------------------------------------------

export class ListStudentsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  programId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  batchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  currentSemesterId?: string;

  @ApiPropertyOptional({ enum: StudentStatus })
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @ApiPropertyOptional({ enum: StudentEnrollmentStatus })
  @IsOptional()
  @IsEnum(StudentEnrollmentStatus)
  enrollmentStatus?: StudentEnrollmentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  pageSize?: number;
}
