import { Body, Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { AcademicFacultyService } from './faculty.service';
import { CreateAcademicFacultyDto } from './dto/create-faculty.dto';
import { UpdateAcademicFacultyDto } from './dto/update-faculty.dto';
import { JwtAuthGuard } from '../common/guards/Jwt auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/permissions.decorator';
import { ModuleName } from '../common/guards/permissions.module.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Academic Faculty')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('academic-faculty')
export class AcademicFacultyController {
  constructor(private readonly service: AcademicFacultyService) {}

  @Post()
  // @ModuleName('Academic')
  // @Permissions('academicFaculty.create')
  create(@Body() dto: CreateAcademicFacultyDto) {
    return this.service.create(dto);
  }

  @Get()
  // @ModuleName('Academic')
  // @Permissions('academicFaculty.view')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  // @Permissions('academicFaculty.view')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}