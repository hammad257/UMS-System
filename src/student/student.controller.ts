import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { StudentService } from './student.service';
import { AddGuardianDto } from './dto/create-student.dto';
import { ApiBody, ApiOperation } from '@nestjs/swagger';

@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) { }

  @Post(':studentId/guardians')
@ApiOperation({ summary: 'Add guardian' })
@ApiBody({ type: AddGuardianDto })
addGuardian(
  @Param('studentId') studentId: string,
  @Body() dto: AddGuardianDto,
) {
  return this.studentService.addGuardian(studentId, dto);
}
}
