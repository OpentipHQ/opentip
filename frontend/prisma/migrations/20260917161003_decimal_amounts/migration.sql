-- AlterTable: Cast existing string data to proper types
ALTER TABLE "Tip" ALTER COLUMN "amount" TYPE DECIMAL(78,0) USING "amount"::DECIMAL(78,0);
ALTER TABLE "Tip" ALTER COLUMN "fee_amount" TYPE DECIMAL(78,0) USING "fee_amount"::DECIMAL(78,0);
ALTER TABLE "Tip" ALTER COLUMN "block_number" TYPE BIGINT USING "block_number"::BIGINT;
ALTER TABLE "IndexerState" ALTER COLUMN "last_block" TYPE BIGINT USING "last_block"::BIGINT;