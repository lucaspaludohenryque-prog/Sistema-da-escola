-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classroomId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "term" INTEGER NOT NULL,
    "maxScore" REAL NOT NULL DEFAULT 10.0,
    "weight" REAL NOT NULL DEFAULT 1.0,
    "date" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "assessments_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "classrooms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "grades" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "grades_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "grades_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "assessments_classroomId_term_date_idx" ON "assessments"("classroomId", "term", "date");

-- CreateIndex
CREATE INDEX "grades_studentId_idx" ON "grades"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "grades_assessmentId_studentId_key" ON "grades"("assessmentId", "studentId");
