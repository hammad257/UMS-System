import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CampusService } from './campus.service';
import { CreateCampusDto } from './dto/create-campus.dto';
import { JwtAuthGuard } from '../common/guards/Jwt auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/permissions.decorator';
import { ModuleName } from '../common/guards/permissions.module.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Campus')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('campus')
export class CampusController {
  constructor(private readonly campusService: CampusService) {}

  @Post()
  // @ModuleName('Academic')
  // @Permissions('campus.create')
  create(@Body() dto: CreateCampusDto) {
    return this.campusService.create(dto);
  }

  @Get()
  // @ModuleName('Academic')
  // @Permissions('campus.view')
  findAll() {
    return this.campusService.findAll();
  }
}