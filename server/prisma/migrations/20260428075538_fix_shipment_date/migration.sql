/*
  Warnings:

  - The `date` column on the `Route` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `interval_start` column on the `Route` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `interval_end` column on the `Route` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `date` on the `Shipment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable - Preserve existing data
ALTER TABLE "Shipment" ALTER COLUMN "date" SET DATA TYPE TIMESTAMP(3) USING "date"::TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Route" DROP COLUMN "date",
ADD COLUMN     "date" TIMESTAMP(3),
DROP COLUMN "interval_start",
ADD COLUMN     "interval_start" TIMESTAMP(3),
DROP COLUMN "interval_end",
ADD COLUMN     "interval_end" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "endDate" SET DEFAULT (CURRENT_TIMESTAMP + interval '1 month');

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "fromUser" INTEGER NOT NULL,
    "toUser" INTEGER NOT NULL,
    "msg" TEXT NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" SERIAL NOT NULL,
    "user" INTEGER NOT NULL,
    "contactOf" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Message_fromUser_idx" ON "Message"("fromUser");

-- CreateIndex
CREATE INDEX "Message_toUser_idx" ON "Message"("toUser");

-- CreateIndex
CREATE INDEX "Contact_user_idx" ON "Contact"("user");

-- CreateIndex
CREATE INDEX "Contact_contactOf_idx" ON "Contact"("contactOf");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_user_contactOf_key" ON "Contact"("user", "contactOf");

-- CreateIndex
CREATE INDEX "Notification_user_ID_idx" ON "Notification"("user_ID");

-- CreateIndex
CREATE INDEX "Route_user_ID_idx" ON "Route"("user_ID");

-- CreateIndex
CREATE INDEX "Route_vehicle_plate_idx" ON "Route"("vehicle_plate");

-- CreateIndex
CREATE INDEX "Shipment_user_ID_idx" ON "Shipment"("user_ID");

-- CreateIndex
CREATE INDEX "Vehicle_user_ID_idx" ON "Vehicle"("user_ID");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_fromUser_fkey" FOREIGN KEY ("fromUser") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_toUser_fkey" FOREIGN KEY ("toUser") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_contactOf_fkey" FOREIGN KEY ("contactOf") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
