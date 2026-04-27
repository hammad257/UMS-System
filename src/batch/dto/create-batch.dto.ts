import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsInt } from "class-validator";

export class CreateBatchDto {
  @ApiProperty({ example: 'BSCS-2023' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 2023 })
  @IsInt()
  startYear!: number;   // ✅ FIXED

  @ApiProperty({ example: 2027, required: false })
  @IsInt()
  endYear?: number;

  @ApiProperty({ example: 'program-id' })
  @IsString()
  @IsNotEmpty()
  programId!: string;
}