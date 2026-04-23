import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';

import { TimetableService } from './timetable.service';
import { CreateTimetableDto } from './dto/create-timetable.dto';
import { UpdateTimetableDto } from './dto/update-timetable.dto';

import { JwtAuthGuard } from '../common/guards/Jwt auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { Roles } from '../common/guards/roles.decorator';

import { Role } from '../common/types';

import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@Controller('timetable')
@ApiTags('Timetable')
export class TimetableController {
  constructor(private readonly service: TimetableService) {}

  // Admin/Faculty create schedule
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.FACULTY)
  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create timetable slot' })
  create(@Body() dto: CreateTimetableDto) {
    return this.service.create(dto);
  }

  // All users view
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth('access-token')
  findAll() {
    return this.service.findAll();
  }

  // Section-wise
  @UseGuards(JwtAuthGuard)
  @Get('section/:id')
  findBySection(@Param('id') id: string) {
    return this.service.findBySection(id);
  }

  // Update
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.FACULTY)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTimetableDto) {
    return this.service.update(id, dto);
  }

  // Delete
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}