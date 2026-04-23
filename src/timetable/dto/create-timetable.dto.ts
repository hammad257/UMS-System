import { IsEnum, IsUUID, IsDateString, IsOptional, IsString } from 'class-validator';
import { WeekDay } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTimetableDto {
  @ApiProperty({ example: 'section-uuid' })
  @IsUUID()
  sectionId!: string;

  @ApiProperty({ enum: WeekDay, example: WeekDay.MONDAY })
  @IsEnum(WeekDay)
  day!: WeekDay;

  @ApiProperty({ example: '2026-04-23T09:00:00Z' })
  @IsDateString()
  startTime!: string;

  @ApiProperty({ example: '2026-04-23T10:30:00Z' })
  @IsDateString()
  endTime!: string;

  @ApiPropertyOptional({ example: 'Room A-101' })
  @IsOptional()
  @IsString()
  room?: string;
}