-- CreateTable
CREATE TABLE "school_config" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "name" TEXT NOT NULL DEFAULT 'Sistema Escolar RCO',
    "city" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT 'PR',
    "phone" TEXT NOT NULL DEFAULT '',
    "schoolYear" INTEGER NOT NULL DEFAULT 2026,
    "logoUrl" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PROFESSOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("createdAt", "email", "id", "name", "password", "role", "updatedAt") SELECT "createdAt", "email", "id", "name", "password", "role", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_active_idx" ON "users"("active");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
