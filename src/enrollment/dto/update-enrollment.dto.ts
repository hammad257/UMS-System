import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { EnrollmentStatus } from '@prisma/client';

export class UpdateEnrollmentDto {
  @ApiProperty({ enum: EnrollmentStatus })
  @IsEnum(EnrollmentStatus)
  status!: EnrollmentStatus;
}