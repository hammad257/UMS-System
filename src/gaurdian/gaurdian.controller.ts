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
import { GuardianService } from './gaurdian.service';
import { CreateGuardianDto } from './dto/create-gaurdian.dto';
import { UpdateGuardianDto } from './dto/update-gaurdian.dto';
import { JwtAuthGuard } from '../common/guards/Jwt auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { ModuleName } from '../common/guards/permissions.module.decorator';
import { Permissions } from '../common/guards/permissions.decorator';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/guards/roles.decorator';
import { Role } from 'src/common/types';

@Controller('guardians')
@ApiTags('Guardian')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
export class GuardianController {
  constructor(private readonly guardianService: GuardianService) {}

  // ─── CREATE ─────────────────────────────────────────────
  @Post()
 @Roles(Role.ADMIN)
  @ModuleName('Guardian')
  @Permissions('guardian.create')
  @ApiOperation({ summary: 'Create guardian' })
  @ApiBody({ type: CreateGuardianDto })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateGuardianDto) {
    return this.guardianService.create(dto);
  }
  

  // ─── GET ALL ────────────────────────────────────────────
  @Get()
  @ModuleName('Guardian')
  @Permissions('guardian.read')
  @ApiOperation({ summary: 'Get all guardians' })
  findAll() {
    return this.guardianService.findAll();
  }

  // ─── GET BY ID ──────────────────────────────────────────
  @Get(':id')
  @ModuleName('Guardian')
  @Permissions('guardian.read')
  @ApiOperation({ summary: 'Get guardian by ID' })
  findOne(@Param('id') id: string) {
    return this.guardianService.findOne(id);
  }

  // ─── UPDATE ─────────────────────────────────────────────
  @Patch(':id')
   @Roles(Role.ADMIN)
  @ModuleName('Guardian')
  @Permissions('guardian.update')
  @ApiOperation({ summary: 'Update guardian' })
  update(@Param('id') id: string, @Body() dto: UpdateGuardianDto) {
    return this.guardianService.update(id, dto);
  }

  // ─── DELETE ─────────────────────────────────────────────
  @Delete(':id')
   @Roles(Role.ADMIN)
  @ModuleName('Guardian')
  @Permissions('guardian.delete')
  @ApiOperation({ summary: 'Delete guardian' })
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.guardianService.remove(id);
  }
}