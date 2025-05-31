## **Implementation Plan: CleanStation Sink Order Configuration Tool**

**Overall Goal:** To develop the "CleanStation Sink Order Configuration Tool" as outlined in PRD prd\_sink\_config\_tool\_v2.

**Methodology:** Agile approach with phased delivery. Each phase will build upon the previous one, delivering incremental value.

**Phase 1: MVP \- Core MDRD Configuration & BOM Generation**

**Goal:** Deliver a functional tool that allows users to complete the 5-step process for the MDRD sink family, configure essential options, and generate an accurate Bill of Materials (BOM). This phase focuses on core functionality and data integrity.

**Estimated Timeline:** 6-10 weeks

**Key Deliverables for MVP:**

1. **User Interface (UI) for the 5-Step Workflow:**  
   * Basic, clean, and intuitive navigation through all five steps.  
   * Clear indication of the current step and buildNumber being configured.  
2. **Step 1: Customer Information (Core Functionality)**  
   * All input fields (poNumber, customerName, projectName, salesPerson, wantDate).  
   * Notes text area.  
   * Language selection (EN/FR) impacting manual selection in BOM.  
   * *Deferred for MVP:* PO Document Upload.  
3. **Step 2: Sink Selection & Initial Setup (MDRD Focus)**  
   * Sink Family Selection:  
     * MDRD fully functional.  
     * Endoscope CleanStation & InstroSink lead to a static "Under Construction" page/message.  
   * Quantity input for MDRD sinks.  
   * Unique buildNumber entry for each sink.  
   * Logic to iterate through Step 3 & 4 for each buildNumber.  
4. **Step 3: Sink Configuration (MDRD \- Essential Options)**  
   * **3.A. Sink Body Configuration:**  
     * Sink Model (T2-B1, T2-B2, T2-B3) selection.  
     * Sink Dimensions (Width, Length) input with corresponding BOM logic for T2-BODY-XX-XX-HA assemblies.  
     * Legs Type (Height Adjustable & Fixed Height options) with BOM logic for respective kits.  
     * Feet Type (Lock & Leveling Casters, S.S Adjustable Seismic Feet) with BOM logic.  
     * Pegboard (Yes/No):  
       * If Yes:  
         * Pegboard Type (Perforated, Solid) with BOM logic for T2-ADW-PB-PERF-KIT / T2-ADW-PB-SOLID-KIT.  
         * Pegboard Size (Same as Sink Length option) with BOM logic for standard pegboard sizes (T2-ADW-PB-XXXX).  
         * Mandatory addition of T2-OHL-MDRD-KIT to BOM.  
       * *Deferred for MVP:* Pegboard Color selection, Custom Pegboard Size input.  
     * Work Flow Direction (Left to Right, Right to Left) data capture.  
   * **3.B. Basin Configuration (Essential Options per basin):**  
     * Basin Type (E-Sink, E-Sink DI, E-Drain) with BOM logic for respective kits (T2-BSN-ESK-KIT, etc.).  
     * Basin Size (Standard dropdown options: 20X20X8, etc.) with BOM logic for T2-ADW-BASINXXXX assemblies.  
     * *Deferred for MVP:* Custom Basin Size input.  
     * Control Box: System-determined logic implemented to add the correct control box (T2-CTRL-XXXX) to the sink-level BOM based on the combination of basin types.  
     * Basin Add-ons:  
       * P-TRAP DISINFECTION DRAIN UNIT (T2-OA-MS-1026) selection.  
       * BASIN LIGHT selection with logic for T2-OA-BASIN-LIGHT-EDR-KIT or T2-OA-BASIN-LIGHT-ESK-KIT based on Basin Type.  
   * **3.C. Faucet Configuration (Essential Options):**  
     * Faucet Type (all 3 standard options) with BOM logic for respective kits (T2-OA-STD-FAUCET-WB-KIT, etc.).  
     * Auto-selection of "GOOSENECK TREATED WATER FAUCET KIT PVC" if E-Sink DI is chosen.  
     * Faucet Quantity input with validation (max 2 for 1/2 basins, max 3 for 3 basins).  
     * Faucet Placement: Basic selection options (e.g., "Center of Basin 1", "Between Basins 1/2"). Detailed dynamic UI can be refined later.  
     * Sprayer (Yes/No):  
       * If Yes: Sprayer Type Selection (all 4 standard options) with BOM logic for respective kits (T2-OA-WATERGUN-TURRET-KIT, etc.).  
       * Sprayer Quantity (1 or 2\) input.  
       * Sprayer Location (Left Side, Right Side) selection.  
5. **Step 4: Add-on Accessories (MVP \- Limited Selection)**  
   * Implement selection for a curated list of 10-15 high-priority/most common accessories.  
   * Mechanism to add selected accessories (with quantity) to the BOM for the current buildNumber.  
   * *Deferred for MVP:* Full categorized accessory library.  
6. **Step 5: Review and Submission (Core Functionality)**  
   * Display of a comprehensive Order Summary for all configured sinks.  
   * Generation and display of a Bill of Materials (BOM):  
     * List Part Numbers (Assembly/Part ID), Names, and Quantities.  
     * Include system-determined items (control boxes, language-specific manuals like T2-STD-MANUAL-EN-KIT).  
     * Simple hierarchical display (e.g., top-level kits showing their main components).  
   * Action Buttons:  
     * Generate BOM (Export): Functional export to CSV format.  
     * Edit Configuration: Allow navigation back to previous steps, maintaining state for the current buildNumber.  
     * *Deferred for MVP:* Submit Order (actual submission logic), Save Draft, PDF BOM export.  
7. **Backend & Data Logic:**  
   * Ability to load and parse data from assemblies.json, categories.json (for MVP accessories), and parts.json.  
   * Implementation of core business rules from sink configuration and bom.txt for BOM generation and validation.  
8. **Testing:**  
   * Unit tests for BOM generation logic.  
   * End-to-end testing of the MDRD configuration flow with common scenarios.  
9. **Documentation:**  
   * Basic user guide for sales personnel on using the MVP.  
   * Technical documentation for developers on data structures and core logic.

**Phase 2: Enhancements, Full Accessory Library & Initial Submission Features**

**Goal:** Expand on the MVP by adding more configuration options, the complete accessory library, PO upload, and basic order submission capabilities.

**Estimated Timeline:** 4-8 weeks (post-MVP)

**Key Deliverables for Phase 2:**

1. **Step 1 Enhancements:**  
   * Implement PO Document Upload functionality.  
2. **Step 3 Configuration Enhancements:**  
   * Pegboard: Implement "Pegboard Color (Colorsafe+)" selection and "Custom Size" input with BOM logic.  
   * Basin Configuration: Implement "Custom Basin Size" input with BOM logic.  
   * Faucet Configuration: Refine UI/UX for "Faucet Placement" for multiple faucets/basins.  
   * Sprayer Configuration: Refine "Sprayer Location" if more granular options are needed.  
3. **Step 4: Full Add-on Accessory Library:**  
   * Implement the complete, categorized accessory selection UI based on categories.json.  
   * Use accordions/tabs for better organization.  
4. **Step 5 Enhancements:**  
   * Improve BOM display (e.g., more detailed hierarchy).  
   * Implement Generate BOM (Export) to PDF format.  
   * Implement a basic Submit Order functionality (e.g., sends an email notification with order summary and BOM to a designated address, or saves order data to a simple database/file store).  
5. **Non-Functional Improvements:**  
   * Enhanced error handling and more descriptive user feedback.  
   * Performance optimizations, especially with the full accessory list.  
6. **Data Management:**  
   * Refine process for handling custom-generated part numbers in the BOM.

**Phase 3: Advanced Features, Other Sink Families & Integrations**

**Goal:** Complete the full vision of the tool, including support for all sink families, advanced usability features, and potential integrations.

**Estimated Timeline:** 8-12+ weeks (post-Phase 2\)

**Key Deliverables for Phase 3:**

1. **Full Sink Family Support:**  
   * Implement the complete configuration workflow (Steps 3 & 4\) for Endoscope CleanStation sinks.  
   * Implement the complete configuration workflow (Steps 3 & 4\) for InstroSink sinks.  
   * Update all relevant BOM logic, accessory compatibility, and validation rules.  
2. **Advanced Usability Features:**  
   * Implement Save Draft functionality for orders.  
   * Consider user accounts/profiles if multiple salespersons need to manage their drafts/orders separately.  
3. **Advanced Integrations (based on priority and feasibility):**  
   * Direct integration with ERP/CRM systems for order submission.  
   * Pricing engine integration for real-time quote generation.  
   * Real-time inventory checks (if backend systems support this).  
4. **Optional Enhancements:**  
   * 3D visualization of the configured sink (if deemed high value).  
   * Advanced reporting and analytics on configured orders.  
5. **Robustness and Scalability:**  
   * Comprehensive security review and hardening.  
   * Scalability testing to ensure performance under increased load (more users, larger orders).  
   * Refined data update strategy (e.g., admin interface for managing product data if JSON files become difficult to maintain).

**General Considerations Across All Phases:**

* **Development Team:** Define roles (Frontend, Backend, QA, Project Management/Product Owner).  
* **Technology Stack:** To be decided (e.g., React/Vue/Angular for frontend, Node.js/Python/Java for backend, database choice if not just JSON parsing).  
* **Version Control:** Use Git or similar.  
* **Regular Stakeholder Reviews:** Conduct demos at the end of sprints or key milestones to gather feedback from Sal and other stakeholders.  
* **User Acceptance Testing (UAT):** Allocate time for UAT with sales personnel before each major release (especially post-MVP).  
* **Deployment Strategy:** Plan for development, staging, and production environments.

This phased approach allows for early feedback and iterative improvement, ensuring the tool meets the needs of the sales team and the business effectively.