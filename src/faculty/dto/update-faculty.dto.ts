import { PartialType } from '@nestjs/swagger';
import { CreateAcademicFacultyDto } from './create-faculty.dto';

export class UpdateAcademicFacultyDto extends PartialType(
  CreateAcademicFacultyDto,
) {}
