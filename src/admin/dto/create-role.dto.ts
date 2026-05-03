import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    example: 'REGISTRAR',
    description: 'Unique role code in UPPER_SNAKE format.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message: 'code must be UPPER_SNAKE_CASE',
  })
  code!: string;

  @ApiProperty({ example: 'Registrar', description: 'Display name.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'Owns student records and enrollment.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'System roles cannot be deleted (only seed should set true).',
  })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;
}
