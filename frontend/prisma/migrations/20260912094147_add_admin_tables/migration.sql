-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "address" VARCHAR(42) NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "addedBy" VARCHAR(42),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminAddr" VARCHAR(42) NOT NULL,
    "action" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "txHash" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_address_key" ON "Admin"("address");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminAddr_idx" ON "AdminAuditLog"("adminAddr");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_idx" ON "AdminAuditLog"("action");

-- CreateIndex
CREATE INDEX "AdminAuditLog_timestamp_idx" ON "AdminAuditLog"("timestamp");
