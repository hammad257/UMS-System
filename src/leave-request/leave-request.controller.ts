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

import { LeaveRequestService } from './leave-request.service';
import { CreateLeaveDto } from './dto/create-leave-request.dto';

import { JwtAuthGuard } from '../common/guards/Jwt auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { Roles } from '../common/guards/roles.decorator';

import { Role } from '../common/types';

import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { LeaveStatus } from '@prisma/client';
import { UpdateLeaveStatusDto } from './dto/update-leave-request.dto';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { ModuleName } from 'src/common/guards/permissions.module.decorator';
import { Permissions } from 'src/common/guards/permissions.decorator';

@Controller('leave')
@ApiTags('Leave Requests')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class LeaveRequestController {
  constructor(private readonly service: LeaveRequestService) {}

  // Create request (Student/Faculty)
  // @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create leave request' })
  create(@Body() dto: CreateLeaveDto) {
    return this.service.create(dto);
  }

  // Admin - all requests
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  // User - own requests
  // @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.service.findByUser(userId);
  }

  // Approve / Reject (Admin only)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ADMIN)
  @Patch(':id/status')
  @ModuleName('LeaveRequest')
    @Permissions("leave-request.update")
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateLeaveStatusDto,
  ) {
    return this.service.updateStatus(id, body.status, body.remarks, body.adminId);
  }

  // Delete
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}