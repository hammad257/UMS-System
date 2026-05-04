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
import { BatchService } from './batch.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/guards/roles.decorator';
import { Permissions } from '../common/guards/permissions.decorator';
import { ModuleName } from '../common/guards/permissions.module.decorator';
import { Role } from '../common/types';

@ApiTags('Academic — Batch')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('batches')
export class BatchController {
  constructor(private readonly service: BatchService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.REGISTRAR)
  @ModuleName('Academic')
  @Permissions('academic.batch.create')
  create(@Body() dto: CreateBatchDto) {
    return this.service.create(dto);
  }

  @Get()
  @ModuleName('Academic')
  @Permissions('academic.batch.read')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ModuleName('Academic')
  @Permissions('academic.batch.read')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.REGISTRAR)
  @ModuleName('Academic')
  @Permissions('academic.batch.update')
  update(@Param('id') id: string, @Body() dto: UpdateBatchDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ModuleName('Academic')
  @Permissions('academic.batch.delete')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
