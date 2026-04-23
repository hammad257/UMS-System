import { IsUUID, IsOptional, IsNumber, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGradingDto {
  @ApiProperty({ example: 'enrollment-uuid' })
  @IsUUID()
  enrollmentId!: string;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsNumber()
  assignment?: number;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @IsNumber()
  quiz?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  midterm?: number;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @IsNumber()
  finalExam?: number;

  @ApiPropertyOptional({ example: 'Good performance' })
  @IsOptional()
  @IsString()
  remarks?: string;
}