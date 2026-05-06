/*
  Warnings:

  - A unique constraint covering the columns `[admission_number]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cnic]` on the table `students` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "StudentEnrollmentStatus" AS ENUM ('ACTIVE', 'GRADUATED', 'DROPPED', 'TRANSFERRED', 'ON_LEAVE');

-- CreateEnum
CREATE TYPE "GuardianRelation" AS ENUM ('FATHER', 'MOTHER', 'GUARDIAN', 'SIBLING', 'SPOUSE', 'OTHER');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "EmployeeRole" AS ENUM ('TEACHER', 'STAFF', 'LIBRARIAN', 'FINANCE', 'IT_SUPPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "EmployeeType" AS ENUM ('FACULTY', 'NON_FACULTY');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'VISITING');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CourseType" AS ENUM ('THEORY', 'LAB', 'SEMINAR', 'RESEARCH');

-- CreateEnum
CREATE TYPE "ClassroomType" AS ENUM ('LECTURE', 'LAB', 'SEMINAR', 'STUDIO');

-- CreateEnum
CREATE TYPE "ClassroomStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "OfferingStatus" AS ENUM ('OPEN', 'CLOSED', 'FULL');

-- CreateEnum
CREATE TYPE "AssignmentRole" AS ENUM ('PRIMARY', 'CO_PRIMARY', 'TA');

-- CreateEnum
CREATE TYPE "Day" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EnrollmentSemesterStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('TUITION', 'ADMISSION', 'LIBRARY', 'LAB', 'EXAM', 'TRANSPORT', 'HOSTEL', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CARD', 'ONLINE', 'CHEQUE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'DANGER');

-- CreateEnum
CREATE TYPE "AnnouncementAudience" AS ENUM ('ALL', 'STUDENTS', 'FACULTY', 'STAFF');

-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterEnum
ALTER TYPE "AttendanceStatus" ADD VALUE 'EXCUSED';

-- AlterEnum
ALTER TYPE "StudentStatus" ADD VALUE 'PENDING';

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_user_id_fkey";

-- AlterTable
ALTER TABLE "academic_faculties" ADD COLUMN     "dean_employee_id" TEXT;

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "description" TEXT,
ADD COLUMN     "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "type" "CourseType";

-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "head_employee_id" TEXT;

-- AlterTable
ALTER TABLE "guardians" ADD COLUMN     "created_by_id" TEXT,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "photo_url" TEXT,
ADD COLUMN     "updated_by_id" TEXT,
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "cnic" DROP NOT NULL;

-- AlterTable
ALTER TABLE "student_guardians" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "is_primary" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "admission_number" TEXT,
ADD COLUMN     "cnic" TEXT,
ADD COLUMN     "created_by_id" TEXT,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "enrolled_at" DATE,
ADD COLUMN     "enrollment_status" "StudentEnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updated_by_id" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "employee_number" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "dob" DATE,
    "gender" "Gender",
    "address" TEXT,
    "nationality" TEXT,
    "cnic" TEXT,
    "role" "EmployeeRole" NOT NULL,
    "employee_type" "EmployeeType" NOT NULL,
    "designation" TEXT NOT NULL,
    "employment_type" "EmploymentType" NOT NULL,
    "joining_date" DATE NOT NULL,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "primary_department_id" TEXT,
    "photo_url" TEXT,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_departments" (
    "employee_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_departments_pkey" PRIMARY KEY ("employee_id","department_id")
);

-- CreateTable
CREATE TABLE "classrooms" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "building" TEXT,
    "type" "ClassroomType" NOT NULL,
    "status" "ClassroomStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,

    CONSTRAINT "classrooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offerings" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "semester_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" "OfferingStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,

    CONSTRAINT "offerings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_assignments" (
    "id" TEXT NOT NULL,
    "offering_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "role" "AssignmentRole" NOT NULL DEFAULT 'PRIMARY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT,

    CONSTRAINT "course_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetable_slots" (
    "id" TEXT NOT NULL,
    "offering_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "day" "Day" NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,

    CONSTRAINT "timetable_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_sessions" (
    "id" TEXT NOT NULL,
    "offering_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "topic" TEXT,
    "notes" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "marked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,

    CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "notes" TEXT,
    "marked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "marked_by" TEXT,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment_history" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "semester_id" TEXT NOT NULL,
    "status" "EnrollmentSemesterStatus" NOT NULL,
    "started_at" DATE NOT NULL,
    "ended_at" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT,

    CONSTRAINT "enrollment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exams" (
    "id" TEXT NOT NULL,
    "offering_id" TEXT NOT NULL,
    "exam_type_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_marks" INTEGER NOT NULL,
    "status" "ExamStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marks" (
    "id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "obtained" DECIMAL(6,2) NOT NULL,
    "remarks" TEXT,
    "entered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entered_by" TEXT,

    CONSTRAINT "marks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grading_schemes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grading_schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grading_tiers" (
    "id" TEXT NOT NULL,
    "scheme_id" TEXT NOT NULL,
    "letter" TEXT NOT NULL,
    "min" DECIMAL(5,2) NOT NULL,
    "gpa" DECIMAL(3,2) NOT NULL,

    CONSTRAINT "grading_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_structures" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "applies_from_year" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,

    CONSTRAINT "fee_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_items" (
    "id" TEXT NOT NULL,
    "structure_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" "FeeType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "one_time" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "semester_id" TEXT NOT NULL,
    "issue_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "approved_at" TIMESTAMP(3),
    "approved_by_id" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "cancelled_by_id" TEXT,
    "cancel_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" "FeeType" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "paid_at" DATE NOT NULL,
    "notes" TEXT,
    "recorded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audience" "AnnouncementAudience"[],
    "author_id" TEXT NOT NULL,
    "status" "AnnouncementStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_number_key" ON "employees"("employee_number");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_cnic_key" ON "employees"("cnic");

-- CreateIndex
CREATE UNIQUE INDEX "employees_user_id_key" ON "employees"("user_id");

-- CreateIndex
CREATE INDEX "employees_role_idx" ON "employees"("role");

-- CreateIndex
CREATE INDEX "employees_status_idx" ON "employees"("status");

-- CreateIndex
CREATE INDEX "employees_primary_department_id_idx" ON "employees"("primary_department_id");

-- CreateIndex
CREATE INDEX "employees_user_id_idx" ON "employees"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "classrooms_code_key" ON "classrooms"("code");

-- CreateIndex
CREATE INDEX "classrooms_status_idx" ON "classrooms"("status");

-- CreateIndex
CREATE INDEX "offerings_course_id_idx" ON "offerings"("course_id");

-- CreateIndex
CREATE INDEX "offerings_semester_id_idx" ON "offerings"("semester_id");

-- CreateIndex
CREATE INDEX "offerings_batch_id_idx" ON "offerings"("batch_id");

-- CreateIndex
CREATE INDEX "offerings_status_idx" ON "offerings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "offerings_course_id_semester_id_batch_id_section_key" ON "offerings"("course_id", "semester_id", "batch_id", "section");

-- CreateIndex
CREATE INDEX "course_assignments_offering_id_idx" ON "course_assignments"("offering_id");

-- CreateIndex
CREATE INDEX "course_assignments_teacher_id_idx" ON "course_assignments"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_assignments_offering_id_teacher_id_key" ON "course_assignments"("offering_id", "teacher_id");

-- CreateIndex
CREATE INDEX "timetable_slots_offering_id_idx" ON "timetable_slots"("offering_id");

-- CreateIndex
CREATE INDEX "timetable_slots_teacher_id_day_idx" ON "timetable_slots"("teacher_id", "day");

-- CreateIndex
CREATE INDEX "timetable_slots_room_id_day_idx" ON "timetable_slots"("room_id", "day");

-- CreateIndex
CREATE INDEX "attendance_sessions_offering_id_idx" ON "attendance_sessions"("offering_id");

-- CreateIndex
CREATE INDEX "attendance_sessions_date_idx" ON "attendance_sessions"("date");

-- CreateIndex
CREATE INDEX "attendance_sessions_status_idx" ON "attendance_sessions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_sessions_offering_id_date_start_time_key" ON "attendance_sessions"("offering_id", "date", "start_time");

-- CreateIndex
CREATE INDEX "attendance_records_session_id_idx" ON "attendance_records"("session_id");

-- CreateIndex
CREATE INDEX "attendance_records_student_id_idx" ON "attendance_records"("student_id");

-- CreateIndex
CREATE INDEX "attendance_records_status_idx" ON "attendance_records"("status");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_session_id_student_id_key" ON "attendance_records"("session_id", "student_id");

-- CreateIndex
CREATE INDEX "enrollment_history_student_id_idx" ON "enrollment_history"("student_id");

-- CreateIndex
CREATE INDEX "enrollment_history_semester_id_idx" ON "enrollment_history"("semester_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_types_name_key" ON "exam_types"("name");

-- CreateIndex
CREATE INDEX "exams_offering_id_idx" ON "exams"("offering_id");

-- CreateIndex
CREATE INDEX "exams_exam_type_id_idx" ON "exams"("exam_type_id");

-- CreateIndex
CREATE INDEX "exams_date_idx" ON "exams"("date");

-- CreateIndex
CREATE INDEX "exams_status_idx" ON "exams"("status");

-- CreateIndex
CREATE INDEX "marks_exam_id_idx" ON "marks"("exam_id");

-- CreateIndex
CREATE INDEX "marks_student_id_idx" ON "marks"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "marks_exam_id_student_id_key" ON "marks"("exam_id", "student_id");

-- CreateIndex
CREATE INDEX "grading_tiers_scheme_id_idx" ON "grading_tiers"("scheme_id");

-- CreateIndex
CREATE UNIQUE INDEX "grading_tiers_scheme_id_letter_key" ON "grading_tiers"("scheme_id", "letter");

-- CreateIndex
CREATE UNIQUE INDEX "grading_tiers_scheme_id_min_key" ON "grading_tiers"("scheme_id", "min");

-- CreateIndex
CREATE INDEX "fee_structures_program_id_idx" ON "fee_structures"("program_id");

-- CreateIndex
CREATE INDEX "fee_structures_status_idx" ON "fee_structures"("status");

-- CreateIndex
CREATE UNIQUE INDEX "fee_structures_program_id_applies_from_year_key" ON "fee_structures"("program_id", "applies_from_year");

-- CreateIndex
CREATE INDEX "fee_items_structure_id_idx" ON "fee_items"("structure_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_student_id_idx" ON "invoices"("student_id");

-- CreateIndex
CREATE INDEX "invoices_semester_id_idx" ON "invoices"("semester_id");

-- CreateIndex
CREATE INDEX "invoices_due_date_idx" ON "invoices"("due_date");

-- CreateIndex
CREATE INDEX "invoices_cancelled_at_idx" ON "invoices"("cancelled_at");

-- CreateIndex
CREATE INDEX "invoice_items_invoice_id_idx" ON "invoice_items"("invoice_id");

-- CreateIndex
CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "payments_paid_at_idx" ON "payments"("paid_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "messages_thread_id_created_at_idx" ON "messages"("thread_id", "created_at");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE INDEX "messages_recipient_id_read_at_idx" ON "messages"("recipient_id", "read_at");

-- CreateIndex
CREATE INDEX "announcements_status_idx" ON "announcements"("status");

-- CreateIndex
CREATE INDEX "announcements_published_at_idx" ON "announcements"("published_at");

-- CreateIndex
CREATE INDEX "courses_department_id_idx" ON "courses"("department_id");

-- CreateIndex
CREATE INDEX "courses_status_idx" ON "courses"("status");

-- CreateIndex
CREATE INDEX "student_guardians_guardian_id_idx" ON "student_guardians"("guardian_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_admission_number_key" ON "students"("admission_number");

-- CreateIndex
CREATE UNIQUE INDEX "students_cnic_key" ON "students"("cnic");

-- CreateIndex
CREATE INDEX "students_program_id_idx" ON "students"("program_id");

-- CreateIndex
CREATE INDEX "students_batch_id_idx" ON "students"("batch_id");

-- CreateIndex
CREATE INDEX "students_current_semester_id_idx" ON "students"("current_semester_id");

-- CreateIndex
CREATE INDEX "students_status_idx" ON "students"("status");

-- CreateIndex
CREATE INDEX "students_enrollment_status_idx" ON "students"("enrollment_status");

-- AddForeignKey
ALTER TABLE "academic_faculties" ADD CONSTRAINT "academic_faculties_dean_employee_id_fkey" FOREIGN KEY ("dean_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_head_employee_id_fkey" FOREIGN KEY ("head_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_primary_department_id_fkey" FOREIGN KEY ("primary_department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_departments" ADD CONSTRAINT "employee_departments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_departments" ADD CONSTRAINT "employee_departments_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offerings" ADD CONSTRAINT "offerings_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offerings" ADD CONSTRAINT "offerings_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offerings" ADD CONSTRAINT "offerings_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_assignments" ADD CONSTRAINT "course_assignments_offering_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_assignments" ADD CONSTRAINT "course_assignments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_offering_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_offering_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "attendance_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_history" ADD CONSTRAINT "enrollment_history_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_history" ADD CONSTRAINT "enrollment_history_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_history" ADD CONSTRAINT "enrollment_history_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment_history" ADD CONSTRAINT "enrollment_history_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_offering_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_exam_type_id_fkey" FOREIGN KEY ("exam_type_id") REFERENCES "exam_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks" ADD CONSTRAINT "marks_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marks" ADD CONSTRAINT "marks_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grading_tiers" ADD CONSTRAINT "grading_tiers_scheme_id_fkey" FOREIGN KEY ("scheme_id") REFERENCES "grading_schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_items" ADD CONSTRAINT "fee_items_structure_id_fkey" FOREIGN KEY ("structure_id") REFERENCES "fee_structures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
