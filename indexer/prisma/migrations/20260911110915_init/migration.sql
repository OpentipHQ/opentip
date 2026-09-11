-- CreateTable
CREATE TABLE "Tip" (
    "id" TEXT NOT NULL,
    "tipper_address" VARCHAR(42) NOT NULL,
    "repo_id" TEXT NOT NULL,
    "usdc_amount" BIGINT NOT NULL,
    "fee_amount" BIGINT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "block_number" BIGINT NOT NULL,

    CONSTRAINT "Tip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisplayName" (
    "tipper_address" VARCHAR(42) NOT NULL,
    "display_name" VARCHAR(64) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisplayName_pkey" PRIMARY KEY ("tipper_address")
);

-- CreateTable
CREATE TABLE "IndexerState" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "last_block" BIGINT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndexerState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repo" (
    "repo_id" TEXT NOT NULL,
    "payout_address" VARCHAR(42) NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repo_pkey" PRIMARY KEY ("repo_id")
);

-- CreateIndex
CREATE INDEX "Tip_repo_id_idx" ON "Tip"("repo_id");

-- CreateIndex
CREATE INDEX "Tip_tipper_address_idx" ON "Tip"("tipper_address");

-- CreateIndex
CREATE INDEX "Tip_timestamp_idx" ON "Tip"("timestamp");
