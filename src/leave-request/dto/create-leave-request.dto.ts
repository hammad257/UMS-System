import { IsEnum, IsString, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LeaveType } from '@prisma/client';

export class CreateLeaveDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ enum: LeaveType, example: LeaveType.MEDICAL })
  @IsEnum(LeaveType)
  type!: LeaveType;

  @ApiProperty({ example: 'Fever and doctor advised rest' })
  @IsString()
  reason!: string;

  @ApiProperty({ example: '2026-04-25' })
  @IsDateString()
  fromDate!: string;

  @ApiProperty({ example: '2026-04-28' })
  @IsDateString()
  toDate!: string;
}