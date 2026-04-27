import { Module } from '@nestjs/common';
import { AcademicFacultyService } from './faculty.service';
import { AcademicFacultyController } from './faculty.controller';

@Module({
  controllers: [AcademicFacultyController],
  providers: [AcademicFacultyService],
})
export class AcademicFacultyModule {}
