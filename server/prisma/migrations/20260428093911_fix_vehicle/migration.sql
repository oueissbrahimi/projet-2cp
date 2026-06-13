/*
  Warnings:

  - You are about to drop the column `size` on the `Vehicle` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "endDate" SET DEFAULT (CURRENT_TIMESTAMP + interval '1 month');

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "size",
ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';
