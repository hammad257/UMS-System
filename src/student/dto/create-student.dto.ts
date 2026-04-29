import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddGuardianDto {
  @ApiProperty({ example: '123' })
  @IsString()
  @IsNotEmpty()
  guardianId!: string;

  @ApiPropertyOptional({ example: 'Father' })
  @IsString()
  @IsOptional()
  relation?: string;
}