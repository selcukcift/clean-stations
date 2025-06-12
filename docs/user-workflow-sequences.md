# User Workflow Sequences (Up to Pre-QC Stage)

This document outlines the typical workflow sequences for different user roles involved in the Torvan Medical CleanStation production process, up to the Pre-QC stage. These flows are based on the Product Requirements Document (PRD) v1.1 and the Workflow Fluency Analysis Report (Jan 6, 2025).

## 1. Production Coordinator Workflow

The Production Coordinator initiates and configures new production orders.

1.  **Login & Dashboard Access:**
    *   The Production Coordinator logs into the system using their credentials.
    *   They are presented with the "Production Coordinator Dashboard," which provides an overview of orders, statistics, workflow tracking, and access to create new orders (as per Fluency Report).

2.  **Initiate New Production Order (5-Step Wizard - PRD UC 1.1):**
    *   The Coordinator starts the 5-step order creation wizard.
    *   **Step 1: Customer & Order Information:**
        *   Enters PO Number, Customer Name, Project Name (optional), Sales Person.
        *   Selects a Desired Delivery Date (must be in the future).
        *   Uploads the PO Document.
        *   Adds any general Notes.
        *   Selects Document Language (EN, FR, SP) for manuals.
        *   The system validates inputs at each step (as per Fluency Report).
    *   **Step 2: Sink Selection & Quantity:**
        *   Selects Sink Family (MDRD, as Endoscope/InstroSink lead to "Under Construction" pages - PRD UC 1.1).
        *   Enters the quantity of sinks for the order.
        *   For each sink, assigns a Unique Build Number.
    *   **Step 3: Sink Configuration (Repeated for each Unique Build Number):**
        *   The system guides the Coordinator through configuring each sink.
        *   **Sink Body Configuration:** Selects Sink Model, enters Dimensions (Width, Length), Leg Type, Feet Type. Selects Pegboard options (Yes/No, Color, Type, Size - auto or custom), and Workflow Direction. The UI provides real-time feedback, e.g., for sink length validation (as per Fluency Report's "Advanced Business Logic").
        *   **Basin Configuration (Repeated per basin):** Selects Basin Type, Size (standard or custom), and Basin Add-ons (e.g., P-TRAP, Basin Light).
        *   **Faucet Configuration:** Selects Faucet Type (auto-selected for E-Sink DI), Quantity, Placement. Selects Sprayer options if needed (Type, Quantity, Location).
    *   **Step 4: Add-on Accessories:**
        *   Browses a library of available accessories.
        *   Selects desired accessories and specifies quantities.
    *   **Step 5: Review and Submit:**
        *   The system displays a summary of the entire order, including customer info, all configured sinks, and a preliminary Bill of Materials (BOM) for each sink (real-time BOM preview as per Fluency Report).
        *   The Coordinator can navigate back to edit previous steps.
        *   Upon submission, the order is created with "Order Created" status.

3.  **Order Management (PRD UC 1.2):**
    *   From their dashboard, the Coordinator can view a list of all production orders.
    *   The list displays current status, PO number, customer name, and want date.
    *   They can filter, sort, and search this list (as per Fluency Report's "comprehensive search, filtering, and bulk operations").
    *   Clicking an order shows full details, including configurations, BOMs, associated documents, and history (OrderHistoryLog as per Fluency Report).

4.  **Status Update (PRD UC 1.3):**
    *   (Later in the overall workflow, beyond Pre-QC scope for other roles) The Production Coordinator can update the status of an order to "Shipped."

## 2. Procurement Specialist Workflow

The Procurement Specialist reviews orders, manages BOMs and outsourcing, and updates statuses.

1.  **Login & Dashboard Access:**
    *   The Procurement Specialist logs into the system.
    *   They access the "Procurement Specialist Dashboard," which features a tabbed interface for different responsibilities, including BOM review, outsourcing management, and service requests (as per Fluency Report).

2.  **Review New Orders & BOMs (PRD UC 3.1):**
    *   The Specialist sees new orders with "Order Created" status on their dashboard.
    *   They select an order to review its details and the system-generated BOM. The BOM viewer provides a real-time preview with smart quantity aggregation (as per Fluency Report).

3.  **Manage Parts for Outsourcing (PRD UC 3.2):**
    *   The system may help identify, or the Specialist marks, parts/sub-assemblies in the BOM for outsourcing.
    *   They use the "complete outsourcing management with supplier tracking" system to manage these parts (as per Fluency Report).

4.  **Approve BOM & Update Status (PRD UC 3.3):**
    *   Once the BOM is verified, the Specialist approves it within the system.
    *   After approval and initiating any outsourcing, they update the order status to "Parts Sent, Waiting for Arrival" (or "PARTS_SENT" as per Fluency Report's status flow).

5.  **Update Status on Arrival (PRD UC 3.4):**
    *   When the sink structure or outsourced parts physically arrive, the Specialist updates the order status to "Ready for Pre-QC."

6.  **Manage Service Part Orders (PRD UC 3.5):**
    *   The Specialist views service part order requests from the Service Department on their dashboard.
    *   They process these requests (e.g., check availability, prepare for dispatch), potentially using "bulk operations with notification integration" (as per Fluency Report).

7.  **Export Capabilities (Fluency Report Enhancement):**
    *   The Specialist can use CSV export features for reporting and analysis.

## 3. QC Person (Pre-QC) Workflow

The QC Person performs Pre-Quality Control checks on arrived sink structures.

1.  **Login & Dashboard Access:**
    *   The QC Person logs into the system.
    *   They access the "QCPerson Dashboard."

2.  **Identify Orders for Pre-QC (PRD UC 4.1):**
    *   The dashboard shows orders with the "Ready for Pre-QC" status. The system only allows Pre-QC access for orders in this state (as per Fluency Report's "Status-Aware Access").

3.  **Perform Pre-QC Checks (PRD UC 4.1):**
    *   The QC Person selects an order to begin Pre-QC.
    *   They access order details, technical drawings, the order confirmation document, and the PO document. The system provides "inline PDF/image preview" for these documents during inspection (as per Fluency Report).
    *   Using a system-provided digital checklist (based on Section 1 of CLP.T2.001.V01), they perform checks:
        *   Verify dimensions (sink, basin) against drawings and BOM.
        *   Confirm digital attachment of approved drawings/paperwork.
        *   Check pegboard installation and dimensions (if applicable).
        *   Verify faucet hole and mounting hole locations.
        *   Confirm feet type.
        *   Verify basin-specific features and locations.
    *   The digital checklist interface (`QCFormInterfaceEnhanced.tsx`, `QCFormWithDocuments.tsx`) supports various field types and conditional logic for basin-specific items (as per Fluency Report).
    *   If needed, they might use the "Photo Capture" feature with real-time camera integration (Fluency Report enhancement) to document aspects of the inspection.

4.  **Record Pre-QC Results & Update Status (PRD UC 4.1):**
    *   The QC Person records Pre-QC results in the digital checklist (Job ID, # of Basins, Pass/Fail for each item, notes).
    *   They provide a digital signature, captured as User ID, timestamp, and name (as per Fluency Report).
    *   Upon completion and approval, they update the order status to "Ready for Production." If issues are found, they flag them accordingly (the exact rejection workflow isn't detailed in the Fluency Report's scope but is implied by PRD).
    *   This status update seamlessly integrates with the overall order workflow (as per Fluency Report).
