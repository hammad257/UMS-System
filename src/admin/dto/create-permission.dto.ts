import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreatePermissionDto {
   @ApiProperty({
    example: 'user.create',
    description: 'Permission key used in RBAC checks',
  })  
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'Create new users in the system',
    description: 'Human readable description',
  })
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'Academic',
    description: 'Module name like Academic, Enrollment, UserManagement',
  })
  @IsString()
  @IsNotEmpty()
  module!: string;
}