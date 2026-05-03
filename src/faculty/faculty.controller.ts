import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AcademicFacultyService } from './faculty.service';
import { CreateAcademicFacultyDto } from './dto/create-faculty.dto';
import { UpdateAcademicFacultyDto } from './dto/update-faculty.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/guards/roles.decorator';
import { Permissions } from '../common/guards/permissions.decorator';
import { ModuleName } from '../common/guards/permissions.module.decorator';
import { Role } from '../common/types';

@ApiTags('Academic — Faculty')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('academic-faculty')
export class AcademicFacultyController {
  constructor(private readonly service: AcademicFacultyService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ModuleName('Academic')
  @Permissions('academic.faculty.create')
  create(@Body() dto: CreateAcademicFacultyDto) {
    return this.service.create(dto);
  }

  @Get()
  @ModuleName('Academic')
  @Permissions('academic.faculty.read')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ModuleName('Academic')
  @Permissions('academic.faculty.read')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ModuleName('Academic')
  @Permissions('academic.faculty.update')
  update(@Param('id') id: string, @Body() dto: UpdateAcademicFacultyDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ModuleName('Academic')
  @Permissions('academic.faculty.delete')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
