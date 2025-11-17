/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `course_material` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[course_type_name,course_material_id]` on the table `session_type` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "course_material_name_key" ON "course_material"("name");

-- CreateIndex
CREATE UNIQUE INDEX "session_type_course_type_name_course_material_id_key" ON "session_type"("course_type_name", "course_material_id");
