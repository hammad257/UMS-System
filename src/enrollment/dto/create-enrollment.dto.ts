import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEnrollmentDto {
  @ApiProperty({ example: 'section-uuid' })
  @IsString()
  @IsNotEmpty()
  sectionId!: string;
}