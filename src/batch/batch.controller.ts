import { Body, Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { BatchService } from './batch.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { JwtAuthGuard } from '../common/guards/Jwt auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/permissions.decorator';
import { ModuleName } from '../common/guards/permissions.module.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Batch')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('batches')
export class BatchController {
  constructor(private readonly service: BatchService) {}

  @Post()
  @ModuleName('Academic')
  @Permissions('batch.create')
  create(@Body() dto: CreateBatchDto) {
    return this.service.create(dto);
  }

  @Get()
  @ModuleName('Academic')
  @Permissions('batch.view')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Permissions('batch.view')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}