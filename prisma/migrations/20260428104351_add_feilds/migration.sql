/*
  Warnings:

  - Added the required column `academicYear` to the `semesters` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "semesters" ADD COLUMN     "academicYear" TEXT NOT NULL,
ADD COLUMN     "program_id" TEXT;

-- AddForeignKey
ALTER TABLE "semesters" ADD CONSTRAINT "semesters_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
