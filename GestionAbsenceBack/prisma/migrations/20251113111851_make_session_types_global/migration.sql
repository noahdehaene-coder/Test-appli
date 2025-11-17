/*
  Warnings:

  - You are about to drop the column `course_type_name` on the `session_type` table. All the data in the column will be lost.
  - Added the required column `sessionTypeGlobalId` to the `session_type` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "SessionTypeGlobal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_session_type" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "course_material_id" INTEGER NOT NULL,
    "sessionTypeGlobalId" INTEGER NOT NULL,
    CONSTRAINT "session_type_course_material_id_fkey" FOREIGN KEY ("course_material_id") REFERENCES "course_material" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "session_type_sessionTypeGlobalId_fkey" FOREIGN KEY ("sessionTypeGlobalId") REFERENCES "SessionTypeGlobal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_session_type" ("course_material_id", "id") SELECT "course_material_id", "id" FROM "session_type";
DROP TABLE "session_type";
ALTER TABLE "new_session_type" RENAME TO "session_type";
CREATE UNIQUE INDEX "session_type_sessionTypeGlobalId_course_material_id_key" ON "session_type"("sessionTypeGlobalId", "course_material_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SessionTypeGlobal_name_key" ON "SessionTypeGlobal"("name");
