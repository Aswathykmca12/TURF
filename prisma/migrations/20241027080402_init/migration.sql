/*
  Warnings:

  - Added the required column `cardName` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cardno` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cardName" TEXT NOT NULL,
ADD COLUMN     "cardno" TEXT NOT NULL;
