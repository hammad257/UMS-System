import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { EntityStatus } from '@prisma/client';

export class CreateAcademicFacultyDto {
  @ApiProperty({ example: 'FOC' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code!: string;

  @ApiProperty({ example: 'Faculty of Computing' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'campus-uuid' })
  @IsUUID('4')
  campusId!: string;

  @ApiPropertyOptional({ example: 'Dr. Ahmed' })
  @IsOptional()
  @IsString()
  dean?: string;

  @ApiPropertyOptional({ example: 'foc@uni.edu' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;
}
