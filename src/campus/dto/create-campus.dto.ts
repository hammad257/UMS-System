import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateCampusDto {
    @ApiProperty({ example: 'Cant' })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({ example: '01' })
    @IsString()
    @IsNotEmpty()
    code!: string;

    @ApiProperty({ example: 'Link Road' })
    @IsString()
    @IsNotEmpty()
    address?: string;

    @ApiProperty({ example: 'Lahore' })
    @IsString()
    @IsNotEmpty()
    city?: string;
}