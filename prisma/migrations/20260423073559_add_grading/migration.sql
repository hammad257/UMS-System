-- CreateTable
CREATE TABLE "grading" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "assignment" DOUBLE PRECISION DEFAULT 0,
    "quiz" DOUBLE PRECISION DEFAULT 0,
    "midterm" DOUBLE PRECISION DEFAULT 0,
    "final_exam" DOUBLE PRECISION DEFAULT 0,
    "total_marks" DOUBLE PRECISION,
    "grade" TEXT,
    "gpa" DOUBLE PRECISION,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grading_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "grading_enrollment_id_key" ON "grading"("enrollment_id");

-- AddForeignKey
ALTER TABLE "grading" ADD CONSTRAINT "grading_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
