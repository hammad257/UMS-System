import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class AssignPermissionDto {
  @ApiProperty({
    type: [String],
    description: 'Full replacement set of permission IDs for the role.',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds!: string[];
}
