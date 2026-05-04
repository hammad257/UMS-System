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
import { CampusService } from './campus.service';
import { CreateCampusDto } from './dto/create-campus.dto';
import { UpdateCampusDto } from './dto/update-campus.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/guards/roles.decorator';
import { Permissions } from '../common/guards/permissions.decorator';
import { ModuleName } from '../common/guards/permissions.module.decorator';
import { Role } from '../common/types';

@ApiTags('Academic — Campus')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('campuses')
export class CampusController {
  constructor(private readonly campusService: CampusService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ModuleName('Academic')
  @Permissions('academic.campus.create')
  create(@Body() dto: CreateCampusDto) {
    return this.campusService.create(dto);
  }

  @Get()
  @ModuleName('Academic')
  @Permissions('academic.campus.read')
  findAll() {
    return this.campusService.findAll();
  }

  @Get(':id')
  @ModuleName('Academic')
  @Permissions('academic.campus.read')
  findOne(@Param('id') id: string) {
    return this.campusService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ModuleName('Academic')
  @Permissions('academic.campus.update')
  update(@Param('id') id: string, @Body() dto: UpdateCampusDto) {
    return this.campusService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ModuleName('Academic')
  @Permissions('academic.campus.delete')
  remove(@Param('id') id: string) {
    return this.campusService.remove(id);
  }
}
