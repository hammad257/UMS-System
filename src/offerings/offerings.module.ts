import { Module } from '@nestjs/common';
import { OfferingsService } from './offerings.service';
import {
  ClassroomsController,
  CoursesV2Controller,
  OfferingsController,
  TimetableSlotsController,
} from './offerings.controller';

@Module({
  controllers: [
    CoursesV2Controller,
    ClassroomsController,
    OfferingsController,
    TimetableSlotsController,
  ],
  providers: [OfferingsService],
  exports: [OfferingsService],
})
export class OfferingsModule {}
