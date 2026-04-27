import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Computer Science' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'CS' })
  @IsString()
  @IsNotEmpty()
  code!: string;

   @ApiProperty({ example: '21' })
  @IsString()
  @IsNotEmpty()
  academicFacultyId!: string
}

export class CreateProgramDto {
  @ApiProperty({ example: 'BS Computer Science' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'BSCS' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'department-uuid' })
  @IsString()
  @IsNotEmpty()
  departmentId!: string;
}

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
  @IsString()
  @IsNotEmpty()
  departmentId!: string;
}

export class CreateSemesterDto {
  @ApiProperty({ example: 'Fall 2026' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '2026-08-15' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-12-20' })
  @IsDateString()
  endDate!: string;
}

export class CreateSectionDto {
  @ApiProperty({ example: 'A' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'course-uuid' })
  @IsString()
  @IsNotEmpty()
  courseId!: string;

  @ApiProperty({ example: 'faculty-profile-uuid' })
  @IsString()
  @IsNotEmpty()
  facultyId!: string;

  @ApiProperty({ example: 'semester-uuid' })
  @IsString()
  @IsNotEmpty()
  semesterId!: string;

  @ApiPropertyOptional({ example: 40, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxSeats?: number;
}
