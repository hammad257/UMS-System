import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { AttendanceStatus, SessionStatus } from '@prisma/client';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateAttendanceSessionDto {
  @ApiProperty()
  @IsUUID('4')
  offeringId!: string;

  @ApiProperty({ example: '2026-04-29' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: '09:00' })
  @Matches(TIME_REGEX)
  startTime!: string;

  @ApiProperty({ example: '10:30' })
  @Matches(TIME_REGEX)
  endTime!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  topic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: SessionStatus })
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;
}

export class UpdateAttendanceSessionDto extends PartialType(
  CreateAttendanceSessionDto,
) {}

export class RecordEntryDto {
  @ApiProperty()
  @IsUUID('4')
  studentId!: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class MarkAttendanceDto {
  @ApiProperty({ type: [RecordEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecordEntryDto)
  records!: RecordEntryDto[];

  @ApiPropertyOptional({ enum: SessionStatus })
  @IsOptional()
  @IsEnum(SessionStatus)
  newSessionStatus?: SessionStatus;
}

export class UpdateAttendanceRecordDto {
  @ApiPropertyOptional({ enum: AttendanceStatus })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class GenerateSessionsDto {
  @ApiProperty()
  @IsUUID('4')
  offeringId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  skipExisting?: boolean;
}
