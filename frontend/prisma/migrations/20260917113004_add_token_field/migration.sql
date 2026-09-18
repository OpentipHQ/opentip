/*
  Warnings:

  - You are about to drop the column `usdc_amount` on the `Tip` table. All the data in the column will be lost.
  - Added the required column `amount` to the `Tip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token` to the `Tip` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Tip" DROP COLUMN "usdc_amount",
ADD COLUMN     "amount" BIGINT NOT NULL,
ADD COLUMN     "token" VARCHAR(42) NOT NULL;

-- CreateIndex
CREATE INDEX "Tip_token_idx" ON "Tip"("token");
