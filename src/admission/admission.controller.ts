import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdmissionService } from './admission.service';
import { CreateAdmissionRequestDto } from './dto/create-admission.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { Roles } from '../common/guards/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Role } from '../common/types';

@Controller('admission')
@ApiTags('Admission')
export class AdmissionController {
  constructor(private readonly service: AdmissionService) {}

  // Public sign-up — anyone can apply.
  @Public()
  @Post('apply')
  @ApiOperation({ summary: 'Submit an admission request (public).' })
  apply(@Body() dto: CreateAdmissionRequestDto) {
    return this.service.apply(dto);
  }

  @Get('requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.REGISTRAR)
  @ApiBearerAuth('access-token')
  getAll() {
    return this.service.getAll();
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.REGISTRAR)
  @ApiBearerAuth('access-token')
  approve(@Param('id') id: string) {
    return this.service.approve(id);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.REGISTRAR)
  @ApiBearerAuth('access-token')
  reject(@Param('id') id: string) {
    return this.service.reject(id);
  }
}
