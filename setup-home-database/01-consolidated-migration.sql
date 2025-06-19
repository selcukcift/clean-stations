-- =============================================================================
-- TORVAN MEDICAL CLEANSTATION - COMPLETE DATABASE SCHEMA
-- =============================================================================
-- This file contains the complete database schema for the CleanStation 
-- production workflow application, including all enhancements and fixes.
-- 
-- Features included:
-- - Core data models (Parts, Assemblies, Users, Orders)
-- - QC system with media attachments
-- - Enhanced configuration models without unique constraints
-- - Revision tracking and custom attributes
-- - Task management and workflow templates
-- - Testing framework
-- - Complete indexing strategy
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types and enums
CREATE TYPE "PartType" AS ENUM ('COMPONENT', 'MATERIAL');
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "AssemblyType" AS ENUM ('SIMPLE', 'COMPLEX', 'SERVICE_PART', 'KIT');
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PRODUCTION_COORDINATOR', 'PROCUREMENT_SPECIALIST', 'QC_PERSON', 'ASSEMBLER', 'SERVICE_DEPARTMENT');
CREATE TYPE "OrderStatus" AS ENUM ('ORDER_CREATED', 'PARTS_SENT_WAITING_ARRIVAL', 'READY_FOR_PRE_QC', 'READY_FOR_PRODUCTION', 'TESTING_COMPLETE', 'PACKAGING_COMPLETE', 'READY_FOR_FINAL_QC', 'READY_FOR_SHIP', 'SHIPPED');
CREATE TYPE "QcItemType" AS ENUM ('PASS_FAIL', 'TEXT_INPUT', 'NUMERIC_INPUT', 'SINGLE_SELECT', 'MULTI_SELECT', 'DATE_INPUT', 'CHECKBOX');
CREATE TYPE "QcStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'REQUIRES_REVIEW');
CREATE TYPE "ServiceOrderStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ORDERED', 'RECEIVED');
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

-- =============================================================================
-- CORE DATA MODELS
-- =============================================================================

-- Categories and Subcategories
CREATE TABLE "Category" (
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("categoryId")
);

CREATE UNIQUE INDEX "Category_categoryId_key" ON "Category"("categoryId");

CREATE TABLE "Subcategory" (
    "subcategoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("subcategoryId")
);

CREATE UNIQUE INDEX "Subcategory_subcategoryId_key" ON "Subcategory"("subcategoryId");

-- Parts with enhanced attributes
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
    "customAttributes" JSONB,
    "manufacturerName" TEXT,
    "revision" TEXT NOT NULL DEFAULT '1',
    "unitOfMeasure" TEXT,

    CONSTRAINT "Part_pkey" PRIMARY KEY ("PartID")
);

CREATE UNIQUE INDEX "Part_PartID_key" ON "Part"("PartID");

-- Assemblies with enhanced attributes
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
    "customAttributes" JSONB,
    "isOrderable" BOOLEAN NOT NULL DEFAULT false,
    "revision" TEXT NOT NULL DEFAULT '1',

    CONSTRAINT "Assembly_pkey" PRIMARY KEY ("AssemblyID")
);

CREATE UNIQUE INDEX "Assembly_AssemblyID_key" ON "Assembly"("AssemblyID");

-- Assembly Components (BOM structure)
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

-- =============================================================================
-- USER MANAGEMENT
-- =============================================================================

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

-- =============================================================================
-- ORDER MANAGEMENT
-- =============================================================================

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

CREATE UNIQUE INDEX "Order_poNumber_key" ON "Order"("poNumber");

-- Configuration tables with indexes instead of unique constraints
CREATE TABLE "BasinConfiguration" (
    "id" TEXT NOT NULL,
    "buildNumber" TEXT NOT NULL,
    "basinTypeId" TEXT NOT NULL,
    "basinSizePartNumber" TEXT,
    "basinCount" INTEGER NOT NULL DEFAULT 1,
    "addonIds" TEXT[],
    "orderId" TEXT NOT NULL,
    "customDepth" DOUBLE PRECISION,
    "customLength" DOUBLE PRECISION,
    "customWidth" DOUBLE PRECISION,

    CONSTRAINT "BasinConfiguration_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BasinConfiguration_orderId_buildNumber_idx" ON "BasinConfiguration"("orderId", "buildNumber");

CREATE TABLE "FaucetConfiguration" (
    "id" TEXT NOT NULL,
    "buildNumber" TEXT NOT NULL,
    "faucetTypeId" TEXT NOT NULL,
    "faucetQuantity" INTEGER NOT NULL DEFAULT 1,
    "faucetPlacement" TEXT,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "FaucetConfiguration_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FaucetConfiguration_orderId_buildNumber_idx" ON "FaucetConfiguration"("orderId", "buildNumber");

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

CREATE INDEX "SprayerConfiguration_orderId_buildNumber_idx" ON "SprayerConfiguration"("orderId", "buildNumber");

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

CREATE INDEX "SinkConfiguration_orderId_buildNumber_idx" ON "SinkConfiguration"("orderId", "buildNumber");

CREATE TABLE "SelectedAccessory" (
    "id" TEXT NOT NULL,
    "buildNumber" TEXT NOT NULL,
    "assemblyId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "SelectedAccessory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SelectedAccessory_orderId_buildNumber_assemblyId_key" ON "SelectedAccessory"("orderId", "buildNumber", "assemblyId");

-- =============================================================================
-- QC SYSTEM WITH MEDIA ATTACHMENTS
-- =============================================================================

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
    "applicabilityCondition" TEXT,
    "defaultValue" TEXT,
    "notesPrompt" TEXT,
    "relatedAssemblyId" TEXT,
    "relatedPartNumber" TEXT,
    "repeatPer" TEXT,

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
    "externalJobId" TEXT,

    CONSTRAINT "OrderQcResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrderQcResult_orderId_qcFormTemplateId_key" ON "OrderQcResult"("orderId", "qcFormTemplateId");

CREATE TABLE "OrderQcItemResult" (
    "id" TEXT NOT NULL,
    "orderQcResultId" TEXT NOT NULL,
    "qcFormTemplateItemId" TEXT NOT NULL,
    "resultValue" TEXT,
    "isConformant" BOOLEAN,
    "notes" TEXT,
    "attachedDocumentId" TEXT,
    "isNotApplicable" BOOLEAN NOT NULL DEFAULT false,
    "repetitionInstanceKey" TEXT,

    CONSTRAINT "OrderQcItemResult_pkey" PRIMARY KEY ("id")
);

-- File Upload System
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

CREATE INDEX "FileUpload_uploadedById_createdAt_idx" ON "FileUpload"("uploadedById", "createdAt");

-- QC Media Attachments (multiple per checklist item)
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

-- =============================================================================
-- DOCUMENT MANAGEMENT
-- =============================================================================

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

-- =============================================================================
-- BOM MANAGEMENT
-- =============================================================================

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

-- =============================================================================
-- TASK MANAGEMENT
-- =============================================================================

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

CREATE UNIQUE INDEX "TaskTemplate_name_key" ON "TaskTemplate"("name");

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

CREATE UNIQUE INDEX "TaskTemplateStep_taskTemplateId_stepNumber_key" ON "TaskTemplateStep"("taskTemplateId", "stepNumber");
CREATE INDEX "TaskTemplateStep_taskTemplateId_stepNumber_idx" ON "TaskTemplateStep"("taskTemplateId", "stepNumber");

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
    "buildNumber" TEXT,
    "qcFormTemplateItemId" TEXT,
    "taskTemplateStepId" TEXT,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Task_orderId_status_idx" ON "Task"("orderId", "status");
CREATE INDEX "Task_assignedToId_status_idx" ON "Task"("assignedToId", "status");
CREATE INDEX "Task_status_priority_idx" ON "Task"("status", "priority");

-- =============================================================================
-- WORK INSTRUCTIONS
-- =============================================================================

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

CREATE UNIQUE INDEX "WorkInstructionStep_workInstructionId_stepNumber_key" ON "WorkInstructionStep"("workInstructionId", "stepNumber");
CREATE INDEX "WorkInstructionStep_workInstructionId_stepNumber_idx" ON "WorkInstructionStep"("workInstructionId", "stepNumber");

-- =============================================================================
-- TOOLS AND RESOURCES
-- =============================================================================

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

CREATE TABLE "TaskTool" (
    "id" TEXT NOT NULL,
    "taskId" TEXT,
    "stepId" TEXT,
    "toolId" TEXT NOT NULL,

    CONSTRAINT "TaskTool_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TaskTool_taskId_toolId_key" ON "TaskTool"("taskId", "toolId");
CREATE UNIQUE INDEX "TaskTool_stepId_toolId_key" ON "TaskTool"("stepId", "toolId");

CREATE TABLE "TaskTemplateStepTool" (
    "id" TEXT NOT NULL,
    "taskTemplateStepId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "TaskTemplateStepTool_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TaskTemplateStepTool_taskTemplateStepId_toolId_key" ON "TaskTemplateStepTool"("taskTemplateStepId", "toolId");

CREATE TABLE "TaskRequiredPart" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "isConsumed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TaskRequiredPart_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TaskRequiredPart_taskId_partId_key" ON "TaskRequiredPart"("taskId", "partId");

CREATE TABLE "TaskTemplateStepPart" (
    "id" TEXT NOT NULL,
    "taskTemplateStepId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,

    CONSTRAINT "TaskTemplateStepPart_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TaskTemplateStepPart_taskTemplateStepId_partId_key" ON "TaskTemplateStepPart"("taskTemplateStepId", "partId");

-- =============================================================================
-- TESTING FRAMEWORK
-- =============================================================================

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

CREATE UNIQUE INDEX "TestProcedureTemplate_name_key" ON "TestProcedureTemplate"("name");

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

CREATE UNIQUE INDEX "TestProcedureStepTemplate_testProcedureTemplateId_stepNumber_key" ON "TestProcedureStepTemplate"("testProcedureTemplateId", "stepNumber");
CREATE INDEX "TestProcedureStepTemplate_testProcedureTemplateId_stepNumber_idx" ON "TestProcedureStepTemplate"("testProcedureTemplateId", "stepNumber");

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

CREATE UNIQUE INDEX "OrderTestResult_orderId_buildNumber_testProcedureTemplateId_key" ON "OrderTestResult"("orderId", "buildNumber", "testProcedureTemplateId");
CREATE INDEX "OrderTestResult_orderId_buildNumber_idx" ON "OrderTestResult"("orderId", "buildNumber");

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

CREATE INDEX "OrderTestStepResult_orderTestResultId_idx" ON "OrderTestStepResult"("orderTestResultId");

-- =============================================================================
-- INVENTORY MANAGEMENT
-- =============================================================================

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
    "batchOrLotNumber" TEXT,
    "expirationDate" TIMESTAMP(3),
    "inventoryStatus" "InventoryStatus" NOT NULL DEFAULT 'AVAILABLE',
    "serialNumber" TEXT,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InventoryItem_partId_assemblyId_location_key" ON "InventoryItem"("partId", "assemblyId", "location");
CREATE INDEX "InventoryItem_partId_assemblyId_idx" ON "InventoryItem"("partId", "assemblyId");
CREATE INDEX "InventoryItem_serialNumber_idx" ON "InventoryItem"("serialNumber");

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

CREATE INDEX "InventoryTransaction_inventoryItemId_createdAt_idx" ON "InventoryTransaction"("inventoryItemId", "createdAt");

-- =============================================================================
-- SERVICE ORDERS
-- =============================================================================

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

-- =============================================================================
-- NOTIFICATIONS AND LOGGING
-- =============================================================================

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

CREATE INDEX "OrderComment_orderId_createdAt_idx" ON "OrderComment"("orderId", "createdAt");
CREATE INDEX "OrderComment_userId_createdAt_idx" ON "OrderComment"("userId", "createdAt");
CREATE INDEX "OrderComment_isResolved_priority_idx" ON "OrderComment"("isResolved", "priority");

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

CREATE INDEX "SystemNotification_userId_isRead_idx" ON "SystemNotification"("userId", "isRead");
CREATE INDEX "SystemNotification_type_createdAt_idx" ON "SystemNotification"("type", "createdAt");

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

CREATE UNIQUE INDEX "NotificationPreference_userId_notificationType_key" ON "NotificationPreference"("userId", "notificationType");
CREATE INDEX "NotificationPreference_userId_notificationType_idx" ON "NotificationPreference"("userId", "notificationType");

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

CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- =============================================================================
-- ADDITIONAL WORKFLOW TABLES
-- =============================================================================

CREATE TABLE "TaskDependency" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "dependsOnId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskDependency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TaskDependency_taskId_dependsOnId_key" ON "TaskDependency"("taskId", "dependsOnId");
CREATE INDEX "TaskDependency_taskId_dependsOnId_idx" ON "TaskDependency"("taskId", "dependsOnId");

CREATE TABLE "TaskNote" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TaskNote_taskId_createdAt_idx" ON "TaskNote"("taskId", "createdAt");

-- =============================================================================
-- FOREIGN KEY CONSTRAINTS
-- =============================================================================

-- Categories and Subcategories
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("categoryId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Assembly Structure
ALTER TABLE "AssemblyComponent" ADD CONSTRAINT "AssemblyComponent_parentAssemblyId_fkey" FOREIGN KEY ("parentAssemblyId") REFERENCES "Assembly"("AssemblyID") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssemblyComponent" ADD CONSTRAINT "AssemblyComponent_childPartId_fkey" FOREIGN KEY ("childPartId") REFERENCES "Part"("PartID") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssemblyComponent" ADD CONSTRAINT "AssemblyComponent_childAssemblyId_fkey" FOREIGN KEY ("childAssemblyId") REFERENCES "Assembly"("AssemblyID") ON DELETE SET NULL ON UPDATE CASCADE;

-- Orders and Configurations
ALTER TABLE "Order" ADD CONSTRAINT "Order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BasinConfiguration" ADD CONSTRAINT "BasinConfiguration_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FaucetConfiguration" ADD CONSTRAINT "FaucetConfiguration_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SprayerConfiguration" ADD CONSTRAINT "SprayerConfiguration_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SinkConfiguration" ADD CONSTRAINT "SinkConfiguration_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SelectedAccessory" ADD CONSTRAINT "SelectedAccessory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssociatedDocument" ADD CONSTRAINT "AssociatedDocument_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- BOM Management
ALTER TABLE "Bom" ADD CONSTRAINT "Bom_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BomItem" ADD CONSTRAINT "BomItem_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "Bom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BomItem" ADD CONSTRAINT "BomItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BomItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- QC System
ALTER TABLE "QcFormTemplateItem" ADD CONSTRAINT "QcFormTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "QcFormTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderQcResult" ADD CONSTRAINT "OrderQcResult_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderQcResult" ADD CONSTRAINT "OrderQcResult_qcFormTemplateId_fkey" FOREIGN KEY ("qcFormTemplateId") REFERENCES "QcFormTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderQcResult" ADD CONSTRAINT "OrderQcResult_qcPerformedById_fkey" FOREIGN KEY ("qcPerformedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderQcItemResult" ADD CONSTRAINT "OrderQcItemResult_orderQcResultId_fkey" FOREIGN KEY ("orderQcResultId") REFERENCES "OrderQcResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderQcItemResult" ADD CONSTRAINT "OrderQcItemResult_qcFormTemplateItemId_fkey" FOREIGN KEY ("qcFormTemplateItemId") REFERENCES "QcFormTemplateItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderQcItemResult" ADD CONSTRAINT "OrderQcItemResult_attachedDocumentId_fkey" FOREIGN KEY ("attachedDocumentId") REFERENCES "FileUpload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- File Uploads and Media
ALTER TABLE "FileUpload" ADD CONSTRAINT "FileUpload_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QcItemResultMediaAttachment" ADD CONSTRAINT "QcItemResultMediaAttachment_orderQcItemResultId_fkey" FOREIGN KEY ("orderQcItemResultId") REFERENCES "OrderQcItemResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QcItemResultMediaAttachment" ADD CONSTRAINT "QcItemResultMediaAttachment_fileUploadId_fkey" FOREIGN KEY ("fileUploadId") REFERENCES "FileUpload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Task Management
ALTER TABLE "TaskTemplateStep" ADD CONSTRAINT "TaskTemplateStep_taskTemplateId_fkey" FOREIGN KEY ("taskTemplateId") REFERENCES "TaskTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskTemplateStep" ADD CONSTRAINT "TaskTemplateStep_workInstructionId_fkey" FOREIGN KEY ("workInstructionId") REFERENCES "WorkInstruction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskTemplateStep" ADD CONSTRAINT "TaskTemplateStep_qcFormTemplateItemId_fkey" FOREIGN KEY ("qcFormTemplateItemId") REFERENCES "QcFormTemplateItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_workInstructionId_fkey" FOREIGN KEY ("workInstructionId") REFERENCES "WorkInstruction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_qcFormTemplateItemId_fkey" FOREIGN KEY ("qcFormTemplateItemId") REFERENCES "QcFormTemplateItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_taskTemplateStepId_fkey" FOREIGN KEY ("taskTemplateStepId") REFERENCES "TaskTemplateStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Work Instructions
ALTER TABLE "WorkInstructionStep" ADD CONSTRAINT "WorkInstructionStep_workInstructionId_fkey" FOREIGN KEY ("workInstructionId") REFERENCES "WorkInstruction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tools and Resources
ALTER TABLE "TaskTool" ADD CONSTRAINT "TaskTool_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskTool" ADD CONSTRAINT "TaskTool_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkInstructionStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskTool" ADD CONSTRAINT "TaskTool_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskTemplateStepTool" ADD CONSTRAINT "TaskTemplateStepTool_taskTemplateStepId_fkey" FOREIGN KEY ("taskTemplateStepId") REFERENCES "TaskTemplateStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskTemplateStepTool" ADD CONSTRAINT "TaskTemplateStepTool_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskRequiredPart" ADD CONSTRAINT "TaskRequiredPart_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskRequiredPart" ADD CONSTRAINT "TaskRequiredPart_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("PartID") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskTemplateStepPart" ADD CONSTRAINT "TaskTemplateStepPart_taskTemplateStepId_fkey" FOREIGN KEY ("taskTemplateStepId") REFERENCES "TaskTemplateStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskTemplateStepPart" ADD CONSTRAINT "TaskTemplateStepPart_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("PartID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Testing Framework
ALTER TABLE "TestProcedureStepTemplate" ADD CONSTRAINT "TestProcedureStepTemplate_testProcedureTemplateId_fkey" FOREIGN KEY ("testProcedureTemplateId") REFERENCES "TestProcedureTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderTestResult" ADD CONSTRAINT "OrderTestResult_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderTestResult" ADD CONSTRAINT "OrderTestResult_testProcedureTemplateId_fkey" FOREIGN KEY ("testProcedureTemplateId") REFERENCES "TestProcedureTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderTestResult" ADD CONSTRAINT "OrderTestResult_testedById_fkey" FOREIGN KEY ("testedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderTestStepResult" ADD CONSTRAINT "OrderTestStepResult_orderTestResultId_fkey" FOREIGN KEY ("orderTestResultId") REFERENCES "OrderTestResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderTestStepResult" ADD CONSTRAINT "OrderTestStepResult_testProcedureStepTemplateId_fkey" FOREIGN KEY ("testProcedureStepTemplateId") REFERENCES "TestProcedureStepTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderTestStepResult" ADD CONSTRAINT "OrderTestStepResult_fileUploadId_fkey" FOREIGN KEY ("fileUploadId") REFERENCES "FileUpload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Inventory Management
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("PartID") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Service Orders
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceOrderItem" ADD CONSTRAINT "ServiceOrderItem_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceOrderItem" ADD CONSTRAINT "ServiceOrderItem_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("PartID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Notifications and Logging
ALTER TABLE "OrderHistoryLog" ADD CONSTRAINT "OrderHistoryLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderHistoryLog" ADD CONSTRAINT "OrderHistoryLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderComment" ADD CONSTRAINT "OrderComment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderComment" ADD CONSTRAINT "OrderComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderComment" ADD CONSTRAINT "OrderComment_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_linkToOrder_fkey" FOREIGN KEY ("linkToOrder") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SystemNotification" ADD CONSTRAINT "SystemNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Workflow Dependencies
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskNote" ADD CONSTRAINT "TaskNote_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskNote" ADD CONSTRAINT "TaskNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

COMMENT ON DATABASE CURRENT_DATABASE IS 'Torvan Medical CleanStation Production Workflow Database - Complete Schema with Enhanced Features';