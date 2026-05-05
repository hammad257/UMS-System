import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/permissions.decorator';
import { ModuleName } from '../common/guards/permissions.module.decorator';

import { EmployeesService } from './employees.service';
import {
  CreateEmployeeDto,
  ListEmployeesQueryDto,
  PromoteEmployeeToUserDto,
  SetEmployeeDepartmentsDto,
  UpdateEmployeeDto,
} from './dto/employee.dto';

@ApiTags('Employees')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  @Get()
  @ModuleName('Employees')
  @Permissions('employees.employee.read')
  @ApiOperation({ summary: 'List employees (paginated, filterable)' })
  findAll(@Query() query: ListEmployeesQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ModuleName('Employees')
  @Permissions('employees.employee.read')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ModuleName('Employees')
  @Permissions('employees.employee.create')
  @ApiOperation({ summary: 'Create employee (optionally with login user)' })
  create(@Body() dto: CreateEmployeeDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ModuleName('Employees')
  @Permissions('employees.employee.update')
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ModuleName('Employees')
  @Permissions('employees.employee.delete')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Put(':id/departments')
  @ModuleName('Employees')
  @Permissions('employees.employee.update')
  @ApiOperation({ summary: 'Replace the department M2M set for this employee' })
  setDepartments(
    @Param('id') id: string,
    @Body() dto: SetEmployeeDepartmentsDto,
  ) {
    return this.service.setDepartments(id, dto);
  }

  @Post(':id/user')
  @ModuleName('Identity')
  @Permissions('identity.user.create')
  @ApiOperation({ summary: 'Promote an employee to a login user' })
  promoteToUser(
    @Param('id') id: string,
    @Body() dto: PromoteEmployeeToUserDto,
  ) {
    return this.service.promoteToUser(id, dto);
  }

  @Delete(':id/user')
  @ModuleName('Identity')
  @Permissions('identity.user.delete')
  @ApiOperation({ summary: 'Unlink and soft-delete the linked login user' })
  demoteFromUser(@Param('id') id: string) {
    return this.service.demoteFromUser(id);
  }
}
