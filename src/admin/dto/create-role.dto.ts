import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateRoleDto {
   @ApiProperty({
    example: 'HR',
    description: 'Role name (must be unique)',
  })  
  @IsString()
  @IsNotEmpty()
  name!: string;

   @ApiProperty({
    example: 'Hnalde Human Resources related tasks',
    description: 'Hnalde Human Resources',
  })
  @IsString()
  description?: string;
}