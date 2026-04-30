import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGuardianDto {
  @ApiProperty({ example: 'Ali' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Khan' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: '+92 300 1234567' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiPropertyOptional({ example: 'ali.khan@gmail.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '35202-1234567-1' })
  @IsString()
  @IsNotEmpty()
  cnic!: string;

  @ApiPropertyOptional({ example: 'Businessman' })
  @IsString()
  @IsOptional()
  occupation?: string;

  @ApiPropertyOptional({ example: 'Lahore, Pakistan' })
  @IsString()
  @IsOptional()
  address?: string;
}