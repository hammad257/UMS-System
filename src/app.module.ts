import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';

import { CampusModule } from './campus/campus.module';
import { AcademicFacultyModule } from './faculty/faculty.module';
import { AcademicModule } from './academic/academic.module';
import { BatchModule } from './batch/batch.module';

import { StudentModule } from './student/student.module';
import { GuardianModule } from './gaurdian/gaurdian.module';
import { AdmissionModule } from './admission/admission.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { AttendanceModule } from './attendance/attendance.module';
import { GradingModule } from './grading/grading.module';
import { TimetableModule } from './timetable/timetable.module';
import { LeaveRequestModule } from './leave-request/leave-request.module';
import { MediaModule } from './media/media.module';

// Module 4-10 — new modules
import { EmployeesModule } from './employees/employees.module';
import { OfferingsModule } from './offerings/offerings.module';
import { AttendanceSessionsModule } from './attendance-sessions/attendance-sessions.module';
import { StudentsModule } from './students/students.module';
import { ExamsModule } from './exams/exams.module';
import { FinanceModule } from './finance/finance.module';
import { CommunicationModule } from './communication/communication.module';

import { GlobalExceptionFilter } from './common/filters/http-execption.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,

    // Module 1 — Auth
    AuthModule,
    // Module 2 — Identity & Access (RBAC)
    UsersModule,
    AdminModule,

    // Module 3 — Academic structure
    CampusModule,
    AcademicFacultyModule,
    AcademicModule,
    BatchModule,

    // Domain modules (preserved)
    StudentModule,
    GuardianModule,
    AdmissionModule,
    EnrollmentModule,
    AttendanceModule,
    GradingModule,
    TimetableModule,
    LeaveRequestModule,
    MediaModule,

    // Module 4 — Employees
    EmployeesModule,
    // Module 5 — Courses & Teaching (Classroom, Offering, Assignments, Slots)
    OfferingsModule,
    // Module 6 — Attendance (sessions + records)
    AttendanceSessionsModule,
    // Module 7 — Students v2 (refactored model + Guardians + history)
    StudentsModule,
    // Module 8 — Exams, Marks, Grading Schemes
    ExamsModule,
    // Module 9 — Finance (Fee Structures, Invoices, Payments)
    FinanceModule,
    // Module 10 — Communication (Notifications, Messages, Announcements)
    CommunicationModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
