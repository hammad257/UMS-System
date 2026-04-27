import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UpdateAcademicFacultyDto {
    @ApiProperty({ example: 'BS Faculty' })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({ example: '091' })
    @IsString()
    @IsNotEmpty()
    code!: string;

    @ApiProperty({ example: '12091' })
    @IsString()
    @IsNotEmpty()
    campusId!: string;
}