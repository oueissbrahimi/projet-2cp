-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('INDIVIDUAL', 'BUSINESS', 'FREE');

-- AlterTable - Convert text to enum
ALTER TABLE "Subscription" 
  ALTER COLUMN "tier" TYPE "SubscriptionTier" USING CASE 
    WHEN tier = 'INDIVIDUAL' THEN 'INDIVIDUAL'::"SubscriptionTier"
    WHEN tier = 'BUSINESS' THEN 'BUSINESS'::"SubscriptionTier"
    ELSE 'FREE'::"SubscriptionTier"
  END;
