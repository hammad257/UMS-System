import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class UpdateUserScopeDto {
  @ApiProperty({ type: [String], description: 'Empty = unrestricted.' })
  @IsArray()
  @IsUUID('4', { each: true })
  campusIds!: string[];

  @ApiProperty({ type: [String], description: 'Empty = unrestricted.' })
  @IsArray()
  @IsUUID('4', { each: true })
  departmentIds!: string[];
}
