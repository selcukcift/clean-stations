# AI Agent Task Guide: Implement Pre-QC Checklist & Cockpit

This guide outlines the steps and specific prompts for an AI coding agent to implement the Pre-QC checklist and QC cockpit functionality for the Torvan Medical CleanStation Production Workflow Application.

**Assumptions:**
*   The AI agent has access to the codebase and can use tools similar to `ls`, `read_files`, `replace_with_git_merge_diff`, `overwrite_file_with_block`, `create_file_with_block`, `run_in_bash_session`, etc.
*   The AI agent understands the project structure and technology stack (Next.js, Prisma, PostgreSQL, ShadCN UI, Tailwind CSS, Zustand).
*   The AI agent has read and understood `CLAUDE.md` and `AI_AGENT_DATABASE_GUIDE.md` (if available, or can be prompted to create/read them).

## Overall Goal:
Implement a pre-QC checklist that appears when an order is ready for Pre-QC. This includes a QC cockpit for the QC person, allowing easy access to sink drawings, POs, and the ability to record video/audio and take pictures associated with checklist items.

---

## Phase 1: Analysis & Data Model Definition (No File Edits in this Phase by this Guide's AI)

This phase is about understanding requirements. The prompts below are for the AI to perform analysis and output its findings. The user (or a controlling agent) will review these before actual file modifications begin.

**Step 1: Analyze Existing QC Checklists and Workflows**

*   **Prompt 1.1:**
    ```
    Read the following files:
    - `resources/CLP.T2.001.V01 - T2SinkProduction.txt`
    - `resources/Torvan Medical CleanStation Production Workflow Digitalization.md`
    - `resources/CLQ.T2.001.V01 - T2SinkQuality.txt`
    - `resources/CLT.T2.001.V01 - T2SinkEOLTesting.txt`
    - `resources/sink configuration and bom.txt`

    Summarize the key requirements for a "Pre-QC Checklist" based on these documents. Specifically identify:
    1. Which document and section contains the items for the Pre-QC checklist?
    2. What are the explicit checklist items listed for Pre-QC?
    3. What information or documents does the QC Person need access to while performing Pre-QC (as per the PRD)?
    4. What are the order statuses relevant to the Pre-QC process (before, during, after)?
    5. Who is the user role responsible for Pre-QC?
    6. What information needs to be recorded for each Pre-QC checklist item and for the overall Pre-QC result (e.g., Job ID, initials, pass/fail, notes)?
    ```

**Step 2: Design the Data Model for the Pre-QC Checklist (Conceptual Output)**

*   **Prompt 1.2:**
    ```
    Based on your analysis from Prompt 1.1, and considering the existing Prisma schema in `prisma/schema.prisma` (especially models like `QcFormTemplate`, `QcFormTemplateItem`, `OrderQcResult`, `OrderQcItemResult`, `FileUpload`), propose a data model design to support the Pre-QC checklist. Your design should cover:
    1. How the Pre-QC checklist template itself will be stored (which existing models to use or if new ones are needed).
    2. How the results of a performed Pre-QC checklist will be stored.
    3. Crucially, how multiple media captures (photos, videos, audio) can be associated with *each individual checklist item result*. Detail any new models or modifications to existing Prisma models needed for this.
    4. How basin-specific checklist items (items repeated per basin) will be handled.
    5. How "Job ID#", "# of Basins", and "Initials" from the paper form will be captured.

    Present your design as a conceptual overview. Do not write Prisma schema code yet. Just describe the models, fields, and relationships.
    ```

---

## Phase 2: Implementation (File Edits Begin)

**Step 3: Implement Database Schema Changes**

*   **Prompt 2.1: Read Prisma Schema**
    ```
    Read the content of `prisma/schema.prisma`.
    ```
*   **Prompt 2.2: Modify Prisma Schema**
    ```
    Based on your data model design from Prompt 1.2 (specifically for media attachments per checklist item), modify `prisma/schema.prisma`.
    The goal is to add a new table, likely named `QcItemResultMediaAttachment`, that links `OrderQcItemResult` to `FileUpload` and allows storing multiple media files per item result.
    Ensure you add the necessary relations to `OrderQcItemResult` and `FileUpload` as well.
    Use `replace_with_git_merge_diff` or `overwrite_file_with_block` to apply the changes to `prisma/schema.prisma`.
    Output the full modified `prisma/schema.prisma` if using overwrite, or the diff if using merge.
    ```
*   **Prompt 2.3: Attempt Prisma Migration**
    ```
    1. Create a `.env` file by copying the contents of `.env.home`. Ensure the `DATABASE_URL` in the new `.env` file is set to use port `5433` (e.g., `DATABASE_URL="postgresql://postgres:postgres@localhost:5433/torvan-db?schema=public"`).
    2. Attempt to run Prisma migrations using the command:
       `run_in_bash_session`
       `npx prisma migrate dev --name add_qc_item_media_attachments`
    3. Report the full output. If it fails due to the database server not being reachable, inform the user and request instructions on how to start the PostgreSQL server in this environment before proceeding. Do not attempt further steps in Phase 2 until the migration is successful.
    ```
    *(User/Controlling Agent intervention may be needed here if DB is not running)*

**Step 4: Update TypeScript Type Definitions**

*   **Prompt 2.4: Read types/qc.ts**
    ```
    Read the content of `types/qc.ts`.
    ```
*   **Prompt 2.5: Modify types/qc.ts**
    ```
    Update `types/qc.ts` to reflect the Prisma schema changes made in Prompt 2.2 and your data model design. This involves:
    1. Defining a `FileUploadBasic` interface (if a suitable one doesn't exist).
    2. Defining a `QcItemResultMediaAttachment` interface.
    3. Adding the `mediaAttachments?: QcItemResultMediaAttachment[];` field to the `OrderQcItemResult` interface.
    Use `replace_with_git_merge_diff` or `overwrite_file_with_block` to apply these changes.
    Output the full modified `types/qc.ts` if using overwrite, or the diff if using merge.
    If file modification tools fail, report this to the user and await guidance.
    ```

**Step 5: Create Seed Script for Pre-QC Template**

*   **Prompt 2.6: Plan Seed Script**
    ```
    List the files in the `scripts/` directory.
    Propose a filename for a new seed script (e.g., `seedPreQcTemplate.ts`) that will create the "Pre-Production Check MDRD" `QcFormTemplate` with its items as defined in `CLP.T2.001.V01 - SECTION 1` and your data model from Prompt 1.2.
    Outline the structure of this script:
    - It should use the Prisma client.
    - It should define the template name (e.g., "Pre-Production Check MDRD Sink") and its items.
    - Map each item from "SECTION 1 PRE-PRODUCTION CHECK" of `CLP.T2.001.V01` to a `QcFormTemplateItem` structure, including `section`, `checklistItem`, `itemType`, `isRequired`, `order`, `repeatPer` (for basin-specific items like "BASIN"), and any relevant `options` or `notesPrompt`.
    ```
*   **Prompt 2.7: Write Seed Script**
    ```
    Create the seed script file (e.g., `scripts/seedPreQcTemplate.ts`) with the content outlined in Prompt 2.6.
    The script should ensure it doesn't create duplicate templates if run multiple times (e.g., by checking if a template with that name and version already exists).
    ```
*   **Prompt 2.8: (Optional, if DB is running) Run Seed Script**
    ```
    If the database is confirmed to be running and migrations were successful:
    Add a command to `package.json` to run your new seed script (e.g., `prisma:seed:preqc`).
    Then, execute this new npm script using `run_in_bash_session`.
    Report the output.
    If the DB is not running, state that this step will be skipped.
    ```

**Step 6: Develop API Endpoints**

*   **Prompt 2.9: Plan API Endpoints**
    ```
    Based on the project structure (see `app/api/`), propose the file paths and a brief description for the following API endpoints related to Pre-QC:
    1. GET endpoint to fetch the "Pre-Production Check MDRD Sink" template.
    2. GET endpoint to fetch existing Pre-QC results for a specific order ID.
    3. POST endpoint to create/update Pre-QC results for a specific order ID (this will handle saving checklist item results, including notes, status, and links to media attachments).
    Remember that media files themselves will likely be uploaded via the existing `app/api/upload/route.ts`. This POST endpoint will primarily link `FileUpload` IDs.
    ```
*   **Prompt 2.10: Implement API Endpoint - Get Pre-QC Template**
    ```
    Create the API route file for fetching the Pre-QC template (e.g., `app/api/qc/pre-qc/templates/active/route.ts` or similar, to fetch by a known name or unique identifier).
    This endpoint should use the Prisma client to find the "Pre-Production Check MDRD Sink" `QcFormTemplate` (and its items) that was seeded.
    Include error handling.
    ```
*   **Prompt 2.11: Implement API Endpoint - Get Pre-QC Results for Order**
    ```
    Create the API route file for fetching existing Pre-QC `OrderQcResult` (and its `OrderQcItemResult`s, including `mediaAttachments`) for a given `orderId`.
    Path might be `app/api/qc/pre-qc/results/order/[orderId]/route.ts`.
    Include error handling.
    ```
*   **Prompt 2.12: Implement API Endpoint - Save Pre-QC Results**
    ```
    Create the API route file for creating/updating Pre-QC `OrderQcResult` for a given `orderId`.
    This endpoint will receive the checklist data, including individual item results (value, conformance, notes) and an array of `fileUploadId`s for each item's media.
    It should:
    - Find or create the `OrderQcResult`.
    - Create/update `OrderQcItemResult` records.
    - For each `OrderQcItemResult` with media, create corresponding `QcItemResultMediaAttachment` records linking to the `FileUpload` IDs.
    - Optionally, update the main `Order` status to "Ready for Production" if the Pre-QC `overallStatus` is 'PASSED'.
    Include input validation (consider using Zod, as it's in the tech stack - check `lib/qcValidationSchemas.ts` for examples).
    Include error handling.
    ```

**Step 7: Develop UI Components**

*   **Prompt 2.13: Plan UI Components and Page**
    ```
    Propose file paths for the following UI components and the main page for Pre-QC:
    1. Main Pre-QC page (e.g., `app/orders/[orderId]/pre-qc/page.tsx`).
    2. Main Pre-QC checklist form component (e.g., `components/qc/pre-qc/PreQCChecklistForm.tsx`).
    3. Individual checklist item component (e.g., `components/qc/pre-qc/PreQCChecklistItem.tsx`).
    4. Media capture/display component (could be part of `PreQCChecklistItem.tsx` or separate like `components/qc/shared/MediaHandler.tsx`).
    Briefly describe the props and responsibilities of each.
    ```
*   **Prompt 2.14: Implement Main Pre-QC Page**
    ```
    Create the main Pre-QC page (e.g., `app/orders/[orderId]/pre-qc/page.tsx`).
    This page should:
    - Extract `orderId` from the route.
    - Fetch the active Pre-QC template using the API endpoint from Prompt 2.10.
    - Fetch any existing Pre-QC results for this order using the API endpoint from Prompt 2.11.
    - Pass the template and results to the `PreQCChecklistForm` component.
    - Handle loading and error states.
    ```
*   **Prompt 2.15: Implement Pre-QC Checklist Form Component**
    ```
    Create `components/qc/pre-qc/PreQCChecklistForm.tsx`. This component will:
    - Receive the QC template and existing results as props.
    - Render checklist items grouped by section, using `PreQCChecklistItem.tsx`.
    - Manage the state of the form data. (Consider if a Zustand store is needed, or if local state is sufficient).
    - Provide functionality to save progress and submit the completed checklist (calling the API from Prompt 2.12).
    - Handle basin-specific items by rendering them multiple times based on the number of basins in the order (this info might need to be fetched or passed down).
    ```
*   **Prompt 2.16: Implement Pre-QC Checklist Item Component**
    ```
    Create `components/qc/pre-qc/PreQCChecklistItem.tsx`. This component will:
    - Receive a single checklist item's template data and its current result data as props.
    - Render the item description, input field (based on `itemType`), notes field.
    - Include UI for media capture (e.g., file input for photos/videos, button to record audio if feasible) and display of already attached media thumbnails.
    - Use the existing file upload API (`app/api/upload/route.ts`) for uploading files and then store the returned `FileUpload` IDs.
    - Call back to the parent form component with updated item result data.
    ```

---

## Phase 3: QC Cockpit (High-Level - Detailed prompts to be generated after Pre-QC is functional)

**Step 8: Design and Implement QC Cockpit UI**

*   **Prompt 3.1 (Conceptual Design):**
    ```
    Design the UI for a "QC Cockpit" page. This page should be accessible to a QC Person. Consider the dashboard layout at `components/dashboard/QCPersonDashboard.tsx`.
    The cockpit should provide:
    1. A list of orders awaiting Pre-QC (or Final QC, depending on context).
    2. When an order is selected, easy access to:
        - The Pre-QC checklist (linking to the page from Prompt 2.14 or embedding the form).
        - Associated PO document (fetch from `Order.associatedDocuments`).
        - Associated Sink Drawings (how are these stored/linked to an order? Investigate `AssociatedDocument` or other fields on `Order`).
    Propose how these elements would be laid out.
    ```
*   **(Further prompts for Cockpit implementation would follow, detailing API needs for fetching documents and the UI build.)**

---

## Phase 4: Testing and Submission

**Step 9: Write Tests**

*   **Prompt 4.1: Plan Tests**
    ```
    Outline the types of tests you will write for the new Pre-QC functionality:
    - Unit tests for any new utility functions or complex component logic.
    - Integration tests for the new API endpoints.
    - End-to-end tests for the Pre-QC workflow (navigating to an order, filling out the Pre-QC checklist with media, submitting).
    Refer to existing tests in `__tests__/` and `e2e/` for patterns.
    ```
*   **(Prompts to write each type of test would follow.)**

**Step 10: Submit Changes**

*   **Prompt 4.2: (Final Step)**
    ```
    Assuming all previous steps are complete, tests are passing, and the database is migrated and seeded correctly:
    Prepare a commit message summarizing the implementation of the Pre-QC checklist and media functionality.
    Propose a branch name for these changes (e.g., `feature/pre-qc-checklist`).
    (The actual commit/submit action would be performed by the user or controlling agent).
    ```

---
This guide provides a structured approach. The AI agent should seek clarification from the user if any prompt is ambiguous or if it encounters unexpected issues (like the file modification or database problems previously faced). Each prompt's output should be reviewed before the AI proceeds to the next.
