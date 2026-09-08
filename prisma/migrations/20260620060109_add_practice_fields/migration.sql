/*
  Warnings:

  - You are about to drop the column `source` on the `Practice` table. All the data in the column will be lost.
  - You are about to drop the column `sourceId` on the `Practice` table. All the data in the column will be lost.
  - The `status` column on the `Practice` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `mode` to the `Practice` table without a default value. This is not possible if the table is not empty.
  - Made the column `totalQuestions` on table `Practice` required. This step will fail if there are existing NULL values in that column.
  - Made the column `correctAnswers` on table `Practice` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "PracticeStatus" AS ENUM ('IN_PROGRESS', 'DONE', 'ABANDONED');

-- CreateEnum
CREATE TYPE "PracticeMode" AS ENUM ('RANDOM', 'DOMAIN', 'SUBTOPIC', 'DIFFICULTY');

-- DropIndex
DROP INDEX "Practice_userId_domain_subtopic_idx";

-- DropIndex
DROP INDEX "Practice_userId_subject_idx";

-- AlterTable
ALTER TABLE "Practice" DROP COLUMN "source",
DROP COLUMN "sourceId",
ADD COLUMN     "answeredQuestions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "difficulty" "Difficulty",
ADD COLUMN     "mode" "PracticeMode" NOT NULL,
ALTER COLUMN "totalQuestions" SET NOT NULL,
ALTER COLUMN "correctAnswers" SET NOT NULL,
ALTER COLUMN "correctAnswers" SET DEFAULT 0,
DROP COLUMN "status",
ADD COLUMN     "status" "PracticeStatus" NOT NULL DEFAULT 'IN_PROGRESS';

-- CreateIndex
CREATE INDEX "Practice_userId_idx" ON "Practice"("userId");

-- CreateIndex
CREATE INDEX "Practice_subject_idx" ON "Practice"("subject");
