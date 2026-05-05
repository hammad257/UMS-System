import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  EmployeeRole,
  EmployeeStatus,
  EmployeeType,
  EmploymentType,
  Gender,
} from '@prisma/client';

export class CreateUserForEmployeeDto {
  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ type: [String], description: 'Role IDs to assign to the new user' })
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  mustChangePassword?: boolean;
}

export class CreateEmployeeDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(50)
  lastName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nationality?: string;

  @ApiPropertyOptional({ description: 'Pakistani CNIC, formatted XXXXX-XXXXXXX-X' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{5}-\d{7}-\d{1}$/, {
    message: 'cnic must be in the format XXXXX-XXXXXXX-X',
  })
  cnic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeNumber?: string;

  @ApiProperty({ enum: EmployeeRole })
  @IsEnum(EmployeeRole)
  role!: EmployeeRole;

  @ApiProperty({ enum: EmployeeType })
  @IsEnum(EmployeeType)
  employeeType!: EmployeeType;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  designation!: string;

  @ApiProperty({ enum: EmploymentType })
  @IsEnum(EmploymentType)
  employmentType!: EmploymentType;

  @ApiProperty()
  @IsDateString()
  joiningDate!: string;

  @ApiPropertyOptional({ enum: EmployeeStatus })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  primaryDepartmentId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  departmentIds?: string[];

  @ApiPropertyOptional({ description: 'Optional photo URL' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ type: () => CreateUserForEmployeeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateUserForEmployeeDto)
  createUser?: CreateUserForEmployeeDto;
}

export class UpdateEmployeeDto extends PartialType(
  OmitType(CreateEmployeeDto, ['createUser'] as const),
) {}

export class SetEmployeeDepartmentsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  departmentIds!: string[];
}

export class PromoteEmployeeToUserDto {
  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds!: string[];
}

export class ListEmployeesQueryDto {
  @ApiPropertyOptional({ enum: EmployeeRole })
  @IsOptional()
  @IsEnum(EmployeeRole)
  role?: EmployeeRole;

  @ApiPropertyOptional({ enum: EmployeeType })
  @IsOptional()
  @IsEnum(EmployeeType)
  employeeType?: EmployeeType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  departmentId?: string;

  @ApiPropertyOptional({ enum: EmployeeStatus })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  pageSize?: number;
}
