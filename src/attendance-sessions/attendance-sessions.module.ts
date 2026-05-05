import { Module } from '@nestjs/common';
import {
  AttendanceReportsController,
  AttendanceSessionsController,
} from './attendance-sessions.controller';
import { AttendanceSessionsService } from './attendance-sessions.service';

@Module({
  controllers: [AttendanceSessionsController, AttendanceReportsController],
  providers: [AttendanceSessionsService],
  exports: [AttendanceSessionsService],
})
export class AttendanceSessionsModule {}
