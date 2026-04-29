import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdmissionService } from './admission.service';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/guards/roles.decorator';
import { CreateAdmissionRequestDto } from './dto/create-admission.dto';
import { JwtAuthGuard } from 'src/common/guards/Jwt auth.guard';
import { RolesGuard } from 'src/common/guards/roles.gaurds';
import { Role } from 'src/generated/prisma/enums';

@Controller('admission')
@ApiTags('Admission')
export class AdmissionController {
  constructor(private readonly service: AdmissionService) {}

  // Student apply (PUBLIC)
  @Post('apply')
  apply(@Body() dto: CreateAdmissionRequestDto) {
    return this.service.apply(dto);
  }

  // Admin view all requests
  @Get('requests')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ADMIN)
  getAll() {
    return this.service.getAll();
  }

  // Approve request
  @Patch(':id/approve')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ADMIN)
  approve(@Param('id') id: string) {
    return this.service.approve(id);
  }

  // Reject request
  @Patch(':id/reject')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ADMIN)
  reject(@Param('id') id: string) {
    return this.service.reject(id);
  }
}