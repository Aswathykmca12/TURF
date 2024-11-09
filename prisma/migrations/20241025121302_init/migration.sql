/*
  Warnings:

  - You are about to drop the column `scheduleTime` on the `Turf` table. All the data in the column will be lost.
  - Added the required column `scheduleTime` to the `TurfSchedule` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Turf" DROP COLUMN "scheduleTime";

-- AlterTable
ALTER TABLE "TurfSchedule" ADD COLUMN     "scheduleTime" TEXT NOT NULL;
