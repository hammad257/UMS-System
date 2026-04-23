import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from "class-transformer";
import { LeaveStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLeaveStatusDto {
  @ApiProperty({ enum: LeaveStatus })
  @Transform(({ value }) => value?.toUpperCase())
  @IsEnum(LeaveStatus)
  status!: LeaveStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminId?: string;
}