# Manual Migration and Seeding Guide

This guide provides step-by-step manual migration and seeding instructions for setting up the CleanStation database.

## 🗂️ Migration Order

Run these migrations in sequence in your PostgreSQL database:

### Migration 1: Initial Schema (20250531235152_init)
```sql
-- Initial core models
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE "PartType" AS ENUM ('COMPONENT', 'MATERIAL');
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "AssemblyType" AS ENUM ('SIMPLE', 'COMPLEX', 'SERVICE_PART', 'KIT');
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PRODUCTION_COORDINATOR', 'PROCUREMENT_SPECIALIST', 'QC_PERSON', 'ASSEMBLER', 'SERVICE_DEPARTMENT');
CREATE TYPE "OrderStatus" AS ENUM ('ORDER_CREATED', 'PARTS_SENT_WAITING_ARRIVAL', 'READY_FOR_PRE_QC', 'READY_FOR_PRODUCTION', 'TESTING_COMPLETE', 'PACKAGING_COMPLETE', 'READY_FOR_FINAL_QC', 'READY_FOR_SHIP', 'SHIPPED');
CREATE TYPE "QcItemType" AS ENUM ('PASS_FAIL', 'TEXT_INPUT', 'NUMERIC_INPUT', 'SINGLE_SELECT', 'MULTI_SELECT', 'DATE_INPUT', 'CHECKBOX');
CREATE TYPE "QcStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'REQUIRES_REVIEW');

-- Core tables
CREATE TABLE "Part" (
    "PartID" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturerPartNumber" TEXT,
    "type" "PartType" NOT NULL,
    "status" "Status" NOT NULL,
    "photoURL" TEXT,
    "technicalDrawingURL" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Part_pkey" PRIMARY KEY ("PartID")
);

CREATE TABLE "Assembly" (
    "AssemblyID" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AssemblyType" NOT NULL,
    "categoryCode" TEXT,
    "subcategoryCode" TEXT,
    "workInstructionId" TEXT,
    "qrData" TEXT,
    "kitComponentsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Assembly_pkey" PRIMARY KEY ("AssemblyID")
);

CREATE TABLE "AssemblyComponent" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentAssemblyId" TEXT NOT NULL,
    "childPartId" TEXT,
    "childAssemblyId" TEXT,
    CONSTRAINT "AssemblyComponent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Category" (
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("categoryId")
);

CREATE TABLE "Subcategory" (
    "subcategoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,
    CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("subcategoryId")
);

-- Indexes
CREATE UNIQUE INDEX "Part_PartID_key" ON "Part"("PartID");
CREATE UNIQUE INDEX "Assembly_AssemblyID_key" ON "Assembly"("AssemblyID");
CREATE UNIQUE INDEX "Category_categoryId_key" ON "Category"("categoryId");
CREATE UNIQUE INDEX "Subcategory_subcategoryId_key" ON "Subcategory"("subcategoryId");

-- Foreign Keys
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("categoryId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssemblyComponent" ADD CONSTRAINT "AssemblyComponent_parentAssemblyId_fkey" FOREIGN KEY ("parentAssemblyId") REFERENCES "Assembly"("AssemblyID") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssemblyComponent" ADD CONSTRAINT "AssemblyComponent_childPartId_fkey" FOREIGN KEY ("childPartId") REFERENCES "Part"("PartID") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssemblyComponent" ADD CONSTRAINT "AssemblyComponent_childAssemblyId_fkey" FOREIGN KEY ("childAssemblyId") REFERENCES "Assembly"("AssemblyID") ON DELETE SET NULL ON UPDATE CASCADE;
```

### Migration 2: User Authentication (20250601015552_add_user_authentication)
```sql
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "initials" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "lockedUntil" TIMESTAMP(3),
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "assignedTaskIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
```

### Migration 3: Order Management (20250601113956_add_order_management_models)
```sql
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "buildNumbers" TEXT[],
    "customerName" TEXT NOT NULL,
    "projectName" TEXT,
    "salesPerson" TEXT NOT NULL,
    "wantDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "language" TEXT NOT NULL DEFAULT 'EN',
    "orderStatus" "OrderStatus" NOT NULL DEFAULT 'ORDER_CREATED',
    "currentAssignee" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BasinConfiguration" (
    "id" TEXT NOT NULL,
    "buildNumber" TEXT NOT NULL,
    "basinTypeId" TEXT NOT NULL,
    "basinSizePartNumber" TEXT,
    "basinCount" INTEGER NOT NULL DEFAULT 1,
    "addonIds" TEXT[],
    "orderId" TEXT NOT NULL,
    CONSTRAINT "BasinConfiguration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FaucetConfiguration" (
    "id" TEXT NOT NULL,
    "buildNumber" TEXT NOT NULL,
    "faucetTypeId" TEXT NOT NULL,
    "faucetQuantity" INTEGER NOT NULL DEFAULT 1,
    "faucetPlacement" TEXT,
    "orderId" TEXT NOT NULL,
    CONSTRAINT "FaucetConfiguration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SprayerConfiguration" (
    "id" TEXT NOT NULL,
    "buildNumber" TEXT NOT NULL,
    "hasSpray" BOOLEAN NOT NULL DEFAULT false,
    "sprayerTypeIds" TEXT[],
    "sprayerQuantity" INTEGER NOT NULL DEFAULT 0,
    "sprayerLocations" TEXT[],
    "orderId" TEXT NOT NULL,
    CONSTRAINT "SprayerConfiguration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SelectedAccessory" (
    "id" TEXT NOT NULL,
    "buildNumber" TEXT NOT NULL,
    "assemblyId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "orderId" TEXT NOT NULL,
    CONSTRAINT "SelectedAccessory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssociatedDocument" (
    "id" TEXT NOT NULL,
    "docName" TEXT NOT NULL,
    "docURL" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "docType" TEXT,
    "orderId" TEXT NOT NULL,
    CONSTRAINT "AssociatedDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Bom" (
    "id" TEXT NOT NULL,
    "buildNumber" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" TEXT NOT NULL,
    CONSTRAINT "Bom_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BomItem" (
    "id" TEXT NOT NULL,
    "partIdOrAssemblyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "itemType" TEXT NOT NULL,
    "category" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "bomId" TEXT NOT NULL,
    CONSTRAINT "BomItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderHistoryLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "oldStatus" TEXT,
    "newStatus" TEXT,
    "notes" TEXT,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "OrderHistoryLog_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "Order_poNumber_key" ON "Order"("poNumber");
CREATE UNIQUE INDEX "FaucetConfiguration_orderId_buildNumber_key" ON "FaucetConfiguration"("orderId", "buildNumber");
CREATE UNIQUE INDEX "SprayerConfiguration_orderId_buildNumber_key" ON "SprayerConfiguration"("orderId", "buildNumber");
CREATE UNIQUE INDEX "BasinConfiguration_orderId_buildNumber_key" ON "BasinConfiguration"("orderId", "buildNumber");

-- Foreign Keys
ALTER TABLE "Order" ADD CONSTRAINT "Order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BasinConfiguration" ADD CONSTRAINT "BasinConfiguration_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FaucetConfiguration" ADD CONSTRAINT "FaucetConfiguration_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SprayerConfiguration" ADD CONSTRAINT "SprayerConfiguration_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SelectedAccessory" ADD CONSTRAINT "SelectedAccessory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssociatedDocument" ADD CONSTRAINT "AssociatedDocument_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Bom" ADD CONSTRAINT "Bom_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BomItem" ADD CONSTRAINT "BomItem_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "Bom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BomItem" ADD CONSTRAINT "BomItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BomItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderHistoryLog" ADD CONSTRAINT "OrderHistoryLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderHistoryLog" ADD CONSTRAINT "OrderHistoryLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

### Migration 4: QC System (20250602001555_add_qc_system_complete)
```sql
CREATE TABLE "QcFormTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "appliesToProductFamily" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "QcFormTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QcFormTemplateItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "checklistItem" TEXT NOT NULL,
    "itemType" "QcItemType" NOT NULL,
    "options" JSONB,
    "expectedValue" TEXT,
    "order" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "QcFormTemplateItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderQcResult" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "qcFormTemplateId" TEXT NOT NULL,
    "qcPerformedById" TEXT NOT NULL,
    "qcTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "overallStatus" "QcStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    CONSTRAINT "OrderQcResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderQcItemResult" (
    "id" TEXT NOT NULL,
    "orderQcResultId" TEXT NOT NULL,
    "qcFormTemplateItemId" TEXT NOT NULL,
    "resultValue" TEXT,
    "isConformant" BOOLEAN,
    "notes" TEXT,
    CONSTRAINT "OrderQcItemResult_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "OrderQcResult_orderId_qcFormTemplateId_key" ON "OrderQcResult"("orderId", "qcFormTemplateId");

-- Foreign Keys
ALTER TABLE "QcFormTemplateItem" ADD CONSTRAINT "QcFormTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "QcFormTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderQcResult" ADD CONSTRAINT "OrderQcResult_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderQcResult" ADD CONSTRAINT "OrderQcResult_qcFormTemplateId_fkey" FOREIGN KEY ("qcFormTemplateId") REFERENCES "QcFormTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderQcResult" ADD CONSTRAINT "OrderQcResult_qcPerformedById_fkey" FOREIGN KEY ("qcPerformedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderQcItemResult" ADD CONSTRAINT "OrderQcItemResult_orderQcResultId_fkey" FOREIGN KEY ("orderQcResultId") REFERENCES "OrderQcResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderQcItemResult" ADD CONSTRAINT "OrderQcItemResult_qcFormTemplateItemId_fkey" FOREIGN KEY ("qcFormTemplateItemId") REFERENCES "QcFormTemplateItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

### Migration 5: Service Orders (20250602175255_add_service_orders)
```sql
CREATE TYPE "ServiceOrderStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ORDERED', 'RECEIVED');

CREATE TABLE "ServiceOrder" (
    "id" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "requestTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ServiceOrderStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "notes" TEXT,
    "procurementNotes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServiceOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceOrderItem" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "quantityRequested" INTEGER NOT NULL,
    "quantityApproved" INTEGER,
    "notes" TEXT,
    CONSTRAINT "ServiceOrderItem_pkey" PRIMARY KEY ("id")
);

-- Foreign Keys
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceOrderItem" ADD CONSTRAINT "ServiceOrderItem_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceOrderItem" ADD CONSTRAINT "ServiceOrderItem_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("PartID") ON DELETE RESTRICT ON UPDATE CASCADE;
```

### Migration 6: Enhanced Features (20250605131341_add_enhanced_features)
```sql
-- Add enhanced columns to existing tables
ALTER TABLE "Part" ADD COLUMN "customAttributes" JSONB;
ALTER TABLE "Part" ADD COLUMN "manufacturerName" TEXT;
ALTER TABLE "Part" ADD COLUMN "revision" TEXT NOT NULL DEFAULT '1';
ALTER TABLE "Part" ADD COLUMN "unitOfMeasure" TEXT;

ALTER TABLE "Assembly" ADD COLUMN "customAttributes" JSONB;
ALTER TABLE "Assembly" ADD COLUMN "isOrderable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Assembly" ADD COLUMN "revision" TEXT NOT NULL DEFAULT '1';

ALTER TABLE "QcFormTemplateItem" ADD COLUMN "applicabilityCondition" TEXT;
ALTER TABLE "QcFormTemplateItem" ADD COLUMN "defaultValue" TEXT;
ALTER TABLE "QcFormTemplateItem" ADD COLUMN "notesPrompt" TEXT;
ALTER TABLE "QcFormTemplateItem" ADD COLUMN "relatedAssemblyId" TEXT;
ALTER TABLE "QcFormTemplateItem" ADD COLUMN "relatedPartNumber" TEXT;
ALTER TABLE "QcFormTemplateItem" ADD COLUMN "repeatPer" TEXT;

ALTER TABLE "OrderQcResult" ADD COLUMN "externalJobId" TEXT;

ALTER TABLE "OrderQcItemResult" ADD COLUMN "attachedDocumentId" TEXT;
ALTER TABLE "OrderQcItemResult" ADD COLUMN "isNotApplicable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrderQcItemResult" ADD COLUMN "repetitionInstanceKey" TEXT;

-- Create new tables
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED');
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "NotificationType" AS ENUM ('ORDER_STATUS_CHANGE', 'TASK_ASSIGNMENT', 'QC_APPROVAL_REQUIRED', 'ASSEMBLY_MILESTONE', 'SERVICE_REQUEST', 'SYSTEM_ALERT', 'INVENTORY_LOW', 'DEADLINE_APPROACHING');
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "NotificationFrequency" AS ENUM ('IMMEDIATE', 'HOURLY', 'DAILY', 'WEEKLY');
CREATE TYPE "OrderCommentPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "InventoryTransactionType" AS ENUM ('INCOMING', 'OUTGOING', 'ADJUSTMENT', 'RESERVED', 'RELEASED');
CREATE TYPE "InventoryStatus" AS ENUM ('AVAILABLE', 'NON_CONFORMING', 'IN_TRANSIT', 'RESERVED', 'DEFECTIVE');
CREATE TYPE "TestStepInputType" AS ENUM ('TEXT', 'NUMERIC', 'PASS_FAIL', 'SINGLE_SELECT', 'MULTI_SELECT', 'SCAN_SN', 'FILE_UPLOAD');
CREATE TYPE "TestStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED');

CREATE TABLE "WorkInstruction" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assemblyId" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "estimatedMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkInstruction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkInstructionStep" (
    "id" TEXT NOT NULL,
    "workInstructionId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedMinutes" INTEGER,
    "images" TEXT[],
    "videos" TEXT[],
    "checkpoints" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkInstructionStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Tool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Tool_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "workInstructionId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "assignedToId" TEXT,
    "estimatedMinutes" INTEGER,
    "actualMinutes" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SystemNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SystemNotification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FileUpload" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FileUpload_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "partId" TEXT,
    "assemblyId" TEXT,
    "location" TEXT,
    "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
    "quantityReserved" INTEGER NOT NULL DEFAULT 0,
    "quantityAvailable" INTEGER NOT NULL DEFAULT 0,
    "reorderPoint" INTEGER,
    "maxStock" INTEGER,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedById" TEXT NOT NULL,
    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryTransaction" (
    "id" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "type" "InventoryTransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "orderId" TEXT,
    "taskId" TEXT,
    "performedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "WorkInstructionStep_workInstructionId_stepNumber_key" ON "WorkInstructionStep"("workInstructionId", "stepNumber");
CREATE INDEX "WorkInstructionStep_workInstructionId_stepNumber_idx" ON "WorkInstructionStep"("workInstructionId", "stepNumber");
CREATE INDEX "Task_orderId_status_idx" ON "Task"("orderId", "status");
CREATE INDEX "Task_assignedToId_status_idx" ON "Task"("assignedToId", "status");
CREATE INDEX "Task_status_priority_idx" ON "Task"("status", "priority");
CREATE INDEX "SystemNotification_userId_isRead_idx" ON "SystemNotification"("userId", "isRead");
CREATE INDEX "SystemNotification_type_createdAt_idx" ON "SystemNotification"("type", "createdAt");
CREATE INDEX "FileUpload_uploadedById_createdAt_idx" ON "FileUpload"("uploadedById", "createdAt");
CREATE UNIQUE INDEX "InventoryItem_partId_assemblyId_location_key" ON "InventoryItem"("partId", "assemblyId", "location");
CREATE INDEX "InventoryItem_partId_assemblyId_idx" ON "InventoryItem"("partId", "assemblyId");
CREATE INDEX "InventoryTransaction_inventoryItemId_createdAt_idx" ON "InventoryTransaction"("inventoryItemId", "createdAt");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- Foreign Keys
ALTER TABLE "OrderQcItemResult" ADD CONSTRAINT "OrderQcItemResult_attachedDocumentId_fkey" FOREIGN KEY ("attachedDocumentId") REFERENCES "FileUpload"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkInstructionStep" ADD CONSTRAINT "WorkInstructionStep_workInstructionId_fkey" FOREIGN KEY ("workInstructionId") REFERENCES "WorkInstruction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_workInstructionId_fkey" FOREIGN KEY ("workInstructionId") REFERENCES "WorkInstruction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SystemNotification" ADD CONSTRAINT "SystemNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FileUpload" ADD CONSTRAINT "FileUpload_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("PartID") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

### Migration 7: Advanced Database Features (20250605135225_add_advanced_database_features)
```sql
-- This migration is minimal, just adds a comment
COMMENT ON DATABASE CURRENT_DATABASE IS 'Torvan Medical CleanStation Database - Enhanced with Advanced Features';
```

### Migration 8: Sink Configuration (20250605195249_add_sink_configuration)
```sql
CREATE TABLE "SinkConfiguration" (
    "id" TEXT NOT NULL,
    "buildNumber" TEXT NOT NULL,
    "sinkModelId" TEXT NOT NULL,
    "width" INTEGER,
    "length" INTEGER,
    "legsTypeId" TEXT,
    "feetTypeId" TEXT,
    "workflowDirection" TEXT,
    "pegboard" BOOLEAN NOT NULL DEFAULT false,
    "pegboardTypeId" TEXT,
    "pegboardColorId" TEXT,
    "hasDrawersAndCompartments" BOOLEAN NOT NULL DEFAULT false,
    "drawersAndCompartments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "controlBoxId" TEXT,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SinkConfiguration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SinkConfiguration_orderId_buildNumber_key" ON "SinkConfiguration"("orderId", "buildNumber");

ALTER TABLE "SinkConfiguration" ADD CONSTRAINT "SinkConfiguration_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

### Migration 9: Custom Basin Dimensions (20250606164501_add_custom_basin_dimensions)
```sql
ALTER TABLE "BasinConfiguration" ADD COLUMN "customDepth" DOUBLE PRECISION;
ALTER TABLE "BasinConfiguration" ADD COLUMN "customLength" DOUBLE PRECISION;
ALTER TABLE "BasinConfiguration" ADD COLUMN "customWidth" DOUBLE PRECISION;
```

### Migration 10: Comments and Notifications (20250611000000_add_order_comments_and_notifications)
```sql
CREATE TABLE "OrderComment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "priority" "OrderCommentPriority" NOT NULL DEFAULT 'NORMAL',
    "category" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "mentions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrderComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "linkToOrder" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipientId" TEXT NOT NULL,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationType" "NotificationType" NOT NULL,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "frequency" "NotificationFrequency" NOT NULL DEFAULT 'IMMEDIATE',
    "quietHoursStart" INTEGER,
    "quietHoursEnd" INTEGER,
    "emailAddress" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "OrderComment_orderId_createdAt_idx" ON "OrderComment"("orderId", "createdAt");
CREATE INDEX "OrderComment_userId_createdAt_idx" ON "OrderComment"("userId", "createdAt");
CREATE INDEX "OrderComment_isResolved_priority_idx" ON "OrderComment"("isResolved", "priority");
CREATE UNIQUE INDEX "NotificationPreference_userId_notificationType_key" ON "NotificationPreference"("userId", "notificationType");
CREATE INDEX "NotificationPreference_userId_notificationType_idx" ON "NotificationPreference"("userId", "notificationType");

-- Foreign Keys
ALTER TABLE "OrderComment" ADD CONSTRAINT "OrderComment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderComment" ADD CONSTRAINT "OrderComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderComment" ADD CONSTRAINT "OrderComment_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_linkToOrder_fkey" FOREIGN KEY ("linkToOrder") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### Migration 11: Fix Unique Constraints & Add Enhanced Features
```sql
-- Remove unique constraints that cause issues and replace with indexes
DROP INDEX IF EXISTS "FaucetConfiguration_orderId_buildNumber_key";
DROP INDEX IF EXISTS "SprayerConfiguration_orderId_buildNumber_key";
DROP INDEX IF EXISTS "BasinConfiguration_orderId_buildNumber_key";
DROP INDEX IF EXISTS "SinkConfiguration_orderId_buildNumber_key";

-- Add proper indexes instead
CREATE INDEX "FaucetConfiguration_orderId_buildNumber_idx" ON "FaucetConfiguration"("orderId", "buildNumber");
CREATE INDEX "SprayerConfiguration_orderId_buildNumber_idx" ON "SprayerConfiguration"("orderId", "buildNumber");
CREATE INDEX "BasinConfiguration_orderId_buildNumber_idx" ON "BasinConfiguration"("orderId", "buildNumber");
CREATE INDEX "SinkConfiguration_orderId_buildNumber_idx" ON "SinkConfiguration"("orderId", "buildNumber");

-- Add missing enhanced features for QC media attachments
CREATE TABLE "QcItemResultMediaAttachment" (
    "id" TEXT NOT NULL,
    "orderQcItemResultId" TEXT NOT NULL,
    "fileUploadId" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QcItemResultMediaAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QcItemResultMediaAttachment_orderQcItemResultId_idx" ON "QcItemResultMediaAttachment"("orderQcItemResultId");
CREATE INDEX "QcItemResultMediaAttachment_fileUploadId_idx" ON "QcItemResultMediaAttachment"("fileUploadId");

ALTER TABLE "QcItemResultMediaAttachment" ADD CONSTRAINT "QcItemResultMediaAttachment_orderQcItemResultId_fkey" FOREIGN KEY ("orderQcItemResultId") REFERENCES "OrderQcItemResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QcItemResultMediaAttachment" ADD CONSTRAINT "QcItemResultMediaAttachment_fileUploadId_fkey" FOREIGN KEY ("fileUploadId") REFERENCES "FileUpload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add missing inventory columns
ALTER TABLE "InventoryItem" ADD COLUMN "batchOrLotNumber" TEXT;
ALTER TABLE "InventoryItem" ADD COLUMN "expirationDate" TIMESTAMP(3);
ALTER TABLE "InventoryItem" ADD COLUMN "inventoryStatus" "InventoryStatus" NOT NULL DEFAULT 'AVAILABLE';
ALTER TABLE "InventoryItem" ADD COLUMN "serialNumber" TEXT;

CREATE INDEX "InventoryItem_serialNumber_idx" ON "InventoryItem"("serialNumber");

-- Add missing Task enhancements
ALTER TABLE "Task" ADD COLUMN "buildNumber" TEXT;
ALTER TABLE "Task" ADD COLUMN "qcFormTemplateItemId" TEXT;
ALTER TABLE "Task" ADD COLUMN "taskTemplateStepId" TEXT;

-- Add task templates and related tables
CREATE TABLE "TaskTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "appliesToAssemblyType" "AssemblyType",
    "appliesToProductFamily" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TaskTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskTemplateStep" (
    "id" TEXT NOT NULL,
    "taskTemplateId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "estimatedMinutes" INTEGER,
    "workInstructionId" TEXT,
    "qcFormTemplateItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TaskTemplateStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskTool" (
    "id" TEXT NOT NULL,
    "taskId" TEXT,
    "stepId" TEXT,
    "toolId" TEXT NOT NULL,
    CONSTRAINT "TaskTool_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskRequiredPart" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "isConsumed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "TaskRequiredPart_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskTemplateStepTool" (
    "id" TEXT NOT NULL,
    "taskTemplateStepId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "TaskTemplateStepTool_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskTemplateStepPart" (
    "id" TEXT NOT NULL,
    "taskTemplateStepId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    CONSTRAINT "TaskTemplateStepPart_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskDependency" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "dependsOnId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskDependency_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskNote" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskNote_pkey" PRIMARY KEY ("id")
);

-- Add testing framework
CREATE TABLE "TestProcedureTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "productFamily" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "estimatedDurationMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TestProcedureTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TestProcedureStepTemplate" (
    "id" TEXT NOT NULL,
    "testProcedureTemplateId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "expectedOutcome" TEXT,
    "inputDataType" "TestStepInputType" NOT NULL,
    "numericUnit" TEXT,
    "numericLowerLimit" DOUBLE PRECISION,
    "numericUpperLimit" DOUBLE PRECISION,
    "options" JSONB,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "repeatPerInstance" TEXT,
    "linkedCalibrationEquipmentTypeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TestProcedureStepTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderTestResult" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "buildNumber" TEXT NOT NULL,
    "testProcedureTemplateId" TEXT NOT NULL,
    "testedById" TEXT NOT NULL,
    "overallStatus" "TestStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrderTestResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderTestStepResult" (
    "id" TEXT NOT NULL,
    "orderTestResultId" TEXT NOT NULL,
    "testProcedureStepTemplateId" TEXT NOT NULL,
    "instanceKey" TEXT,
    "stringValue" TEXT,
    "numericValue" DOUBLE PRECISION,
    "passFailValue" BOOLEAN,
    "fileUploadId" TEXT,
    "isConformant" BOOLEAN,
    "notes" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calibrationData" TEXT,
    CONSTRAINT "OrderTestStepResult_pkey" PRIMARY KEY ("id")
);

-- Add all necessary indexes
CREATE UNIQUE INDEX "TaskTemplate_name_key" ON "TaskTemplate"("name");
CREATE UNIQUE INDEX "TaskTemplateStep_taskTemplateId_stepNumber_key" ON "TaskTemplateStep"("taskTemplateId", "stepNumber");
CREATE INDEX "TaskTemplateStep_taskTemplateId_stepNumber_idx" ON "TaskTemplateStep"("taskTemplateId", "stepNumber");
CREATE UNIQUE INDEX "TaskTool_taskId_toolId_key" ON "TaskTool"("taskId", "toolId");
CREATE UNIQUE INDEX "TaskTool_stepId_toolId_key" ON "TaskTool"("stepId", "toolId");
CREATE UNIQUE INDEX "TaskRequiredPart_taskId_partId_key" ON "TaskRequiredPart"("taskId", "partId");
CREATE UNIQUE INDEX "TaskTemplateStepTool_taskTemplateStepId_toolId_key" ON "TaskTemplateStepTool"("taskTemplateStepId", "toolId");
CREATE UNIQUE INDEX "TaskTemplateStepPart_taskTemplateStepId_partId_key" ON "TaskTemplateStepPart"("taskTemplateStepId", "partId");
CREATE UNIQUE INDEX "TaskDependency_taskId_dependsOnId_key" ON "TaskDependency"("taskId", "dependsOnId");
CREATE INDEX "TaskDependency_taskId_dependsOnId_idx" ON "TaskDependency"("taskId", "dependsOnId");
CREATE INDEX "TaskNote_taskId_createdAt_idx" ON "TaskNote"("taskId", "createdAt");
CREATE UNIQUE INDEX "TestProcedureTemplate_name_key" ON "TestProcedureTemplate"("name");
CREATE UNIQUE INDEX "TestProcedureStepTemplate_testProcedureTemplateId_stepNumber_key" ON "TestProcedureStepTemplate"("testProcedureTemplateId", "stepNumber");
CREATE INDEX "TestProcedureStepTemplate_testProcedureTemplateId_stepNumber_idx" ON "TestProcedureStepTemplate"("testProcedureTemplateId", "stepNumber");
CREATE UNIQUE INDEX "OrderTestResult_orderId_buildNumber_testProcedureTemplateId_key" ON "OrderTestResult"("orderId", "buildNumber", "testProcedureTemplateId");
CREATE INDEX "OrderTestResult_orderId_buildNumber_idx" ON "OrderTestResult"("orderId", "buildNumber");
CREATE INDEX "OrderTestStepResult_orderTestResultId_idx" ON "OrderTestStepResult"("orderTestResultId");
CREATE UNIQUE INDEX "SelectedAccessory_orderId_buildNumber_assemblyId_key" ON "SelectedAccessory"("orderId", "buildNumber", "assemblyId");

-- Add all foreign key constraints
ALTER TABLE "Task" ADD CONSTRAINT "Task_qcFormTemplateItemId_fkey" FOREIGN KEY ("qcFormTemplateItemId") REFERENCES "QcFormTemplateItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_taskTemplateStepId_fkey" FOREIGN KEY ("taskTemplateStepId") REFERENCES "TaskTemplateStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskTemplateStep" ADD CONSTRAINT "TaskTemplateStep_taskTemplateId_fkey" FOREIGN KEY ("taskTemplateId") REFERENCES "TaskTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskTemplateStep" ADD CONSTRAINT "TaskTemplateStep_workInstructionId_fkey" FOREIGN KEY ("workInstructionId") REFERENCES "WorkInstruction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskTemplateStep" ADD CONSTRAINT "TaskTemplateStep_qcFormTemplateItemId_fkey" FOREIGN KEY ("qcFormTemplateItemId") REFERENCES "QcFormTemplateItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskTool" ADD CONSTRAINT "TaskTool_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskTool" ADD CONSTRAINT "TaskTool_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkInstructionStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskTool" ADD CONSTRAINT "TaskTool_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskRequiredPart" ADD CONSTRAINT "TaskRequiredPart_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskRequiredPart" ADD CONSTRAINT "TaskRequiredPart_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("PartID") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskTemplateStepTool" ADD CONSTRAINT "TaskTemplateStepTool_taskTemplateStepId_fkey" FOREIGN KEY ("taskTemplateStepId") REFERENCES "TaskTemplateStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskTemplateStepTool" ADD CONSTRAINT "TaskTemplateStepTool_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskTemplateStepPart" ADD CONSTRAINT "TaskTemplateStepPart_taskTemplateStepId_fkey" FOREIGN KEY ("taskTemplateStepId") REFERENCES "TaskTemplateStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskTemplateStepPart" ADD CONSTRAINT "TaskTemplateStepPart_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("PartID") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskNote" ADD CONSTRAINT "TaskNote_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskNote" ADD CONSTRAINT "TaskNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TestProcedureStepTemplate" ADD CONSTRAINT "TestProcedureStepTemplate_testProcedureTemplateId_fkey" FOREIGN KEY ("testProcedureTemplateId") REFERENCES "TestProcedureTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderTestResult" ADD CONSTRAINT "OrderTestResult_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderTestResult" ADD CONSTRAINT "OrderTestResult_testProcedureTemplateId_fkey" FOREIGN KEY ("testProcedureTemplateId") REFERENCES "TestProcedureTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderTestResult" ADD CONSTRAINT "OrderTestResult_testedById_fkey" FOREIGN KEY ("testedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderTestStepResult" ADD CONSTRAINT "OrderTestStepResult_orderTestResultId_fkey" FOREIGN KEY ("orderTestResultId") REFERENCES "OrderTestResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderTestStepResult" ADD CONSTRAINT "OrderTestStepResult_testProcedureStepTemplateId_fkey" FOREIGN KEY ("testProcedureStepTemplateId") REFERENCES "TestProcedureStepTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderTestStepResult" ADD CONSTRAINT "OrderTestStepResult_fileUploadId_fkey" FOREIGN KEY ("fileUploadId") REFERENCES "FileUpload"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

## 📜 Seed Scripts Order

After running all migrations, run these seed scripts in order:

### 1. Basic Data Seed (Node.js script)
Save this as `seed-basic.js` and run with `node seed-basic.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding basic data...');
  
  // Create users
  const users = [
    { username: 'admin', email: 'admin@torvan.local', fullName: 'System Admin', role: 'ADMIN', initials: 'SA' },
    { username: 'coordinator', email: 'coordinator@torvan.local', fullName: 'Production Coordinator', role: 'PRODUCTION_COORDINATOR', initials: 'PC' },
    { username: 'qc', email: 'qc@torvan.local', fullName: 'Quality Control', role: 'QC_PERSON', initials: 'QC' },
    { username: 'assembler', email: 'assembler@torvan.local', fullName: 'Assembler', role: 'ASSEMBLER', initials: 'AS' },
    { username: 'assembler1', email: 'assembler1@torvan.local', fullName: 'Production Assembler 1', role: 'ASSEMBLER', initials: 'PA1' },
    { username: 'assembler2', email: 'assembler2@torvan.local', fullName: 'Production Assembler 2', role: 'ASSEMBLER', initials: 'PA2' },
    { username: 'procurement', email: 'procurement@torvan.local', fullName: 'Procurement Specialist', role: 'PROCUREMENT_SPECIALIST', initials: 'PS' },
    { username: 'service', email: 'service@torvan.local', fullName: 'Service Department', role: 'SERVICE_DEPARTMENT', initials: 'SD' }
  ];
  
  const defaultPassword = 'password123';
  
  for (const userData of users) {
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    await prisma.user.upsert({
      where: { username: userData.username },
      update: {},
      create: {
        ...userData,
        passwordHash
      }
    });
    console.log(`✅ User: ${userData.username}`);
  }
  
  // Create categories
  const categories = [
    { categoryId: '718', name: 'CONTROL BOX', description: 'Category for control box' },
    { categoryId: '719', name: 'SERVICE PARTS', description: 'Category for service parts' },
    { categoryId: '720', name: 'ACCESSORY LIST', description: 'Category for accessories' },
    { categoryId: '721', name: 'SINK BODY', description: 'Category for sink bodies' },
    { categoryId: '722', name: 'BASIN', description: 'Category for basins' },
    { categoryId: '723', name: 'PEGBOARD', description: 'Category for pegboards' }
  ];
  
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { categoryId: cat.categoryId },
      update: {},
      create: cat
    });
    console.log(`✅ Category: ${cat.name}`);
  }
  
  console.log('🎉 Basic seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 2. QC Templates Seed (Node.js script)
Save this as `seed-qc.js` and run with `node seed-qc.js`:

```javascript
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('📋 Seeding QC Templates...');
  
  // Clear existing QC data
  await prisma.qcFormTemplateItem.deleteMany({});
  await prisma.qcFormTemplate.deleteMany({});
  
  // Create Pre-Production Check template
  const preQcTemplate = await prisma.qcFormTemplate.create({
    data: {
      id: 'pre-production-check-mdrd',
      name: 'Pre-Production Check MDRD Sink',
      version: '1.0',
      description: 'Pre-production quality control checklist for MDRD sinks based on CLP.T2.001.V01',
      isActive: true,
      appliesToProductFamily: 'MDRD_SINK'
    }
  });
  
  console.log('✅ Created QC template: Pre-Production Check MDRD Sink');
  
  // Create comprehensive checklist items
  const checklistItems = [
    // Documentation
    { section: 'Documentation', checklistItem: 'Verify PO number matches work order', itemType: 'PASS_FAIL', order: 1, isRequired: true },
    { section: 'Documentation', checklistItem: 'Confirm customer specifications in work packet', itemType: 'PASS_FAIL', order: 2, isRequired: true },
    { section: 'Documentation', checklistItem: 'Review technical drawings for accuracy', itemType: 'PASS_FAIL', order: 3, isRequired: true, notesPrompt: 'Note any discrepancies or clarifications needed' },
    
    // Frame Assembly
    { section: 'Frame Assembly', checklistItem: 'Inspect frame for welding quality and completeness', itemType: 'PASS_FAIL', order: 4, isRequired: true, notesPrompt: 'Document any weld defects or rework needed' },
    { section: 'Frame Assembly', checklistItem: 'Verify frame dimensions match specifications', itemType: 'NUMERIC_INPUT', order: 5, isRequired: true, expectedValue: 'As per drawing', notesPrompt: 'Record actual measurements' },
    { section: 'Frame Assembly', checklistItem: 'Check frame levelness and squareness', itemType: 'PASS_FAIL', order: 6, isRequired: true },
    
    // Basin Quality
    { section: 'Basin Quality', checklistItem: 'Inspect basin surface finish and cleanliness', itemType: 'PASS_FAIL', order: 7, isRequired: true, repeatPer: 'basin', notesPrompt: 'Note any scratches, stains, or surface defects' },
    { section: 'Basin Quality', checklistItem: 'Verify basin drain hole alignment', itemType: 'PASS_FAIL', order: 8, isRequired: true, repeatPer: 'basin' },
    { section: 'Basin Quality', checklistItem: 'Check basin overflow sensor ports', itemType: 'PASS_FAIL', order: 9, isRequired: true, repeatPer: 'basin', applicabilityCondition: 'E_SINK or E_DRAIN' },
    { section: 'Basin Quality', checklistItem: 'Test basin bottom fill connections', itemType: 'PASS_FAIL', order: 10, isRequired: true, repeatPer: 'basin', applicabilityCondition: 'E_SINK' },
    
    // Plumbing
    { section: 'Plumbing', checklistItem: 'Verify all water connections are secure', itemType: 'PASS_FAIL', order: 11, isRequired: true },
    { section: 'Plumbing', checklistItem: 'Check drain hose routing and connections', itemType: 'PASS_FAIL', order: 12, isRequired: true },
    { section: 'Plumbing', checklistItem: 'Test water pressure and flow', itemType: 'NUMERIC_INPUT', order: 13, isRequired: true, expectedValue: '40-60 PSI', notesPrompt: 'Record actual pressure reading' },
    
    // Electrical
    { section: 'Electrical', checklistItem: 'Inspect electrical panel installation', itemType: 'PASS_FAIL', order: 14, isRequired: true, applicabilityCondition: 'E_SINK or E_DRAIN' },
    { section: 'Electrical', checklistItem: 'Verify all cable connections and routing', itemType: 'PASS_FAIL', order: 15, isRequired: true, applicabilityCondition: 'E_SINK or E_DRAIN' },
    { section: 'Electrical', checklistItem: 'Test emergency stop functionality', itemType: 'PASS_FAIL', order: 16, isRequired: true, applicabilityCondition: 'E_SINK' },
    { section: 'Electrical', checklistItem: 'Check touchscreen operation and calibration', itemType: 'PASS_FAIL', order: 17, isRequired: true, applicabilityCondition: 'E_SINK' },
    
    // Height Adjustment
    { section: 'Height Adjustment', checklistItem: 'Test height adjustment mechanism operation', itemType: 'PASS_FAIL', order: 18, isRequired: false, applicabilityCondition: 'height_adjustable' },
    { section: 'Height Adjustment', checklistItem: 'Verify height adjustment range', itemType: 'NUMERIC_INPUT', order: 19, isRequired: false, applicabilityCondition: 'height_adjustable', expectedValue: '34-44 inches', notesPrompt: 'Record min and max heights achieved' },
    
    // Accessories
    { section: 'Accessories', checklistItem: 'Check pegboard mounting and stability', itemType: 'PASS_FAIL', order: 20, isRequired: false, applicabilityCondition: 'has_pegboard' },
    { section: 'Accessories', checklistItem: 'Verify accessory mounting points', itemType: 'PASS_FAIL', order: 21, isRequired: false, applicabilityCondition: 'has_accessories' },
    { section: 'Accessories', checklistItem: 'Test overhead lighting functionality', itemType: 'PASS_FAIL', order: 22, isRequired: false, applicabilityCondition: 'has_overhead_light' },
    
    // Final Inspection
    { section: 'Final Inspection', checklistItem: 'Overall assembly completeness check', itemType: 'PASS_FAIL', order: 23, isRequired: true },
    { section: 'Final Inspection', checklistItem: 'Verify all fasteners are properly tightened', itemType: 'PASS_FAIL', order: 24, isRequired: true },
    { section: 'Final Inspection', checklistItem: 'Check for any sharp edges or safety hazards', itemType: 'PASS_FAIL', order: 25, isRequired: true },
    { section: 'Final Inspection', checklistItem: 'Confirm all protective films and coverings removed', itemType: 'PASS_FAIL', order: 26, isRequired: true },
    
    // Documentation
    { section: 'Documentation', checklistItem: 'QC inspector signature and date', itemType: 'TEXT_INPUT', order: 27, isRequired: true },
    { section: 'Documentation', checklistItem: 'Overall Pre-QC result', itemType: 'SINGLE_SELECT', order: 28, isRequired: true, options: JSON.stringify(['PASS', 'FAIL', 'CONDITIONAL_PASS']) },
    { section: 'Documentation', checklistItem: 'Additional notes or observations', itemType: 'TEXT_INPUT', order: 29, isRequired: false, notesPrompt: 'Document any additional observations, recommendations, or follow-up actions required' }
  ];
  
  // Create all checklist items
  for (const item of checklistItems) {
    await prisma.qcFormTemplateItem.create({
      data: {
        templateId: preQcTemplate.id,
        section: item.section,
        checklistItem: item.checklistItem,
        itemType: item.itemType,
        options: item.options || null,
        expectedValue: item.expectedValue || null,
        order: item.order,
        isRequired: item.isRequired,
        applicabilityCondition: item.applicabilityCondition || null,
        notesPrompt: item.notesPrompt || null,
        repeatPer: item.repeatPer || null
      }
    });
  }
  
  console.log(`✅ Created ${checklistItems.length} QC checklist items`);
  console.log('🎉 QC Templates seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 3. Sample Data (SQL)
Run this SQL to add sample orders and test data:

```sql
-- Sample orders for testing
INSERT INTO "Order" (id, "poNumber", "buildNumbers", "customerName", "projectName", "salesPerson", "wantDate", notes, language, "orderStatus", "createdById") VALUES
('sample-order-001', 'PO-2024-001', ARRAY['001-A', '001-B'], 'General Hospital', 'Endoscopy Suite Upgrade', 'John Sales', '2024-07-15 00:00:00', 'Rush order for Q3 installation', 'EN', 'READY_FOR_PRE_QC', (SELECT id FROM "User" WHERE username = 'admin' LIMIT 1));

-- Sample configurations
INSERT INTO "SinkConfiguration" (id, "buildNumber", "sinkModelId", width, length, "legsTypeId", "feetTypeId", "workflowDirection", pegboard, "orderId") VALUES
('sink-config-001-a', '001-A', 'T2-BODY-61-72-HA', 72, 30, 'T2-DL27-KIT', 'T2-SEISMIC-FEET', 'LEFT_TO_RIGHT', true, 'sample-order-001');

INSERT INTO "BasinConfiguration" (id, "buildNumber", "basinTypeId", "basinSizePartNumber", "basinCount", "addonIds", "orderId") VALUES
('basin-config-001-a-1', '001-A', 'T2-BSN-ESK-KIT', 'T2-ADW-BASIN24X20X10', 1, ARRAY[]::TEXT[], 'sample-order-001');

INSERT INTO "FaucetConfiguration" (id, "buildNumber", "faucetTypeId", "faucetQuantity", "faucetPlacement", "orderId") VALUES
('faucet-config-001-a-1', '001-A', 'B-0133-A10-B08', 1, 'BASIN_1', 'sample-order-001');
```

## 🔧 Summary

This gives you the complete manual migration path:

1. **Run 11 SQL migrations in sequence** (from migration 1 to 11)
2. **Run basic data seed** (users, categories)  
3. **Run QC templates seed** (comprehensive Pre-QC checklist)
4. **Run sample data SQL** (test orders)

All the fixes are included:
- ✅ Unique constraints removed and replaced with indexes
- ✅ Revision columns added to Part and Assembly
- ✅ QC media attachment system
- ✅ Enhanced QC templates with conditional items and basin repetition
- ✅ Complete foreign key relationships

This approach gives you full control over each step and allows you to troubleshoot any issues during the migration process.