import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { JwtAuthGuard } from '../common/guards/Jwt auth.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ModuleName } from 'src/common/guards/permissions.module.decorator';
import { Permissions } from 'src/common/guards/permissions.decorator';
import { RolesGuard } from 'src/common/guards/roles.gaurds';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { CurrentUser } from 'src/common/guards/roles.decorator';

@Controller('enrollments')
@ApiTags('Enrollment')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) { }

  // ─── CREATE ────────────────────────────────────────────────────────────────
  // @UseGuards(JwtAuthGuard)
  // @Post()
  // @ModuleName('Enrollment')
  // @Permissions("enrollment.create")
  // @ApiBearerAuth('access-token')
  // @ApiOperation({ summary: 'Enroll student into section (Admin)' })
  // @ApiBody({ type: CreateEnrollmentDto })
  // @HttpCode(HttpStatus.CREATED)
  // create(@Body() dto: CreateEnrollmentDto) {
  //   return this.enrollmentService.create(dto);
  // }

  @Post('enroll')
@ModuleName('Enrollment')
@Permissions("enrollment.create")
@ApiOperation({ summary: 'Student self enroll into section' })
create(
  @Body() dto: CreateEnrollmentDto,
  @CurrentUser() user: { id: string }
) {
  return this.enrollmentService.enrollSelf(user.id, dto.sectionId);
}


  // ─── GET ALL ───────────────────────────────────────────────────────────────
  // @UseGuards(JwtAuthGuard)
  @Get()
  @ModuleName('Enrollment')
  @Permissions("enrollment.read_all")
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all enrollments (Admin)' })
  findAll() {
    return this.enrollmentService.findAll();
  }

  // ─── STUDENT ENROLLMENTS ───────────────────────────────────────────────────
  // @UseGuards(JwtAuthGuard)
  @Get('student/:studentId')
  @ModuleName('Enrollment')
  @Permissions("enrollment.read_student")
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get student enrollments' })
  findByStudent(@Param('studentId') studentId: string) {
    return this.enrollmentService.findByStudent(studentId);
  }

  // ─── SECTION STUDENTS ──────────────────────────────────────────────────────
  // @UseGuards(JwtAuthGuard)
  @Get('section/:sectionId')
  @ModuleName('Enrollment')
  @Permissions("enrollment.read_section")
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get students in a section (Faculty)' })
  findBySection(@Param('sectionId') sectionId: string) {
    return this.enrollmentService.findBySection(sectionId);
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────
  // @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ModuleName('Enrollment')
  @Permissions("enrollment.update")
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update enrollment status' })
  update(@Param('id') id: string, @Body() dto: UpdateEnrollmentDto) {
    return this.enrollmentService.update(id, dto);
  }

  // ─── DELETE ────────────────────────────────────────────────────────────────
  // @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ModuleName('Enrollment')

  @Permissions("enrollment.delete")
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete enrollment (Admin)' })
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.enrollmentService.remove(id);
  }
}