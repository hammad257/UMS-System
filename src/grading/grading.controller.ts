import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';

import { GradingService } from './grading.service';
import { CreateGradingDto } from './dto/create-grading.dto';
import { UpdateGradingDto } from './dto/update-grading.dto';

import { JwtAuthGuard } from '../common/guards/Jwt auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { Roles } from '../common/guards/roles.decorator';

import { Role } from '../common/types';

import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { ModuleName } from 'src/common/guards/permissions.module.decorator';
import { Permissions } from 'src/common/guards/permissions.decorator';

@Controller('grading')
@ApiTags('Grading')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class GradingController {
  constructor(private readonly gradingService: GradingService) {}

  // Faculty/Admin
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.FACULTY, Role.ADMIN)
  @Post()
    @ModuleName('Grading')
    @Permissions("grading.create")
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create grading (Faculty/Admin)' })
  create(@Body() dto: CreateGradingDto) {
    return this.gradingService.create(dto);
  }

  // Student view
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.STUDENT, Role.ADMIN)
  @Get('student/:studentId')
    @ModuleName('Grading')
    @Permissions("grading.read_student")
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get student results' })
  getStudentResults(@Param('studentId') studentId: string) {
    return this.gradingService.getStudentResults(studentId);
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.FACULTY, Role.ADMIN)
  @Patch(':id')
    @ModuleName('Grading')
    @Permissions("grading.update")
  @ApiBearerAuth('access-token')
  update(@Param('id') id: string, @Body() dto: UpdateGradingDto) {
    return this.gradingService.update(id, dto);
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ADMIN)
  @Delete(':id')
    @ModuleName('Grading')
    @Permissions("grading.delete")
  @ApiBearerAuth('access-token')
  delete(@Param('id') id: string) {
    return this.gradingService.delete(id);
  }
}