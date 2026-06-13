-- AddColumn to Subscription table
ALTER TABLE "Subscription" ADD COLUMN "shipmentsThisMonth" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Subscription" ADD COLUMN "routesThisMonth" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Subscription" ADD COLUMN "contactsCount" INTEGER NOT NULL DEFAULT 0;
