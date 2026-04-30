/*
  Warnings:

  - A unique constraint covering the columns `[name,program_id]` on the table `semesters` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "currentSemesterId" TEXT;

-- CreateTable
CREATE TABLE "AdmissionRequest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "status" "AdmissionStatus" NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "programId" TEXT NOT NULL,
    "batchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramCourse" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,

    CONSTRAINT "ProgramCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SemesterCourse" (
    "id" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,

    CONSTRAINT "SemesterCourse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgramCourse_programId_courseId_key" ON "ProgramCourse"("programId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "SemesterCourse_semesterId_courseId_key" ON "SemesterCourse"("semesterId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "semesters_name_program_id_key" ON "semesters"("name", "program_id");

-- AddForeignKey
ALTER TABLE "AdmissionRequest" ADD CONSTRAINT "AdmissionRequest_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionRequest" ADD CONSTRAINT "AdmissionRequest_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramCourse" ADD CONSTRAINT "ProgramCourse_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramCourse" ADD CONSTRAINT "ProgramCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_currentSemesterId_fkey" FOREIGN KEY ("currentSemesterId") REFERENCES "semesters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemesterCourse" ADD CONSTRAINT "SemesterCourse_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemesterCourse" ADD CONSTRAINT "SemesterCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemesterCourse" ADD CONSTRAINT "SemesterCourse_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
