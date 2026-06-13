-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "endDate" SET DEFAULT (CURRENT_TIMESTAMP + interval '1 month');

-- CreateTable
CREATE TABLE "SubscriptionRequest" (
    "request_ID" SERIAL NOT NULL,
    "user_ID" INTEGER NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "SubscriptionRequest_pkey" PRIMARY KEY ("request_ID")
);

-- CreateIndex
CREATE INDEX "SubscriptionRequest_user_ID_idx" ON "SubscriptionRequest"("user_ID");

-- CreateIndex
CREATE INDEX "SubscriptionRequest_status_idx" ON "SubscriptionRequest"("status");

-- AddForeignKey
ALTER TABLE "SubscriptionRequest" ADD CONSTRAINT "SubscriptionRequest_user_ID_fkey" FOREIGN KEY ("user_ID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
