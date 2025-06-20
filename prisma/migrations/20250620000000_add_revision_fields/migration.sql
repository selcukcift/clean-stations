-- AlterTable
ALTER TABLE "Part" ADD COLUMN "revision" TEXT NOT NULL DEFAULT '1',
ADD COLUMN "customAttributes" JSONB;

-- AlterTable  
ALTER TABLE "Assembly" ADD COLUMN "revision" TEXT NOT NULL DEFAULT '1',
ADD COLUMN "customAttributes" JSONB,
ADD COLUMN "isOrderable" BOOLEAN NOT NULL DEFAULT false;