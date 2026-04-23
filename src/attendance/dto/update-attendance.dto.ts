import { IsEnum, IsOptional, IsUUID, IsDateString, IsString } from 'class-validator';
import { AttendanceStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAttendanceDto {
  @ApiPropertyOptional({
    example: 'a1b2c3d4-uuid',
  })
  @IsOptional()
  @IsUUID()
  enrollmentId?: string;

  @ApiPropertyOptional({
    example: '2026-04-23',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    enum: AttendanceStatus,
    example: AttendanceStatus.ABSENT,
  })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({
    example: 'Medical leave',
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}