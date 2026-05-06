import { Module } from '@nestjs/common';
import {
  FeeStructuresController,
  InvoicesController,
  PaymentsController,
} from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
  controllers: [FeeStructuresController, InvoicesController, PaymentsController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
