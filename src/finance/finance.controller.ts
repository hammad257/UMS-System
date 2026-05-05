import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/guards/permissions.decorator';
import { ModuleName } from '../common/guards/permissions.module.decorator';
import { CurrentUser } from '../common/guards/roles.decorator';
import type { AuthUser } from '../common/types';

import { FinanceService } from './finance.service';
import {
  BulkGenerateInvoicesDto,
  CancelInvoiceDto,
  CreateFeeStructureDto,
  CreateInvoiceDto,
  CreatePaymentDto,
  GenerateInvoiceDto,
  UpdateFeeStructureDto,
  UpdateInvoiceDto,
  UpdatePaymentDto,
} from './dto/finance.dto';

// ----------------------------------------------------------------------------
// /fee-structures
// ----------------------------------------------------------------------------

@ApiTags('Fee Structures')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('fee-structures')
export class FeeStructuresController {
  constructor(private readonly service: FinanceService) {}

  @Get()
  @ModuleName('Finance')
  @Permissions('finance.feeStructure.read')
  list(
    @Query('programId') programId?: string,
    @Query('status') status?: string,
    @Query('appliesFromYear') appliesFromYear?: number,
  ) {
    return this.service.listStructures({ programId, status, appliesFromYear });
  }

  @Get(':id')
  @ModuleName('Finance')
  @Permissions('finance.feeStructure.read')
  get(@Param('id') id: string) {
    return this.service.getStructure(id);
  }

  @Post()
  @ModuleName('Finance')
  @Permissions('finance.feeStructure.create')
  create(@Body() dto: CreateFeeStructureDto) {
    return this.service.createStructure(dto);
  }

  @Patch(':id')
  @ModuleName('Finance')
  @Permissions('finance.feeStructure.update')
  update(@Param('id') id: string, @Body() dto: UpdateFeeStructureDto) {
    return this.service.updateStructure(id, dto);
  }

  @Delete(':id')
  @ModuleName('Finance')
  @Permissions('finance.feeStructure.delete')
  remove(@Param('id') id: string) {
    return this.service.deleteStructure(id);
  }
}

// ----------------------------------------------------------------------------
// /invoices
// ----------------------------------------------------------------------------

@ApiTags('Invoices')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly service: FinanceService) {}

  @Get()
  @ModuleName('Finance')
  @Permissions('finance.invoice.read')
  list(
    @Query('studentId') studentId?: string,
    @Query('semesterId') semesterId?: string,
    @Query('status') status?: string,
    @Query('dueFrom') dueFrom?: string,
    @Query('dueTo') dueTo?: string,
  ) {
    return this.service.listInvoices({ studentId, semesterId, status, dueFrom, dueTo });
  }

  @Get(':id')
  @ModuleName('Finance')
  @Permissions('finance.invoice.read')
  get(@Param('id') id: string) {
    return this.service.getInvoice(id);
  }

  @Post()
  @ModuleName('Finance')
  @Permissions('finance.invoice.create')
  create(@Body() dto: CreateInvoiceDto, @CurrentUser() user: AuthUser) {
    return this.service.createInvoice(dto, user?.id);
  }

  @Post('generate')
  @ModuleName('Finance')
  @Permissions('finance.invoice.create')
  @ApiOperation({ summary: 'Generate one invoice from a fee structure' })
  generate(@Body() dto: GenerateInvoiceDto, @CurrentUser() user: AuthUser) {
    return this.service.generateInvoice(dto, user?.id);
  }

  @Post('bulk-generate')
  @ModuleName('Finance')
  @Permissions('finance.invoice.create')
  @ApiOperation({ summary: 'Generate invoices for an entire batch+semester' })
  bulkGenerate(
    @Body() dto: BulkGenerateInvoicesDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.bulkGenerateInvoices(dto, user?.id);
  }

  @Patch(':id')
  @ModuleName('Finance')
  @Permissions('finance.invoice.update')
  update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.service.updateInvoice(id, dto);
  }

  @Delete(':id')
  @ModuleName('Finance')
  @Permissions('finance.invoice.delete')
  remove(@Param('id') id: string) {
    return this.service.deleteInvoice(id);
  }

  @Post(':id/cancel')
  @ModuleName('Finance')
  @Permissions('finance.invoice.update')
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelInvoiceDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.cancelInvoice(id, dto, user?.id);
  }

  @Post(':id/approve')
  @ModuleName('Finance')
  @Permissions('finance.invoice.approve')
  approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.approveInvoice(id, user?.id);
  }

  // Sugar route: /invoices/:id/payments
  @Post(':id/payments')
  @ModuleName('Finance')
  @Permissions('finance.payment.create')
  createInvoicePayment(
    @Param('id') id: string,
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: AuthUser,
  ) {
    if (!user?.id) throw new BadRequestException('Authenticated user required');
    return this.service.createPayment(dto, id, user.id);
  }
}

// ----------------------------------------------------------------------------
// /payments
// ----------------------------------------------------------------------------

@ApiTags('Payments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: FinanceService) {}

  @Get()
  @ModuleName('Finance')
  @Permissions('finance.payment.read')
  list(
    @Query('invoiceId') invoiceId?: string,
    @Query('studentId') studentId?: string,
    @Query('method') method?: string,
    @Query('paidFrom') paidFrom?: string,
    @Query('paidTo') paidTo?: string,
  ) {
    return this.service.listPayments({ invoiceId, studentId, method, paidFrom, paidTo });
  }

  @Get(':id')
  @ModuleName('Finance')
  @Permissions('finance.payment.read')
  get(@Param('id') id: string) {
    return this.service.getPayment(id);
  }

  @Post()
  @ModuleName('Finance')
  @Permissions('finance.payment.create')
  create(@Body() dto: CreatePaymentDto, @CurrentUser() user: AuthUser) {
    if (!user?.id) throw new BadRequestException('Authenticated user required');
    if (!dto.invoiceId) {
      throw new BadRequestException('invoiceId is required when posting to /payments');
    }
    return this.service.createPayment(dto, dto.invoiceId, user.id);
  }

  @Patch(':id')
  @ModuleName('Finance')
  @Permissions('finance.payment.update')
  update(@Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    return this.service.updatePayment(id, dto);
  }

  @Delete(':id')
  @ModuleName('Finance')
  @Permissions('finance.payment.delete')
  remove(@Param('id') id: string) {
    return this.service.deletePayment(id);
  }
}
