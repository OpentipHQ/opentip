-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailVerifyToken" TEXT,
ADD COLUMN "emailVerifyExpiry" TIMESTAMP(3);
