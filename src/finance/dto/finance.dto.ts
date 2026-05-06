import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { EntityStatus, FeeType, PaymentMethod } from '@prisma/client';

// ---------------------------------------------------------------------------
// Fee structure
// ---------------------------------------------------------------------------

export class CreateFeeItemDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ enum: FeeType })
  @IsEnum(FeeType)
  type!: FeeType;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  oneTime?: boolean;
}

export class CreateFeeStructureDto {
  @ApiProperty()
  @IsUUID('4')
  programId!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ minimum: 2000, maximum: 2100 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  appliesFromYear!: number;

  @ApiPropertyOptional({ enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;

  @ApiProperty({ type: [CreateFeeItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFeeItemDto)
  items!: CreateFeeItemDto[];
}

export class UpdateFeeStructureDto extends PartialType(CreateFeeStructureDto) {}

// ---------------------------------------------------------------------------
// Invoice
// ---------------------------------------------------------------------------

export class CreateInvoiceItemDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ enum: FeeType })
  @IsEnum(FeeType)
  type!: FeeType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateInvoiceDto {
  @ApiProperty()
  @IsUUID('4')
  studentId!: string;

  @ApiProperty()
  @IsUUID('4')
  semesterId!: string;

  @ApiProperty()
  @IsDateString()
  issueDate!: string;

  @ApiProperty()
  @IsDateString()
  dueDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateInvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items!: CreateInvoiceItemDto[];
}

export class UpdateInvoiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class GenerateInvoiceDto {
  @ApiProperty()
  @IsUUID('4')
  studentId!: string;

  @ApiProperty()
  @IsUUID('4')
  semesterId!: string;

  @ApiProperty()
  @IsDateString()
  issueDate!: string;

  @ApiProperty()
  @IsDateString()
  dueDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeOneTimeItems?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  excludeItemIds?: string[];
}

export class BulkGenerateInvoicesDto {
  @ApiProperty()
  @IsUUID('4')
  batchId!: string;

  @ApiProperty()
  @IsUUID('4')
  semesterId!: string;

  @ApiProperty()
  @IsDateString()
  issueDate!: string;

  @ApiProperty()
  @IsDateString()
  dueDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeOneTimeItems?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  skipExisting?: boolean;
}

export class CancelInvoiceDto {
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  reason!: string;
}

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------

export class CreatePaymentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  invoiceId?: string;

  @ApiProperty()
  @IsNumber()
  amount!: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty()
  @IsDateString()
  paidAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePaymentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  paidAt?: string;
}
