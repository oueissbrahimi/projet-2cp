/*
  Warnings:

  - Changed the type of `status` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Statustype" AS ENUM ('ACTIVE', 'SUSPENDED');

-- AlterTable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'Subscription'
  ) THEN
    ALTER TABLE "Subscription"
    ALTER COLUMN "endDate" SET DEFAULT (CURRENT_TIMESTAMP + interval '1 month');
  END IF;
END $$;

-- AlterTable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'User'
  ) THEN
    ALTER TABLE "User"
    DROP COLUMN "status",
    ADD COLUMN "status" "Statustype" NOT NULL;
  END IF;
END $$;
