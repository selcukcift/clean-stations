-- AlterTable
ALTER TABLE "QcFormTemplateItem" ADD COLUMN "applicabilityCondition" TEXT,
ADD COLUMN "defaultValue" TEXT,
ADD COLUMN "notesPrompt" TEXT,
ADD COLUMN "relatedAssemblyId" TEXT,
ADD COLUMN "relatedPartNumber" TEXT,
ADD COLUMN "repeatPer" TEXT;

-- AlterTable
ALTER TABLE "OrderQcItemResult" ADD COLUMN "attachedDocumentId" TEXT;

-- CreateTable
CREATE TABLE "QcItemResultMediaAttachment" (
    "id" TEXT NOT NULL,
    "orderQcItemResultId" TEXT NOT NULL,
    "fileUploadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QcItemResultMediaAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QcItemResultMediaAttachment_orderQcItemResultId_idx" ON "QcItemResultMediaAttachment"("orderQcItemResultId");

-- CreateIndex
CREATE INDEX "QcItemResultMediaAttachment_fileUploadId_idx" ON "QcItemResultMediaAttachment"("fileUploadId");

-- AddForeignKey
ALTER TABLE "OrderQcItemResult" ADD CONSTRAINT "OrderQcItemResult_attachedDocumentId_fkey" FOREIGN KEY ("attachedDocumentId") REFERENCES "FileUpload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QcItemResultMediaAttachment" ADD CONSTRAINT "QcItemResultMediaAttachment_orderQcItemResultId_fkey" FOREIGN KEY ("orderQcItemResultId") REFERENCES "OrderQcItemResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QcItemResultMediaAttachment" ADD CONSTRAINT "QcItemResultMediaAttachment_fileUploadId_fkey" FOREIGN KEY ("fileUploadId") REFERENCES "FileUpload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;