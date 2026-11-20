-- CreateTable
CREATE TABLE "classrooms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "shift" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "classrooms_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "registration" TEXT NOT NULL,
    "guardianName" TEXT NOT NULL,
    "guardianPhone" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "classroomId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "students_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "classrooms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "classrooms_teacherId_idx" ON "classrooms"("teacherId");

-- CreateIndex
CREATE INDEX "classrooms_year_shift_idx" ON "classrooms"("year", "shift");

-- CreateIndex
CREATE UNIQUE INDEX "students_registration_key" ON "students"("registration");

-- CreateIndex
CREATE INDEX "students_classroomId_name_idx" ON "students"("classroomId", "name");

-- CreateIndex
CREATE INDEX "students_active_idx" ON "students"("active");
