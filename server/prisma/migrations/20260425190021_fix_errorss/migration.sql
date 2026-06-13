/*
  Warnings:

  - Added the required column `status` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "endDate" SET DEFAULT (CURRENT_TIMESTAMP + interval '1 month');

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "status" TEXT NOT NULL;
