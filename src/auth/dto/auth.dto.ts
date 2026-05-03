import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsIn,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// -----------------------------------------------------------------------------
// Module 1 — Login + Refresh DTOs
// -----------------------------------------------------------------------------

export class LoginDto {
  @ApiProperty({ example: 'admin@uni.edu' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  email!: string;

  @ApiProperty({ example: 'ChangeMe!2026' })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class LogoutDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

// -----------------------------------------------------------------------------
// Optional self-service register (kept for current frontend compatibility)
// In the target architecture (Module 2), users are created via POST /users by
// an admin. We keep this endpoint as a thin wrapper that creates a User row
// (and an optional Student/Faculty profile) in PENDING state.
// -----------------------------------------------------------------------------

export class RegisterUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Maria' })
  @IsString()
  @MaxLength(50)
  firstName!: string;

  @ApiProperty({ example: 'Khan' })
  @IsString()
  @MaxLength(50)
  lastName!: string;

  @ApiPropertyOptional({ example: 'STUDENT', enum: ['STUDENT', 'FACULTY'] })
  @IsOptional()
  @IsIn(['STUDENT', 'FACULTY'])
  type?: 'STUDENT' | 'FACULTY';

  // STUDENT-only
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  regNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batch?: string;

  // FACULTY-only
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  empId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({
    description: 'Optional list of role codes (e.g. ["STUDENT"]).',
    example: ['STUDENT'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  roleCodes?: string[];
}
