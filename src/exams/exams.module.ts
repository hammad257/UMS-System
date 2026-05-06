import { Module } from '@nestjs/common';
import {
  ExamsController,
  ExamTypesController,
  GradingSchemesController,
  ResultsController,
} from './exams.controller';
import { ExamsService } from './exams.service';

@Module({
  controllers: [
    ExamTypesController,
    ExamsController,
    GradingSchemesController,
    ResultsController,
  ],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}
