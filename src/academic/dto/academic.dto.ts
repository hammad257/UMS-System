import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { EntityStatus, ProgramLevel } from '@prisma/client';

// -----------------------------------------------------------------------------
// Department
// -----------------------------------------------------------------------------

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Computer Science' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'CS' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code!: string;

  @ApiProperty({ example: 'academic-faculty-uuid' })
  @IsUUID('4')
  academicFacultyId!: string;

  @ApiPropertyOptional({ example: 'Dr. Ali Khan' })
  @IsOptional()
  @IsString()
  head?: string;

  @ApiPropertyOptional({ example: 'cs@uni.edu' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}

// -----------------------------------------------------------------------------
// Program
// -----------------------------------------------------------------------------

export class CreateProgramDto {
  @ApiProperty({ example: 'BS Computer Science' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'BSCS' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code!: string;

  @ApiProperty({ example: 'department-uuid' })
  @IsUUID('4')
  departmentId!: string;

  @ApiProperty({ enum: ProgramLevel, example: ProgramLevel.BS })
  @IsEnum(ProgramLevel)
  level!: ProgramLevel;

  @ApiProperty({ example: 4, minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  durationYears!: number;

  @ApiProperty({ example: 132, minimum: 1 })
  @IsInt()
  @Min(1)
  totalCredits!: number;

  @ApiPropertyOptional({ enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;
}

export class UpdateProgramDto extends PartialType(CreateProgramDto) {}

// -----------------------------------------------------------------------------
// Course (curriculum unit)
// -----------------------------------------------------------------------------

export class CreateCourseDto {
  @ApiProperty({ example: 'Database Systems' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'CS-301' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 3, minimum: 1, maximum: 6 })
  @IsInt()
  @Min(1)
  @Max(6)
  creditHours!: number;

  @ApiProperty({ example: 'department-uuid' })
  @IsUUID('4')
  departmentId!: string;
}

// -----------------------------------------------------------------------------
// AcademicSession (calendar root)
// -----------------------------------------------------------------------------

export class CreateAcademicSessionDto {
  @ApiProperty({ example: 'F-24' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code!: string;

  @ApiProperty({ example: 'Fall 2024' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: '2024-08-15' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2024-12-20' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({ enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;
}

export class UpdateAcademicSessionDto extends PartialType(
  CreateAcademicSessionDto,
) {}

// -----------------------------------------------------------------------------
// Semester (lives inside an AcademicSession)
// -----------------------------------------------------------------------------

export class CreateSemesterDto {
  @ApiProperty({ example: 'Semester 1' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'session-uuid' })
  @IsUUID('4')
  sessionId!: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  sequence!: number;

  @ApiProperty({ example: '2024-08-15' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2024-12-20' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({ enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;
}

export class UpdateSemesterDto extends PartialType(CreateSemesterDto) {}

// -----------------------------------------------------------------------------
// Section
// -----------------------------------------------------------------------------

export class CreateSectionDto {
  @ApiProperty({ example: 'A' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'course-uuid' })
  @IsUUID('4')
  courseId!: string;

  @ApiProperty({ example: 'faculty-profile-uuid' })
  @IsUUID('4')
  facultyId!: string;

  @ApiProperty({ example: 'semester-uuid' })
  @IsUUID('4')
  semesterId!: string;

  @ApiPropertyOptional({ example: 40, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxSeats?: number;
}

// -----------------------------------------------------------------------------
// Curriculum joins
// -----------------------------------------------------------------------------

export class CreateProgramCourseDto {
  @ApiProperty({ example: 'program-uuid' })
  @IsUUID('4')
  programId!: string;

  @ApiProperty({ example: 'course-uuid' })
  @IsUUID('4')
  courseId!: string;
}

export class CreateSemesterCourseDto {
  @ApiProperty({ example: 'semester-uuid' })
  @IsUUID('4')
  semesterId!: string;

  @ApiProperty({ example: 'course-uuid' })
  @IsUUID('4')
  courseId!: string;

  @ApiProperty({ example: 'program-uuid' })
  @IsUUID('4')
  programId!: string;
}

// -----------------------------------------------------------------------------
// Bulk-initialize an academic session (Module 3 §Bulk-create endpoint)
// -----------------------------------------------------------------------------

class SemesterSeedDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  sequence!: number;

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty()
  @IsDateString()
  endDate!: string;
}

class BatchSeedDto {
  @ApiProperty()
  @IsUUID('4')
  programId!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsInt()
  startYear!: number;

  @ApiProperty()
  @IsInt()
  endYear!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  intake?: number;
}

export class InitializeSessionDto {
  @ApiProperty({ type: [SemesterSeedDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SemesterSeedDto)
  semesters!: SemesterSeedDto[];

  @ApiProperty({ type: [BatchSeedDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchSeedDto)
  batches!: BatchSeedDto[];
}
