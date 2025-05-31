## **Product Requirements Document: CleanStation Sink Order Configuration Tool**

Version: 1.0  
Date: May 30, 2025  
Author: Gemini AI (for Sal)  
**1\. Introduction**

This document outlines the requirements for a new software application, the "CleanStation Sink Order Configuration Tool." This tool is intended for internal use, primarily by sales personnel, to accurately and efficiently configure and generate orders for CleanStation Reprocessing Sinks. The initial scope will focus on the "MDRD" (Medical Device Reprocessing Department) sink family, with a structured 5-step process. The tool will culminate in a detailed Bill of Materials (BOM) and order summary, facilitating a smoother transition from sales to production.

**2\. Goals**

* **Streamline Order Process:** To provide an intuitive, step-by-step guided process for configuring complex sink orders.  
* **Ensure Accuracy:** To minimize errors in configurations and BOM generation through predefined rules and automated selections.  
* **Improve Sales Efficiency:** To reduce the time required to create an order and ensure all necessary information is captured.  
* **Standardize Configurations:** To enforce valid component combinations based on product specifications.  
* **Facilitate Production:** To generate a clear and comprehensive BOM that can be directly used by production teams.  
* **Support Multilingual Needs:** To provide the interface and outputs (e.g., manuals in BOM) in English (EN) and French (FR).  
* **Enable Collaboration:** To allow for easy sharing and exporting of order summaries and BOMs.

**3\. Target Audience**

* **Primary:** Sales Personnel (configuring orders with customers).  
* **Secondary:**  
  * Internal Order Processing Teams (verifying and processing orders).  
  * Production Planning Teams (using the BOM for manufacturing).  
  * Service Teams (referencing configurations for post-sales support).

**4\. Assumptions and Dependencies**

* The provided JSON files (assemblies.json, categories.json, parts.json) are the source of truth for product data and will be kept up-to-date.  
* The logic outlined in sink configuration and bom.txt forms the core business rules for the configurator.  
* The CLP.T2.001.V01 \- T2SinkProduction.docx checklist provides context for standard items and production steps, which the BOM should align with.  
* Users will have access to the tool via a web browser.

**5\. Overall Workflow (5-Step Process)**

The user will be guided through the following five steps to create an order:

1. **Customer Information:** Enter order and customer-specific details.  
2. **Sink Selection & Initial Setup:** Choose sink family, quantity, and assign unique Build Numbers.  
3. **Sink Configuration (per Build Number):** Detailed configuration of Sink Body, Basins, and Faucets for each unique sink.  
4. **Add-on Accessories:** Select optional accessories for each unique sink.  
5. **Review and Submission:** Review the complete order details and BOM, then submit.

**6\. Detailed Functional Requirements**

**Step 1: Customer Information**

* **1.1. Input Fields:**  
  * poNumber: (Text, Mandatory, Min 3 characters) \- Label: "PO Number"  
  * customerName: (Text, Mandatory, Min 3 characters) \- Label: "Customer Name"  
  * projectName: (Text, Optional, Min 3 characters if provided) \- Label: "Project Name"  
  * salesPerson: (Text, Mandatory, Min 3 characters) \- Label: "Sales Person"  
  * wantDate: (Date Picker, Mandatory, Must be a future date) \- Label: "Desired Delivery Date"  
* **1.2. PO Document Upload:**  
  * Functionality to allow users to upload a PO document (e.g., PDF, DOCX).  
  * Label: "Upload PO Document"  
* **1.3. Notes:**  
  * Multi-line text area for any order-specific notes or special instructions.  
  * Label: "Notes"  
* **1.4. Language Selection:**  
  * Dropdown or radio buttons: English (EN), French (FR).  
  * Label: "Order Language"  
  * This selection will influence the language of included manuals in the BOM (e.g., T2-STD-MANUAL-EN-KIT vs. T2-STD-MANUAL-FR-KIT).

**Step 2: Sink Selection & Initial Setup**

* **2.1. Sink Family Selection:**  
  * Dropdown/Radio buttons:  
    * MDRD (Proceeds to configuration)  
    * Endoscope CleanStation (Displays a "TODO: Under Construction" message/page)  
    * InstroSink (Displays a "TODO: Under Construction" message/page)  
  * Label: "Select Sink Family"  
* **2.2. Quantity and Build Number Entry:**  
  * If MDRD is selected:  
    * quantity: (Numeric input, Mandatory, Min 1\) \- Label: "Number of Sinks"  
    * For each sink (1 to quantity):  
      * buildNumber: (Text input, Mandatory, Unique per order) \- Label: "Enter Unique Build \# for Sink \[X\]"  
      * This buildNumber will be the primary identifier for the specific sink's configuration in subsequent steps and in the final BOM.  
* **2.3. Navigation:**  
  * "Next" button to proceed to Step 3\. If quantity \> 1, Step 3 and Step 4 will be repeated for each buildNumber. The UI should clearly indicate which buildNumber is currently being configured.

**Step 3: Sink Configuration (Repeated for each Build Number)**

The UI must clearly display the current buildNumber being configured.

**3.A. Sink Body Configuration**

* **3.A.1. Sink Model (Number of Basins):**  
  * Dropdown selection. Label: "Sink Model (Basins)"  
    * T2-B1 (1 basin)  
    * T2-B2 (2 basins)  
    * T2-B3 (3 basins)  
* **3.A.2. Sink Dimensions:**  
  * sinkWidth: (Numeric input, inches, Mandatory) \- Label: "Sink Width (inches)"  
  * sinkLength: (Numeric input, inches, Mandatory) \- Label: "Sink Length (inches)"  
  * **BOM Logic (Assembly ID from assemblies.json):** Based on sinkLength:  
    * 34" \<= sinkLength \<= 60": Add T2-BODY-48-60-HA to BOM.  
    * 61" \<= sinkLength \<= 72": Add T2-BODY-61-72-HA to BOM.  
    * 73" \<= sinkLength \<= 120": Add T2-BODY-73-120-HA to BOM.  
* **3.A.3. Legs Type:**  
  * Dropdown selection. Label: "Legs Type"  
    * **Height Adjustable:**  
      * DL27 (Adds T2-DL27-KIT to BOM)  
      * DL14 (Adds T2-DL14-KIT to BOM)  
      * LC1 (Adds T2-LC1-KIT to BOM)  
    * **Fixed Height:**  
      * DL27 (Adds T2-DL27-FH-KIT to BOM)  
      * DL14 (Adds T2-DL14-FH-KIT to BOM)  
* **3.A.4. Feet Type:**  
  * Dropdown selection. Label: "Feet Type"  
    * Lock & Leveling Casters (Adds T2-LEVELING-CASTOR-475 to BOM)  
    * S.S Adjustable Seismic Feet (Adds T2-SEISMIC-FEET to BOM)  
* **3.A.5. Pegboard:**  
  * Checkbox/Toggle: "Add Pegboard?" (Boolean)  
  * If Yes:  
    * **Pegboard Color (Colorsafe+):**  
      * Dropdown. Label: "Pegboard Color"  
      * Options: Green, Black, Yellow, Grey, Red, Blue, Orange, White.  
      * **BOM Logic:** Adds T-OA-PB-COLOR (Part ID: T-OA-PB-COLOR \- this appears to be a generic part/service code for coloring; clarification on actual colored pegboard part numbers may be needed).  
    * **Pegboard Type:**  
      * Dropdown. Label: "Pegboard Type"  
      * Perforated (Mandatorily adds T2-ADW-PB-PERF-KIT to BOM)  
      * Solid (Mandatorily adds T2-ADW-PB-SOLID-KIT to BOM)  
    * **Pegboard Size:**  
      * Dropdown. Label: "Pegboard Size"  
      * Same as Sink Length:  
        * **BOM Logic (Assembly IDs from assemblies.json):** Auto-selects based on sinkLength:  
          * 34" \- 47": T2-ADW-PB-3436  
          * 48" \- 59": T2-ADW-PB-4836  
          * 60" \- 71": T2-ADW-PB-6036  
          * 72" \- 83": T2-ADW-PB-7236  
          * 84" \- 95": T2-ADW-PB-8436  
          * 96" \- 107": T2-ADW-PB-9636  
          * 108" \- 119": T2-ADW-PB-10836  
          * 120" \- 130": T2-ADW-PB-12036  
      * Custom Size:  
        * pegboardWidth: (Numeric input, inches) \- Label: "Custom Pegboard Width"  
        * pegboardLength: (Numeric input, inches) \- Label: "Custom Pegboard Length"  
        * **BOM Logic:** Generate a new part: Code 720.215.002, Name T2-ADW-PB-"width"X"length". (System needs to handle tracking/flagging such custom parts).  
    * **Mandatory Pegboard Addition:** If Pegboard is selected (Yes), T2-OHL-MDRD-KIT is mandatorily added to the BOM.  
* **3.A.6. Work Flow Direction:**  
  * Dropdown. Label: "Work Flow Direction"  
  * Options: Left to Right, Right to Left. (Impact on BOM or specific component placement needs to be clarified if any).

**3.B. Basin Configuration (Section repeated for each basin, e.g., Basin 1, Basin 2, Basin 3, based on Sink Model)**

* **3.B.1. Basin Type:**  
  * Dropdown. Label: "Basin \[X\] Type"  
    * E-Sink (Adds T2-BSN-ESK-KIT to BOM for this basin)  
    * E-Sink DI (Adds T2-BSN-ESK-DI-KIT to BOM for this basin. Auto-selects "GOOSENECK TREATED WATER FAUCET KIT PVC" in Faucet Configuration for this basin/sink).  
    * E-Drain (Adds T2-BSN-EDR-KIT to BOM for this basin)  
* **3.B.2. Basin Size:**  
  * Dropdown. Label: "Basin \[X\] Size"  
    * 20X20X8 (Adds T2-ADW-BASIN20X20X8 to BOM)  
    * 24X20X8 (Adds T2-ADW-BASIN24X20X8 to BOM)  
    * 24X20X10 (Adds T2-ADW-BASIN24X20X10 to BOM)  
    * 30X20X8 (Adds T2-ADW-BASIN30X20X8 to BOM)  
    * 30X20X10 (Adds T2-ADW-BASIN30X20X10 to BOM)  
    * Custom:  
      * basinWidth: (Numeric input, inches) \- Label: "Custom Basin Width"  
      * basinLength: (Numeric input, inches) \- Label: "Custom Basin Length"  
      * basinDepth: (Numeric input, inches) \- Label: "Custom Basin Depth"  
      * **BOM Logic:** Generate a new part: Code 720.215.001, Name T2-ADW-BASIN-"width"X"length"X"depth".  
* **3.B.3. Control Box (System Determined & Added to Sink-Level BOM once for the entire Build Number):**  
  * This is NOT a per-basin selection by the user. The system determines the single, appropriate control box for the entire sink (buildNumber) based on the combination of all its basin types.  
  * **BOM Logic (Assembly IDs from assemblies.json \- added once per sink/buildNumber):**  
    * 1 E-Drain basin only: T2-CTRL-EDR1  
    * 1 E-Sink basin only: T2-CTRL-ESK1  
    * 1 E-Drain & 1 E-Sink basin: T2-CTRL-EDR1-ESK1  
    * 2 E-Drain basins only: T2-CTRL-EDR2  
    * 2 E-Sink basins only: T2-CTRL-ESK2  
    * 3 E-Drain basins only: T2-CTRL-EDR3  
    * 3 E-Sink basins only: T2-CTRL-ESK3  
    * 1 E-Drain & 2 E-Sink basins: T2-CTRL-EDR1-ESK2  
    * 2 E-Drain & 1 E-Sink basin: T2-CTRL-EDR2-ESK1  
* **3.B.4. Basin Add-ons (per basin):**  
  * Checkboxes.  
    * P-TRAP DISINFECTION DRAIN UNIT (If selected, adds T2-OA-MS-1026 to BOM for this basin). Label: "Add P-Trap"  
    * BASIN LIGHT (If selected, logic depends on Basin Type): Label: "Add Basin Light"  
      * If Basin Type is E-Drain: Adds T2-OA-BASIN-LIGHT-EDR-KIT to BOM.  
      * If Basin Type is E-Sink or E-Sink DI: Adds T2-OA-BASIN-LIGHT-ESK-KIT to BOM.

**3.C. Faucet Configuration (Applies to the overall sink/buildNumber, considering basin types and quantity)**

* **3.C.1. Faucet Type:**  
  * Dropdown. Label: "Faucet Type"  
    * 10" WRIST BLADE SWING SPOUT WALL MOUNTED FAUCET KIT (Adds T2-OA-STD-FAUCET-WB-KIT to BOM)  
    * PRE-RINSE OVERHEAD SPRAY UNIT KIT (Adds T2-OA-PRE-RINSE-FAUCET-KIT to BOM)  
    * GOOSENECK TREATED WATER FAUCET KIT PVC (Adds T2-OA-DI-GOOSENECK-FAUCET-KIT to BOM)  
  * **Auto-selection Logic:** If any basin in the current buildNumber is of type E-Sink DI, this field auto-selects "GOOSENECK TREATED WATER FAUCET KIT PVC" and may be read-only.  
* **3.C.2. Faucet Quantity:**  
  * Numeric input. Label: "Number of Faucets"  
  * **Validation:**  
    * Max 2 for 1-basin (T2-B1) and 2-basin (T2-B2) sinks.  
    * Max 3 for 3-basin (T2-B3) sinks.  
* **3.C.3. Faucet Placement:**  
  * Dynamic options based on Sink Model and Faucet Quantity. Label: "Faucet Placement"  
    * Examples: "Center of Basin 1", "Between Basins 1/2", "Right of Basin 2".  
    * (Detailed logic for placement options with multiple faucets and basins needs UI/UX definition).  
* **3.C.4. Sprayer:**  
  * Checkbox/Toggle: "Add Sprayer(s)?" (Boolean)  
  * If Yes:  
    * **Sprayer Type Selection (can select multiple types up to Sprayer Quantity):**  
      * Dropdown/Multi-select. Label: "Sprayer Type(s)"  
      * DI WATER GUN KIT & TURRET (Adds T2-OA-WATERGUN-TURRET-KIT to BOM)  
      * DI WATER GUN KIT & ROSETTE (Adds T2-OA-WATERGUN-ROSETTE-KIT to BOM)  
      * AIR GUN KIT & TURRET (Adds T2-OA-AIRGUN-TURRET-KIT to BOM)  
      * AIR GUN KIT & ROSETTE (Adds T2-OA-AIRGUN-ROSETTE-KIT to BOM)  
    * **Sprayer Quantity:**  
      * Numeric input (1 or 2). Label: "Total Number of Sprayers"  
    * **Sprayer Location(s):**  
      * Dropdown/Text input per sprayer. Label: "Sprayer \[X\] Location"  
      * Options: Left Side (of overall sink), Right Side (of overall sink). (Further clarification needed if more granular placement is required).

**Step 4: Add-on Accessories (Repeated for each Build Number)**

* This page will present a list of optional accessories that can be added to the current buildNumber.  
* Accessories should be grouped by categories as defined in categories.json (primarily under "720 \- ACCESSORY LIST" and its subcategories).  
* For each accessory, display: Name, Part Number (Assembly ID), and a quantity input field (default to 1 if applicable, some might be fixed quantity kits).  
* **Data Source:** The list of accessories and their corresponding part numbers (prefixed with 70x codes in sink configuration and bom.txt) should be mapped to assembly\_refs in categories.json and then to full assembly details in assemblies.json.  
  * Example: "702.4 T-OA-BINRAIL-24-KIT" \-\> T-OA-BINRAIL-24-KIT in assemblies.json.  
* **UI:** Use accordions or tabs for categories to keep the list manageable. Each item should have a checkbox to select and a field for quantity.  
* Selected accessories and their quantities are added to the BOM for the current buildNumber.

**Step 5: Review and Submission**

* **5.1. Order Summary Display:**  
  * **Customer Information:** Display all details from Step 1\.  
  * **For each buildNumber in the order:**  
    * Clearly identify the buildNumber.  
    * **Sink Overview:** Family, Model, Dimensions, Legs, Feet, Pegboard details (Type, Color, Size), Work Flow.  
    * **Basin Details:** For each basin: Type, Size, selected Basin Add-ons.  
    * **Faucet Details:** Type, Quantity, Placement, Sprayer details (Type, Quantity, Location).  
    * **Selected Add-on Accessories:** List of accessories and their quantities for this buildNumber.  
* **5.2. Generated Bill of Materials (BOM) Display:**  
  * A comprehensive list of all parts and assemblies required for the entire order.  
  * The BOM should be structured hierarchically if possible, showing top-level assemblies and their constituent components (from assemblies.json components array).  
  * For each BOM item:  
    * Part Number (Assembly ID or Part ID).  
    * Part Name (from assemblies.json or parts.json).  
    * Quantity (aggregated if the same part appears multiple times at the same hierarchy level).  
    * Unit of Measure (if available).  
    * Notes (if any from the components array in assemblies.json).  
  * Include automatically added mandatory items (e.g., control boxes, manuals based on language).  
    * Manuals:  
      * Based on language selected in Step 1 (e.g., T2-STD-MANUAL-EN-KIT).  
      * Additional relevant manuals based on configuration (e.g., IFU.T2.ESinkInstUserFR. if E-Sink is selected and language is FR – exact part ID for this needs to be confirmed from assemblies.json or added).  
* **5.3. Action Buttons:**  
  * Submit Order: Finalizes the order (details of submission process TBD \- e.g., sends data to an ERP, email notification).  
  * Generate BOM (Export): Allows user to download the BOM (e.g., as CSV, PDF).  
  * Edit Configuration: Allows user to navigate back to previous steps to modify selections. The system should maintain state.  
  * Save Draft (Optional Future Feature): Allows saving the current order configuration to be completed later.

**7\. Data Sources and Management**

* **assemblies.json**: Primary source for buildable products (assemblies), their types (SIMPLE, COMPLEX, KIT, SERVICE\_PART), status, and direct components (part\_id, quantity).  
* **categories.json**: Defines the product hierarchy (categories and subcategories) and links these to assembly\_refs. This is key for organizing accessory selection.  
* **parts.json**: Contains details of individual components (manufacturer info, type, status). Referenced by part\_id from assemblies.json.  
* **sink configuration and bom.txt**: This document provides the core business logic, UI field definitions, and the mapping of user choices to specific "700 series" reference codes, which in turn map to actual assembly/part IDs. It's critical for driving the configuration steps and BOM rules.  
* **CLP.T2.001.V01 \- T2SinkProduction.docx**: Provides a checklist for production, confirming standard inclusions. The BOM should ensure these items are covered by the selected kits or added explicitly.

**8\. Non-Functional Requirements**

* **Usability:** The interface must be intuitive, user-friendly, and minimize clicks. Clear visual feedback and progress indicators are essential.  
* **Performance:** The system must load options and generate BOMs quickly to avoid user frustration. Data lookups from JSON files should be optimized.  
* **Data Integrity:** All selections must result in a valid and producible configuration. Validation rules are critical.  
* **Error Handling:** Comprehensive client-side and server-side validation. User-friendly error messages guiding the user to correct issues.  
* **Maintainability:** The codebase should be well-organized, commented, and easy to update as product lines and configuration rules evolve. Consider a design that allows for easy updates to product data (e.g., by replacing JSON files or updating a database).  
* **Security:** If handling sensitive customer or order data, appropriate security measures must be in place (not detailed here, but to be considered).  
* **Browser Compatibility:** Support modern web browsers (e.g., Chrome, Firefox, Edge, Safari latest versions).

**9\. Future Considerations (Out of Scope for Initial Version)**

* Pricing integration and quote generation.  
* Real-time inventory checks.  
* 3D visualization of the configured sink.  
* Integration with ERP/CRM systems.  
* User accounts and saving draft orders.  
* Advanced reporting and analytics.

**10\. Open Questions / Items for Clarification**

* Specific part numbers for "Colorsafe+" pegboard colors if T-OA-PB-COLOR is just a generic code.  
* Detailed UI/UX for faucet placement with multiple faucets and basins.  
* Granularity of sprayer location if more than "Left Side" / "Right Side" is needed.  
* Exact part ID for the French E-Sink manual (IFU.T2.ESinkInstUserFR.) if it's a distinct BOM item.  
* Handling of custom part numbers in downstream systems (production, ERP).  
* Mechanism for updating the source JSON data files.

This PRD is a living document and will be updated as more information becomes available or requirements change.