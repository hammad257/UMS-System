import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  AssignmentRole,
  ClassroomStatus,
  ClassroomType,
  CourseType,
  Day,
  EntityStatus,
  OfferingStatus,
} from '@prisma/client';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// ---------------------------------------------------------------------------
// Course (Module 5 — additive on existing Course model)
// ---------------------------------------------------------------------------

export class CreateCourseDto {
  @ApiProperty()
  @IsString()
  @MaxLength(20)
  code!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty()
  @IsUUID('4')
  departmentId!: string;

  @ApiProperty({ minimum: 1, maximum: 6 })
  @IsInt()
  @Min(1)
  @Max(6)
  creditHours!: number;

  @ApiPropertyOptional({ enum: CourseType })
  @IsOptional()
  @IsEnum(CourseType)
  type?: CourseType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;
}

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}

// ---------------------------------------------------------------------------
// Classroom
// ---------------------------------------------------------------------------

export class CreateClassroomDto {
  @ApiProperty()
  @IsString()
  @MaxLength(20)
  code!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ minimum: 1, maximum: 1000 })
  @IsInt()
  @Min(1)
  @Max(1000)
  capacity!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  building?: string;

  @ApiProperty({ enum: ClassroomType })
  @IsEnum(ClassroomType)
  type!: ClassroomType;

  @ApiPropertyOptional({ enum: ClassroomStatus })
  @IsOptional()
  @IsEnum(ClassroomStatus)
  status?: ClassroomStatus;
}

export class UpdateClassroomDto extends PartialType(CreateClassroomDto) {}

// ---------------------------------------------------------------------------
// Offering
// ---------------------------------------------------------------------------

export class CreateOfferingDto {
  @ApiProperty()
  @IsUUID('4')
  courseId!: string;

  @ApiProperty()
  @IsUUID('4')
  semesterId!: string;

  @ApiProperty()
  @IsUUID('4')
  batchId!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(5)
  section!: string;

  @ApiProperty({ minimum: 1, maximum: 500 })
  @IsInt()
  @Min(1)
  @Max(500)
  capacity!: number;

  @ApiPropertyOptional({ enum: OfferingStatus })
  @IsOptional()
  @IsEnum(OfferingStatus)
  status?: OfferingStatus;
}

export class UpdateOfferingDto extends PartialType(CreateOfferingDto) {}

// ---------------------------------------------------------------------------
// CourseAssignment
// ---------------------------------------------------------------------------

export class CreateCourseAssignmentDto {
  @ApiProperty()
  @IsUUID('4')
  teacherId!: string;

  @ApiPropertyOptional({ enum: AssignmentRole })
  @IsOptional()
  @IsEnum(AssignmentRole)
  role?: AssignmentRole;
}

// ---------------------------------------------------------------------------
// TimetableSlot
// ---------------------------------------------------------------------------

export class CreateTimetableSlotDto {
  @ApiProperty()
  @IsUUID('4')
  offeringId!: string;

  @ApiProperty()
  @IsUUID('4')
  teacherId!: string;

  @ApiProperty()
  @IsUUID('4')
  roomId!: string;

  @ApiProperty({ enum: Day })
  @IsEnum(Day)
  day!: Day;

  @ApiProperty({ example: '09:00' })
  @Matches(TIME_REGEX, { message: 'startTime must be HH:mm' })
  startTime!: string;

  @ApiProperty({ example: '10:30' })
  @Matches(TIME_REGEX, { message: 'endTime must be HH:mm' })
  endTime!: string;
}

export class UpdateTimetableSlotDto extends PartialType(CreateTimetableSlotDto) {}

export class BulkCreateTimetableSlotsDto {
  @ApiProperty({ type: [CreateTimetableSlotDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTimetableSlotDto)
  slots!: CreateTimetableSlotDto[];
}

export class ConflictCheckQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  teacherId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  roomId?: string;

  @ApiProperty({ enum: Day })
  @IsEnum(Day)
  day!: Day;

  @ApiProperty()
  @Matches(TIME_REGEX)
  startTime!: string;

  @ApiProperty()
  @Matches(TIME_REGEX)
  endTime!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  excludeSlotId?: string;
}
