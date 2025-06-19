-- =============================================================================
-- TORVAN MEDICAL CLEANSTATION - SAMPLE DATA
-- =============================================================================
-- 
-- This file contains sample data for testing and development purposes.
-- Run this after the main seeding script for additional test data.
-- 
-- =============================================================================

-- Sample Orders for Testing
INSERT INTO "Order" (id, "poNumber", "buildNumbers", "customerName", "projectName", "salesPerson", "wantDate", notes, language, "orderStatus", "createdById") VALUES
('sample-order-001', 'PO-2024-001', ARRAY['001-A', '001-B'], 'General Hospital', 'Endoscopy Suite Upgrade', 'John Sales', '2024-07-15 00:00:00', 'Rush order for Q3 installation', 'EN', 'READY_FOR_PRE_QC', 'cmbp2oc4w0000tiffwp8aqqtk'),
('sample-order-002', 'PO-2024-002', ARRAY['002-A'], 'City Medical Center', 'SPD Renovation', 'Jane Sales', '2024-08-01 00:00:00', 'Standard delivery timeline', 'EN', 'ORDER_CREATED', 'cmbp2oc6o0001tiffzosjm48z'),
('sample-order-003', 'PO-2024-003', ARRAY['003-A', '003-B', '003-C'], 'University Hospital', 'New Facility Build', 'Bob Sales', '2024-09-15 00:00:00', 'Multi-sink installation', 'EN', 'READY_FOR_PRODUCTION', 'cmbp2oc4w0000tiffwp8aqqtk');

-- Sample Sink Configurations
INSERT INTO "SinkConfiguration" (id, "buildNumber", "sinkModelId", width, length, "legsTypeId", "feetTypeId", "workflowDirection", pegboard, "pegboardTypeId", "hasDrawersAndCompartments", "controlBoxId", "orderId") VALUES
('sink-config-001-a', '001-A', 'T2-BODY-61-72-HA', 72, 30, 'T2-DL27-KIT', 'T2-SEISMIC-FEET', 'LEFT_TO_RIGHT', true, 'T2-ADW-PB-7236', false, 'T2-CTRL-ESK2', 'sample-order-001'),
('sink-config-001-b', '001-B', 'T2-BODY-61-72-HA', 72, 30, 'T2-DL27-KIT', 'T2-SEISMIC-FEET', 'LEFT_TO_RIGHT', true, 'T2-ADW-PB-7236', false, 'T2-CTRL-EDR1', 'sample-order-001'),
('sink-config-002-a', '002-A', 'T2-BODY-48-60-HA', 60, 30, 'T2-DL14-KIT', 'T2-SEISMIC-FEET', 'RIGHT_TO_LEFT', false, NULL, true, 'T2-CTRL-ESK1', 'sample-order-002');

-- Sample Basin Configurations
INSERT INTO "BasinConfiguration" (id, "buildNumber", "basinTypeId", "basinSizePartNumber", "basinCount", "addonIds", "orderId") VALUES
('basin-config-001-a-1', '001-A', 'T2-BSN-ESK-KIT', 'T2-ADW-BASIN24X20X10', 1, ARRAY[]::TEXT[], 'sample-order-001'),
('basin-config-001-a-2', '001-A', 'T2-BSN-ESK-KIT', 'T2-ADW-BASIN24X20X10', 1, ARRAY[]::TEXT[], 'sample-order-001'),
('basin-config-001-b-1', '001-B', 'T2-BSN-EDR-KIT', 'T2-ADW-BASIN20X20X8', 1, ARRAY[]::TEXT[], 'sample-order-001'),
('basin-config-002-a-1', '002-A', 'T2-BSN-ESK-KIT', 'T2-ADW-BASIN30X20X10', 1, ARRAY[]::TEXT[], 'sample-order-002');

-- Sample Faucet Configurations
INSERT INTO "FaucetConfiguration" (id, "buildNumber", "faucetTypeId", "faucetQuantity", "faucetPlacement", "orderId") VALUES
('faucet-config-001-a-1', '001-A', 'B-0133-A10-B08', 1, 'BASIN_1', 'sample-order-001'),
('faucet-config-001-a-2', '001-A', 'B-2342-WB', 1, 'BASIN_2', 'sample-order-001'),
('faucet-config-001-b-1', '001-B', 'B-2342-WB', 1, 'BASIN_1', 'sample-order-001'),
('faucet-config-002-a-1', '002-A', 'B-0133-A10-B08', 1, 'BASIN_1', 'sample-order-002');

-- Sample Sprayer Configurations
INSERT INTO "SprayerConfiguration" (id, "buildNumber", "hasSpray", "sprayerTypeIds", "sprayerQuantity", "sprayerLocations", "orderId") VALUES
('sprayer-config-001-a', '001-A', true, ARRAY['DER-1899-14-CC'], 1, ARRAY['Center'], 'sample-order-001'),
('sprayer-config-002-a', '002-A', false, ARRAY[]::TEXT[], 0, ARRAY[]::TEXT[], 'sample-order-002');

-- Sample Order History Logs
INSERT INTO "OrderHistoryLog" (id, timestamp, action, "oldStatus", "newStatus", notes, "orderId", "userId") VALUES
('history-001-1', '2024-06-15 10:00:00', 'ORDER_CREATED', NULL, 'ORDER_CREATED', 'Order created from customer specification', 'sample-order-001', 'cmbp2oc4w0000tiffwp8aqqtk'),
('history-001-2', '2024-06-16 14:30:00', 'STATUS_CHANGE', 'ORDER_CREATED', 'READY_FOR_PRE_QC', 'All parts arrived, ready for QC inspection', 'sample-order-001', 'cmbp2oc6o0001tiffzosjm48z'),
('history-002-1', '2024-06-17 09:15:00', 'ORDER_CREATED', NULL, 'ORDER_CREATED', 'Standard order processing initiated', 'sample-order-002', 'cmbp2oc6o0001tiffzosjm48z'),
('history-003-1', '2024-06-18 11:45:00', 'ORDER_CREATED', NULL, 'ORDER_CREATED', 'Multi-sink project order created', 'sample-order-003', 'cmbp2oc4w0000tiffwp8aqqtk'),
('history-003-2', '2024-06-19 08:20:00', 'STATUS_CHANGE', 'ORDER_CREATED', 'READY_FOR_PRODUCTION', 'Pre-QC completed successfully', 'sample-order-003', 'cmbp2oc9y0003tiffyp5eeuzv');

-- Sample Associated Documents
INSERT INTO "AssociatedDocument" (id, "docName", "docURL", "uploadedBy", timestamp, "docType", "orderId") VALUES
('doc-001-1', 'PO-2024-001-CustomerSpecs.pdf', 'uploads/documents/po-2024-001-specs.pdf', 'John Sales', '2024-06-15 10:00:00', 'Purchase Order', 'sample-order-001'),
('doc-001-2', 'Drawing-EndoSuite-Layout.dwg', 'uploads/drawings/endo-suite-layout.dwg', 'Engineering', '2024-06-15 10:05:00', 'Technical Drawing', 'sample-order-001'),
('doc-002-1', 'PO-2024-002-Standard.pdf', 'uploads/documents/po-2024-002.pdf', 'Jane Sales', '2024-06-17 09:15:00', 'Purchase Order', 'sample-order-002'),
('doc-003-1', 'PO-2024-003-MultiSink.pdf', 'uploads/documents/po-2024-003.pdf', 'Bob Sales', '2024-06-18 11:45:00', 'Purchase Order', 'sample-order-003'),
('doc-003-2', 'Drawing-UniversityHospital-FloorPlan.pdf', 'uploads/drawings/university-hospital-plan.pdf', 'Engineering', '2024-06-18 12:00:00', 'Technical Drawing', 'sample-order-003');

-- Sample QC Results for Testing
INSERT INTO "OrderQcResult" (id, "orderId", "qcFormTemplateId", "qcPerformedById", "qcTimestamp", "overallStatus", notes) VALUES
('qc-result-003-1', 'sample-order-003', 'pre-production-check-mdrd', 'cmbp2oc9y0003tiffyp5eeuzv', '2024-06-19 08:00:00', 'PASSED', 'All pre-production checks completed successfully. Ready for production assembly.');

-- Sample Order Comments
INSERT INTO "OrderComment" (id, "orderId", "userId", content, "isInternal", priority, category, "isResolved", "createdAt") VALUES
('comment-001-1', 'sample-order-001', 'cmbp2oc6o0001tiffzosjm48z', 'Customer requested expedited delivery due to facility opening timeline', false, 'HIGH', 'SCHEDULING', false, '2024-06-15 10:30:00'),
('comment-001-2', 'sample-order-001', 'cmbp2oc9y0003tiffyp5eeuzv', 'Pre-QC inspection scheduled for June 16th. All parts have arrived.', true, 'NORMAL', 'QC', false, '2024-06-16 08:00:00'),
('comment-002-1', 'sample-order-002', 'cmbp2ocbj0004tiffkjn5c1pm', 'Standard assembly timeline applies. No special requirements noted.', true, 'NORMAL', 'PRODUCTION', false, '2024-06-17 14:00:00'),
('comment-003-1', 'sample-order-003', 'cmbp2oc9y0003tiffyp5eeuzv', 'Multi-sink project requires careful coordination of basin configurations', true, 'NORMAL', 'QC', true, '2024-06-18 16:00:00');

-- Sample Notifications
INSERT INTO "Notification" (id, message, "linkToOrder", "isRead", type, "createdAt", "recipientId") VALUES
('notif-001', 'Order PO-2024-001 is ready for Pre-QC inspection', 'sample-order-001', false, 'QC_APPROVAL_REQUIRED', '2024-06-16 08:00:00', 'cmbp2oc9y0003tiffyp5eeuzv'),
('notif-002', 'Order PO-2024-003 has completed Pre-QC and is ready for production', 'sample-order-003', false, 'ORDER_STATUS_CHANGE', '2024-06-19 08:30:00', 'cmbp2ocbj0004tiffkjn5c1pm'),
('notif-003', 'Rush order PO-2024-001 requires expedited processing', 'sample-order-001', false, 'DEADLINE_APPROACHING', '2024-06-15 15:00:00', 'cmbp2oc6o0001tiffzosjm48z');

-- Sample Tasks
INSERT INTO "Task" (id, "orderId", title, description, status, priority, "assignedToId", "estimatedMinutes", "buildNumber", "createdAt") VALUES
('task-001-1', 'sample-order-001', 'Basin Assembly - Build 001-A', 'Assemble E-Sink basins for build 001-A according to work instructions', 'PENDING', 'HIGH', 'cmbp2ocbj0004tiffkjn5c1pm', 120, '001-A', '2024-06-16 16:00:00'),
('task-001-2', 'sample-order-001', 'Basin Assembly - Build 001-B', 'Assemble E-Drain basin for build 001-B according to work instructions', 'PENDING', 'HIGH', 'cmbp2ocbj0004tiffkjn5c1pm', 90, '001-B', '2024-06-16 16:05:00'),
('task-003-1', 'sample-order-003', 'Frame Assembly - Build 003-A', 'Assemble main frame structure for build 003-A', 'COMPLETED', 'MEDIUM', 'cmbp2ocbj0004tiffkjn5c1pm', 180, '003-A', '2024-06-18 14:00:00'),
('task-003-2', 'sample-order-003', 'Electrical Installation - Build 003-A', 'Install control systems and wiring for E-Sink configuration', 'IN_PROGRESS', 'MEDIUM', 'cmbp2ocbj0004tiffkjn5c1pm', 240, '003-A', '2024-06-19 09:00:00');

-- Sample System Notifications
INSERT INTO "SystemNotification" (id, "userId", type, title, message, "isRead", priority, "createdAt") VALUES
('sys-notif-001', NULL, 'SYSTEM_ALERT', 'Scheduled Maintenance', 'Database maintenance scheduled for this weekend', false, 'NORMAL', '2024-06-15 12:00:00'),
('sys-notif-002', 'cmbp2oc8a0002tiffpyxs5pss', 'INVENTORY_LOW', 'Low Stock Alert', 'Several critical parts are running low on inventory', false, 'HIGH', '2024-06-16 09:00:00'),
('sys-notif-003', 'cmbp2oc6o0001tiffzosjm48z', 'DEADLINE_APPROACHING', 'Project Deadline', 'Order PO-2024-001 delivery deadline is approaching', false, 'HIGH', '2024-06-17 10:00:00');

-- Update sequences to prevent conflicts
-- Note: Adjust these values based on your actual data
SELECT setval(pg_get_serial_sequence('"AssemblyComponent"', 'id'), COALESCE(MAX(id), 1)) FROM "AssemblyComponent";

-- =============================================================================
-- SAMPLE DATA COMPLETE
-- =============================================================================

COMMENT ON SCHEMA public IS 'Sample data loaded for Torvan Medical CleanStation - includes test orders, configurations, and workflow data';