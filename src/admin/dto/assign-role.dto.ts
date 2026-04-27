import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({
    example: 'clx123roleId',
    description: 'Role ID from database',
  })  
  @IsArray()
  @IsString({ each: true })
  roleIds!: string[];
}