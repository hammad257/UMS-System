import { IsEnum, IsNotEmpty, IsUUID, IsDateString, IsOptional, IsString } from 'class-validator';
import { AttendanceStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MarkAttendanceDto {
  @ApiProperty({
    example: 'a1b2c3d4-uuid',
    description: 'Enrollment ID of the student in a section',
  })
  @IsUUID()
  enrollmentId!: string;

  @ApiProperty({
    example: '2026-04-23',
    description: 'Attendance date (ISO format)',
  })
  @IsDateString()
  date!: string;

  @ApiProperty({
    enum: AttendanceStatus,
    example: AttendanceStatus.PRESENT,
    description: 'Attendance status',
  })
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @ApiPropertyOptional({
    example: 'Late due to traffic',
    description: 'Optional remarks',
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}