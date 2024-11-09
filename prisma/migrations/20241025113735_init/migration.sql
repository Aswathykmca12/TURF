/*
  Warnings:

  - Added the required column `amount` to the `Turf` table without a default value. This is not possible if the table is not empty.
  - Added the required column `managerId` to the `Turf` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduleTime` to the `Turf` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Turf" ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "managerId" INTEGER NOT NULL,
ADD COLUMN     "scheduleTime" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Turf" ADD CONSTRAINT "Turf_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Manager"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
