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
		ALTER COLUMN "password" DROP NOT NULL;
	END IF;
END $$;
