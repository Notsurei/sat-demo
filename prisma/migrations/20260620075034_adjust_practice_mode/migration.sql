/*
  Warnings:

  - The values [RANDOM,DOMAIN,SUBTOPIC,DIFFICULTY] on the enum `PracticeMode` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PracticeMode_new" AS ENUM ('ALL_LEVEL', 'EASY', 'MEDIUM', 'HARD');
ALTER TABLE "Practice" ALTER COLUMN "mode" TYPE "PracticeMode_new" USING ("mode"::text::"PracticeMode_new");
ALTER TYPE "PracticeMode" RENAME TO "PracticeMode_old";
ALTER TYPE "PracticeMode_new" RENAME TO "PracticeMode";
DROP TYPE "PracticeMode_old";
COMMIT;
