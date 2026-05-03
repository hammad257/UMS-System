import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    example: 'students.student.create',
    description:
      'Permission code in lower-case dotted format: <module>.<resource>.<action>.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Matches(/^[a-z][a-z0-9-]*(\.[a-z0-9-]+){2}$/, {
    message: 'code must be in <module>.<resource>.<action> form',
  })
  code!: string;

  @ApiProperty({ example: 'Students' })
  @IsString()
  @IsNotEmpty()
  module!: string;

  @ApiProperty({ example: 'student' })
  @IsString()
  @IsNotEmpty()
  resource!: string;

  @ApiProperty({ example: 'create' })
  @IsString()
  @IsNotEmpty()
  action!: string;

  @ApiPropertyOptional({ example: 'Create new student records.' })
  @IsOptional()
  @IsString()
  description?: string;
}
