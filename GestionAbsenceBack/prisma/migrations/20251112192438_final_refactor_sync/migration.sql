/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `semester` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `professorId` to the `slot` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_slot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "group_id" INTEGER NOT NULL,
    "session_type_id" INTEGER NOT NULL,
    "professorId" INTEGER NOT NULL,
    CONSTRAINT "slot_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "group" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "slot_session_type_id_fkey" FOREIGN KEY ("session_type_id") REFERENCES "session_type" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "slot_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_slot" ("date", "group_id", "id", "session_type_id") SELECT "date", "group_id", "id", "session_type_id" FROM "slot";
DROP TABLE "slot";
ALTER TABLE "new_slot" RENAME TO "slot";
CREATE UNIQUE INDEX "slot_date_session_type_id_group_id_professorId_key" ON "slot"("date", "session_type_id", "group_id", "professorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "semester_name_key" ON "semester"("name");
