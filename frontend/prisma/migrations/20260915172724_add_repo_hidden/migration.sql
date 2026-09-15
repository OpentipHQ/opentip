-- AlterTable
ALTER TABLE "Repo" ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "links" TEXT,
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "summary_generated_at" TIMESTAMP(3);
