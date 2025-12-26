/*
  Warnings:

  - A unique constraint covering the columns `[student_number]` on the table `student` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "student_student_number_key" ON "student"("student_number");
