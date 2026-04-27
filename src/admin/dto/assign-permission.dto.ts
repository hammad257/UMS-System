import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class AssignPermissionDto {
     @ApiProperty({
    example: 'clx456permissionId',
    description: 'Permission ID from database',
  })
  @IsArray()
  @IsString({ each: true })
  permissionIds!: string[];
}