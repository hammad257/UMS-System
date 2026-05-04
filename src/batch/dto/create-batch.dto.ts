import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { EntityStatus } from '@prisma/client';

export class CreateBatchDto {
  @ApiProperty({ example: 'BSCS Fall 2024' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'program-uuid' })
  @IsUUID('4')
  programId!: string;

  @ApiProperty({ example: 'session-uuid' })
  @IsUUID('4')
  sessionId!: string;

  @ApiProperty({ example: 2024 })
  @IsInt()
  startYear!: number;

  @ApiProperty({ example: 2028 })
  @IsInt()
  endYear!: number;

  @ApiPropertyOptional({ example: 60, description: 'Expected enrollment count.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  intake?: number;

  @ApiPropertyOptional({ enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;
}
