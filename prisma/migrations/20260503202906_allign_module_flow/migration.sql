/*
  Warnings:

  - You are about to drop the column `endYear` on the `batches` table. All the data in the column will be lost.
  - You are about to drop the column `startYear` on the `batches` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `permissions` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `permissions` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `permissions` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `refresh_tokens` table. All the data in the column will be lost.
  - The primary key for the `role_permissions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `role_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `role_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `academicYear` on the `semesters` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `semesters` table. All the data in the column will be lost.
  - You are about to drop the column `program_id` on the `semesters` table. All the data in the column will be lost.
  - You are about to drop the column `bloodGroup` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `currentSemesterId` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `dateOfBirth` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `profilePhoto` on the `students` table. All the data in the column will be lost.
  - The primary key for the `user_roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `user_roles` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `user_roles` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `AdmissionRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Guardian` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProgramCourse` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SemesterCourse` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StudentGuardian` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[program_id,session_id]` on the table `batches` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `permissions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[token_hash]` on the table `refresh_tokens` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `roles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[session_id,sequence]` on the table `semesters` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `end_year` to the `batches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `session_id` to the `batches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_year` to the `batches` table without a default value. This is not possible if the table is not empty.
  - Made the column `academic_faculty_id` on table `departments` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `action` to the `permissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `permissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resource` to the `permissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token_hash` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sequence` to the `semesters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `session_id` to the `semesters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `first_name` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- CreateEnum
CREATE TYPE "EntityStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ProgramLevel" AS ENUM ('BS', 'MS', 'PHD', 'DIPLOMA');

-- DropForeignKey
ALTER TABLE "AdmissionRequest" DROP CONSTRAINT "AdmissionRequest_batchId_fkey";

-- DropForeignKey
ALTER TABLE "AdmissionRequest" DROP CONSTRAINT "AdmissionRequest_programId_fkey";

-- DropForeignKey
ALTER TABLE "ProgramCourse" DROP CONSTRAINT "ProgramCourse_courseId_fkey";

-- DropForeignKey
ALTER TABLE "ProgramCourse" DROP CONSTRAINT "ProgramCourse_programId_fkey";

-- DropForeignKey
ALTER TABLE "SemesterCourse" DROP CONSTRAINT "SemesterCourse_courseId_fkey";

-- DropForeignKey
ALTER TABLE "SemesterCourse" DROP CONSTRAINT "SemesterCourse_programId_fkey";

-- DropForeignKey
ALTER TABLE "SemesterCourse" DROP CONSTRAINT "SemesterCourse_semesterId_fkey";

-- DropForeignKey
ALTER TABLE "StudentGuardian" DROP CONSTRAINT "StudentGuardian_guardianId_fkey";

-- DropForeignKey
ALTER TABLE "StudentGuardian" DROP CONSTRAINT "StudentGuardian_studentId_fkey";

-- DropForeignKey
ALTER TABLE "academic_faculties" DROP CONSTRAINT "academic_faculties_campus_id_fkey";

-- DropForeignKey
ALTER TABLE "batches" DROP CONSTRAINT "batches_program_id_fkey";

-- DropForeignKey
ALTER TABLE "departments" DROP CONSTRAINT "departments_academic_faculty_id_fkey";

-- DropForeignKey
ALTER TABLE "programs" DROP CONSTRAINT "programs_department_id_fkey";

-- DropForeignKey
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "semesters" DROP CONSTRAINT "semesters_program_id_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_currentSemesterId_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_role_id_fkey";

-- DropIndex
DROP INDEX "batches_program_id_name_key";

-- DropIndex
DROP INDEX "campuses_name_key";

-- DropIndex
DROP INDEX "departments_name_key";

-- DropIndex
DROP INDEX "permissions_name_key";

-- DropIndex
DROP INDEX "refresh_tokens_token_key";

-- DropIndex
DROP INDEX "role_permissions_role_id_permission_id_key";

-- DropIndex
DROP INDEX "roles_name_key";

-- DropIndex
DROP INDEX "semesters_name_key";

-- DropIndex
DROP INDEX "semesters_name_program_id_key";

-- DropIndex
DROP INDEX "user_roles_user_id_role_id_key";

-- AlterTable
ALTER TABLE "academic_faculties" ADD COLUMN     "created_by_id" TEXT,
ADD COLUMN     "dean" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updated_by_id" TEXT;

-- AlterTable
ALTER TABLE "batches" DROP COLUMN "endYear",
DROP COLUMN "startYear",
ADD COLUMN     "created_by_id" TEXT,
ADD COLUMN     "end_year" INTEGER NOT NULL,
ADD COLUMN     "intake" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "session_id" TEXT NOT NULL,
ADD COLUMN     "start_year" INTEGER NOT NULL,
ADD COLUMN     "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updated_by_id" TEXT;

-- AlterTable
ALTER TABLE "campuses" ADD COLUMN     "created_by_id" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updated_by_id" TEXT;

-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "created_by_id" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "head" TEXT,
ADD COLUMN     "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updated_by_id" TEXT,
ALTER COLUMN "academic_faculty_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "permissions" DROP COLUMN "createdAt",
DROP COLUMN "name",
DROP COLUMN "updatedAt",
ADD COLUMN     "action" TEXT NOT NULL,
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "resource" TEXT NOT NULL,
ALTER COLUMN "module" DROP DEFAULT;

-- AlterTable
ALTER TABLE "programs" ADD COLUMN     "created_by_id" TEXT,
ADD COLUMN     "duration_years" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "level" "ProgramLevel" NOT NULL DEFAULT 'BS',
ADD COLUMN     "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "total_credits" INTEGER NOT NULL DEFAULT 132,
ADD COLUMN     "updated_by_id" TEXT;

-- AlterTable
ALTER TABLE "refresh_tokens" DROP COLUMN "created_at",
DROP COLUMN "token",
ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "replaced_by" TEXT,
ADD COLUMN     "revoked_at" TIMESTAMP(3),
ADD COLUMN     "token_hash" TEXT NOT NULL,
ADD COLUMN     "user_agent" TEXT;

-- AlterTable
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "id",
ADD COLUMN     "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "granted_by" TEXT,
ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id");

-- AlterTable
ALTER TABLE "roles" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_system" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "semesters" DROP COLUMN "academicYear",
DROP COLUMN "is_active",
DROP COLUMN "program_id",
ADD COLUMN     "created_by_id" TEXT,
ADD COLUMN     "sequence" INTEGER NOT NULL,
ADD COLUMN     "session_id" TEXT NOT NULL,
ADD COLUMN     "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updated_by_id" TEXT,
ALTER COLUMN "start_date" SET DATA TYPE DATE,
ALTER COLUMN "end_date" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "students" DROP COLUMN "bloodGroup",
DROP COLUMN "currentSemesterId",
DROP COLUMN "dateOfBirth",
DROP COLUMN "profilePhoto",
ADD COLUMN     "blood_group" TEXT,
ADD COLUMN     "current_semester_id" TEXT,
ADD COLUMN     "date_of_birth" TIMESTAMP(3),
ADD COLUMN     "profile_photo" TEXT;

-- AlterTable
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "id",
ADD COLUMN     "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "assigned_by" TEXT,
ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_id");

-- AlterTable
ALTER TABLE "users" DROP COLUMN "is_active",
ADD COLUMN     "created_by_id" TEXT,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "last_name" TEXT NOT NULL,
ADD COLUMN     "photo_url" TEXT,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updated_by_id" TEXT;

-- DropTable
DROP TABLE "AdmissionRequest";

-- DropTable
DROP TABLE "Guardian";

-- DropTable
DROP TABLE "ProgramCourse";

-- DropTable
DROP TABLE "SemesterCourse";

-- DropTable
DROP TABLE "StudentGuardian";

-- CreateTable
CREATE TABLE "user_scopes" (
    "user_id" TEXT NOT NULL,
    "campus_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "department_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_scopes_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "academic_sessions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,

    CONSTRAINT "academic_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_courses" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,

    CONSTRAINT "program_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semester_courses" (
    "id" TEXT NOT NULL,
    "semester_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,

    CONSTRAINT "semester_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardians" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "cnic" TEXT NOT NULL,
    "occupation" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_guardians" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "guardian_id" TEXT NOT NULL,
    "relation" TEXT,

    CONSTRAINT "student_guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_requests" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'PENDING',
    "phone" TEXT,
    "address" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "programId" TEXT NOT NULL,
    "batchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "academic_sessions_code_key" ON "academic_sessions"("code");

-- CreateIndex
CREATE INDEX "academic_sessions_status_idx" ON "academic_sessions"("status");

-- CreateIndex
CREATE INDEX "academic_sessions_start_date_idx" ON "academic_sessions"("start_date");

-- CreateIndex
CREATE UNIQUE INDEX "program_courses_program_id_course_id_key" ON "program_courses"("program_id", "course_id");

-- CreateIndex
CREATE UNIQUE INDEX "semester_courses_semester_id_course_id_key" ON "semester_courses"("semester_id", "course_id");

-- CreateIndex
CREATE UNIQUE INDEX "guardians_cnic_key" ON "guardians"("cnic");

-- CreateIndex
CREATE UNIQUE INDEX "student_guardians_student_id_guardian_id_key" ON "student_guardians"("student_id", "guardian_id");

-- CreateIndex
CREATE INDEX "academic_faculties_campus_id_idx" ON "academic_faculties"("campus_id");

-- CreateIndex
CREATE INDEX "academic_faculties_status_idx" ON "academic_faculties"("status");

-- CreateIndex
CREATE INDEX "batches_program_id_idx" ON "batches"("program_id");

-- CreateIndex
CREATE INDEX "batches_session_id_idx" ON "batches"("session_id");

-- CreateIndex
CREATE INDEX "batches_status_idx" ON "batches"("status");

-- CreateIndex
CREATE UNIQUE INDEX "batches_program_id_session_id_key" ON "batches"("program_id", "session_id");

-- CreateIndex
CREATE INDEX "campuses_status_idx" ON "campuses"("status");

-- CreateIndex
CREATE INDEX "departments_academic_faculty_id_idx" ON "departments"("academic_faculty_id");

-- CreateIndex
CREATE INDEX "departments_status_idx" ON "departments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_module_resource_idx" ON "permissions"("module", "resource");

-- CreateIndex
CREATE INDEX "programs_department_id_idx" ON "programs"("department_id");

-- CreateIndex
CREATE INDEX "programs_status_idx" ON "programs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE INDEX "semesters_session_id_idx" ON "semesters"("session_id");

-- CreateIndex
CREATE INDEX "semesters_status_idx" ON "semesters"("status");

-- CreateIndex
CREATE UNIQUE INDEX "semesters_session_id_sequence_key" ON "semesters"("session_id", "sequence");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_scopes" ADD CONSTRAINT "user_scopes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_faculties" ADD CONSTRAINT "academic_faculties_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_academic_faculty_id_fkey" FOREIGN KEY ("academic_faculty_id") REFERENCES "academic_faculties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semesters" ADD CONSTRAINT "semesters_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "academic_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "academic_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_courses" ADD CONSTRAINT "program_courses_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_courses" ADD CONSTRAINT "program_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semester_courses" ADD CONSTRAINT "semester_courses_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semester_courses" ADD CONSTRAINT "semester_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semester_courses" ADD CONSTRAINT "semester_courses_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_current_semester_id_fkey" FOREIGN KEY ("current_semester_id") REFERENCES "semesters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_requests" ADD CONSTRAINT "admission_requests_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_requests" ADD CONSTRAINT "admission_requests_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
