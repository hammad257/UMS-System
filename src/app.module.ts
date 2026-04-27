import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AcademicModule } from './academic/academic.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalExceptionFilter } from './common/filters/http-execption.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { AttendanceModule } from './attendance/attendance.module';
import { GradingModule } from './grading/grading.module';
import { TimetableModule } from './timetable/timetable.module';
import { LeaveRequestModule } from './leave-request/leave-request.module';
import { AdminModule } from './admin/admin.module';
import { CampusModule } from './campus/campus.module';
import { AcademicFacultyModule } from './faculty/faculty.module';
import { BatchModule } from './batch/batch.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    AcademicModule,
    EnrollmentModule,
    AttendanceModule,
    GradingModule,
    TimetableModule,
    LeaveRequestModule,
    AdminModule,
    CampusModule,
    AcademicFacultyModule,
    BatchModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
