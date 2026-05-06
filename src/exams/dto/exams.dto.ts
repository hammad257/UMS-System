import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { EntityStatus, ExamStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// ExamType
// ---------------------------------------------------------------------------

export class CreateExamTypeDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  name!: string;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  weight!: number;

  @ApiPropertyOptional({ enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;
}

export class UpdateExamTypeDto extends PartialType(CreateExamTypeDto) {}

// ---------------------------------------------------------------------------
// Exam
// ---------------------------------------------------------------------------

export class CreateExamDto {
  @ApiProperty()
  @IsUUID('4')
  offeringId!: string;

  @ApiProperty()
  @IsUUID('4')
  examTypeId!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty()
  @IsDateString()
  date!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  totalMarks!: number;

  @ApiPropertyOptional({ enum: ExamStatus })
  @IsOptional()
  @IsEnum(ExamStatus)
  status?: ExamStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateExamDto extends PartialType(CreateExamDto) {}

// ---------------------------------------------------------------------------
// Marks (bulk)
// ---------------------------------------------------------------------------

export class MarkEntryDto {
  @ApiProperty()
  @IsUUID('4')
  studentId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  obtained!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}

export class MarkExamDto {
  @ApiProperty({ type: [MarkEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MarkEntryDto)
  marks!: MarkEntryDto[];

  @ApiPropertyOptional({ enum: ExamStatus })
  @IsOptional()
  @IsEnum(ExamStatus)
  newExamStatus?: ExamStatus;
}

export class UpdateMarkDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  obtained?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

// ---------------------------------------------------------------------------
// Grading scheme
// ---------------------------------------------------------------------------

export class CreateGradingTierDto {
  @ApiProperty()
  @IsString()
  @MaxLength(5)
  letter!: string;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  min!: number;

  @ApiProperty({ minimum: 0, maximum: 4 })
  @IsNumber()
  @Min(0)
  @Max(4)
  gpa!: number;
}

export class CreateGradingSchemeDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [CreateGradingTierDto] })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateGradingTierDto)
  tiers!: CreateGradingTierDto[];
}

export class UpdateGradingSchemeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [CreateGradingTierDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateGradingTierDto)
  tiers?: CreateGradingTierDto[];
}

export class SetActiveSchemeDto {
  @ApiProperty()
  @IsUUID('4')
  schemeId!: string;
}
