Coding Prompt Chains for Torvan Medical Workflow App Expansion (v4 - Next.js, Node.js, Prisma, PostgreSQL)
Here are a series of prompt chains to guide your AI coding assistant in expanding the CleanStation workflow application using Next.js for the frontend, a plain Node.js backend, Prisma ORM, and a PostgreSQL database. Remember to provide the AI assistant with access to your full GitHub repository (selcukcift/clean-stations) and all the provided documents.

General Guidelines for the AI Coding Assistant (Include with initial prompts):

0.1. Preserve Core Logic: The existing JavaScript files (app.js, sink-config.js, accessories.js, bom-generator.js) contain critical configurator and BOM generation logic. This logic must be preserved and integrated into the new application structure. Do not rewrite it unless explicitly asked and for a very good reason. Instead, build APIs or modules around it, likely on the backend.

0.2. Refer to Documentation (Primary Sources):

0.2.1. Torvan Medical CleanStation Production Workflow Digitalization.md (PRD v1.1): This is the primary specification document. Pay close attention to User Stories (Section 4), Data Models (Section 5), and Non-Functional Requirements (Section 6).

0.2.2. before sparc _sink prompt .txt: For any UI/UX nuances not explicitly covered or to understand the foundational aesthetic goals, though the PRD's NFR section (6.2) on UI/UX is more current and specific.

0.2.3. sink configuration and bom.txt: For detailed 5-step order creation process specifics and BOM item details, cross-reference with PRD UC 1.1 and UC 2.1.

0.2.4. CLP.T2.001.V01 - T2SinkProduction.docx: For exact production and QC checklist items, cross-reference with PRD UC 4.1, 4.2, 5.2, 5.5.

0.2.5. assemblies.json, categories.json, parts.json: As the initial source of truth for product data structure until migrated to the database. The PRD's Data Models (Section 5) provide target schema structures for Prisma.

0.3. Technology Stack:

0.3.1. Frontend: Latest Next.js (App Router recommended).

0.3.2. UI Components: ShadCN UI.

0.3.3. Styling: Tailwind CSS.

0.3.4. Animations: Framer Motion (for dropdowns, modals, step transitions: fade-in, slide-up, staggered lists).

0.3.5. State Management: Zustand with Immer (for slice-based store architecture, persistence, and devtools).

0.3.6. Backend: Plain Node.js (using the standard http or https module for server creation, request handling, and routing). No Express.js.

0.3.7. ORM: Prisma ORM.

0.3.8. Database: PostgreSQL. The target database is named "torvan-db" on your local PostgreSQL server. All existing tables within "torvan-db" should be wiped and recreated based on the Prisma schema.

0.4. Modular Design: Develop the application in a modular way, separating concerns.

0.5. Version Control: Work in a new branch. Commit frequently with clear messages.

0.6. Testing: Write unit and integration tests for new backend and frontend logic.

0.7. Security: Implement security best practices (PRD Section 6.7).

0.8. Compliance: Ensure system design supports ISO 13485:2016 requirements (PRD Section 6.4).

0.9. Accessibility: Adhere to WCAG guidelines (PRD Section 6.5).

0.10. Phased Approach: Refer to PRD Section 10.

Chain 1: Project Setup & Core Backend/Database Integration
Goal: Establish a robust plain Node.js backend with Prisma ORM connected to PostgreSQL, and migrate existing product data.

1.1. Setup Backend (Plain Node.js):

1.1.1. Initialize a new Node.js project (npm init -y).

1.1.2. Set up a project structure: src/ with api/ (for API route handlers), services/ (for business logic including refactored configurator logic), lib/ (for database client, helpers), config/.

1.1.3. Create a main server file (e.g., src/server.js) using the Node.js http module to create a server.

1.1.4. Implement a basic request router (e.g., a simple module in src/lib/router.js) to handle different URL paths and HTTP methods (GET, POST, PUT, DELETE). This router will parse req.url and req.method and delegate to appropriate handler functions in src/api/.

1.1.5. Implement helper functions in src/lib/requestUtils.js for parsing request bodies (e.g., JSON, form data) and sending JSON responses with appropriate status codes and headers.

1.1.6. Create a .gitignore file (include node_modules/, .env, dist/).

1.2. Setup PostgreSQL & Prisma Schemas:

1.2.1. Install Prisma CLI (npm install prisma --save-dev) and Prisma Client (npm install @prisma/client).

1.2.2. Initialize Prisma: npx prisma init --datasource-provider postgresql.

1.2.3. Configure prisma/schema.prisma to connect to your local PostgreSQL server and the "torvan-db" database. Use environment variables for the database URL (DATABASE_URL in .env file).

1.2.4. Define Prisma models in schema.prisma based on PRD Section 5.2 (Inventory Pool). Translate Mongoose concepts to Prisma:

Parts Model (Part): Key fields: partId (String, @id @unique, map to PartID from JSON), name (String), manufacturerPartNumber (String?), type (Enum PartType { COMPONENT, MATERIAL }), status (Enum Status { ACTIVE, INACTIVE }), photoURL (String?), technicalDrawingURL (String?). Define enums directly in schema.prisma.

Assemblies Model (Assembly): Key fields: assemblyId (String, @id @unique, map to AssemblyID), name (String), type (Enum AssemblyType { SIMPLE, COMPLEX, SERVICE_PART, KIT }), categoryCode (String?), subcategoryCode (String?), workInstructionId (String?, relation later), qrData (String?), kitComponentsJson (String?, for IsKit=true as per PRD, store as JSON string). Define components as a relation to AssemblyComponent model.

AssemblyComponent Model: id (Int, @id @default(autoincrement())), quantity (Int), notes (String?). Define relations: parentAssembly (Assembly @relation("ParentComponents", fields: [parentAssemblyId], references: [assemblyId])), parentAssemblyId (String); childPart (Part? @relation(fields: [childPartId], references: [partId])), childPartId (String?); childAssembly (Assembly? @relation("ChildComponents", fields: [childAssemblyId], references: [assemblyId])), childAssemblyId (String?). This allows a component to be either a Part or another Assembly.

Category & Subcategory Models: Category (categoryId String @id @unique, name String, description String?, subcategories Subcategory[]); Subcategory (subcategoryId String @id @unique, name String, description String?, category Category @relation(fields: [categoryId], references: [categoryId]), categoryId String, assemblies Assembly[] @relation("SubcategoryAssemblies")). Use explicit many-to-many relation for SubcategoryAssemblies if preferred over implicit.

1.2.5. Add @updatedAt and @createdAt timestamp fields to relevant models using @default(now()) and @updatedAt.

1.2.6. Run npx prisma generate to generate Prisma Client.

1.3. Data Migration Script & Database Reset:

1.3.1. Create a script scripts/seed.js. This script will use Prisma Client.

1.3.2. Database Reset: Before seeding, instruct the script (or manually run) npx prisma migrate reset --force to drop and recreate the "torvan-db" database and apply migrations. This ensures a clean slate. Alternatively, the script can execute raw SQL to drop tables if more control is needed before prisma db push or migrate dev.

1.3.3. Parse parts.json, assemblies.json, categories.json.

1.3.4. Use Prisma Client (e.g., prisma.part.createMany(), prisma.assembly.create()) to populate the PostgreSQL database according to the defined Prisma schemas.

Handle relationships carefully: create parent entities first, then link children. For AssemblyComponent, correctly link childPartId or childAssemblyId.

Implement error handling and logging for the seeding process.

1.4. API for Product Data (Plain Node.js Handlers):

1.4.1. In src/api/partsHandlers.js, src/api/assembliesHandlers.js, src/api/categoriesHandlers.js, create handler functions for product data.

1.4.2. Example for GET /api/parts:

Handler function: async function getParts(req, res) { ... }.

Use url.parse(req.url, true) to get query parameters for filtering (e.g., type, status, name) and pagination (page, limit).

Construct Prisma query: prisma.part.findMany({ where: { type: query.type, ... }, skip: (page - 1) * limit, take: limit }).

Get total count for pagination: prisma.part.count({ where: { ... } }).

Send JSON response: res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ data: parts, totalItems, totalPages, currentPage }));.

1.4.3. Implement handlers for:

GET /api/parts/:partId

GET /api/assemblies (with population for components using Prisma include)

GET /api/assemblies/:assemblyId

GET /api/categories (with population for subcategories and assemblies)

1.4.4. Register these handlers in your src/lib/router.js.

1.4.5. Implement robust error handling (e.g., try-catch blocks, sending 404 or 500 responses).

1.5. Integrate Existing Configurator Logic - Phase 1 Analysis:

1.5.1. Analyze app.js, sink-config.js, accessories.js, bom-generator.js.

1.5.2. Identify all external data dependencies (specific part attributes, assembly structures, pricing rules if any).

1.5.3. Map out input parameters and output structures for each core configuration function.

1.5.4. Document the step-by-step logic flow.

1.5.5. Plan refactoring into backend services (src/services/configuratorService.js, etc.) which will use Prisma Client to fetch data from PostgreSQL.

Chain 2: User Authentication & Authorization
Goal: Implement secure user management with role-based access control using plain Node.js backend and Prisma.

2.1. User Model (Prisma):

2.1.1. Define User model in prisma/schema.prisma based on PRD Section 5.7.

Fields: id (String, @id @default(cuid()) or uuid()), username (String, @unique), email (String, @unique), passwordHash (String), fullName (String), role (Enum UserRole { PRODUCTION_COORDINATOR, ADMIN, ... } from PRD Section 3), isActive (Boolean, @default(true)), initials (String).

Define UserRole enum in schema.prisma.

2.2. Registration & Login API (Plain Node.js Handlers):

2.2.1. Create src/api/authHandlers.js.

2.2.2. POST /api/auth/register handler:

Parse request body for username, email, password, fullName, role, initials.

Validate inputs.

Hash password using bcryptjs before saving.

Use prisma.user.create() to save the new user.

Return 201 with user data (excluding passwordHash).

2.2.3. POST /api/auth/login handler:

Parse request body for username (or email) and password.

Fetch user using prisma.user.findUnique({ where: { usernameOrEmail } }).

Compare hashed password using bcryptjs.compare().

If valid, generate JWT (using jsonwebtoken) with userId, username, role, fullName.

Return 200 with JWT.

2.2.4. Register handlers in src/lib/router.js.

2.3. Authentication Middleware Pattern (Plain Node.js):

2.3.1. Create src/lib/authMiddleware.js with a protectRoute(handler) function. This higher-order function wraps your actual route handler.

2.3.2. Inside protectRoute:

Extract JWT from req.headers.authorization (Bearer token).

Verify JWT using jsonwebtoken.verify().

If valid, fetch user from PostgreSQL via Prisma (prisma.user.findUnique({ where: { id: decoded.userId } })) and attach to req.user.

Call the original handler(req, res).

If invalid/missing JWT, send 401 response.

2.4. Authorization Middleware Pattern (Plain Node.js):

2.4.1. In src/lib/authMiddleware.js, create authorizeRoles(...allowedRoles) which returns a function that wraps a handler, similar to protectRoute.

2.4.2. This wrapper function (used after protectRoute's effect) checks if req.user.role is in allowedRoles.

2.4.3. If not authorized, send 403 response. Otherwise, call the original handler.

2.4.4. Example usage in router: router.get('/api/admin/data', protectRoute(authorizeRoles(UserRole.ADMIN)(adminDataHandler))).

2.5. Frontend Integration - Basic Login UI (Next.js):

2.5.1. Create /login Next.js page with ShadCN UI Form, Input, Button.

2.5.2. On submit, call POST /api/auth/login using fetch or Axios.

2.5.3. Store JWT securely (Zustand store syncing with localStorage or sessionStorage, or HttpOnly cookies managed via Next.js API routes if you decide to use them for auth proxying).

2.5.4. Configure API client (Axios instance or fetch wrapper) to include JWT in Authorization header.

2.5.5. Implement logout (clear token, redirect). Style per PRD Section 6.2.

Chain 3: Advanced Order Creation Workflow (Frontend & Backend - PRD UC 1.1)
Goal: Implement the 5-step order creation wizard using plain Node.js backend and Prisma.

3.1. Order Model (Prisma):

3.1.1. Define Order model in prisma/schema.prisma based on PRD Section 5.1.

Fields: id (String, @id @default(cuid())), poNumber (String, @unique), buildNumber (String), customerName (String), etc.

OrderStatus enum (as defined in PRD 5.1).

Relations for BasinConfiguration, FaucetConfiguration, SprayerConfiguration, SelectedAccessory (these will be separate related models, not embedded arrays like Mongoose).

Example: BasinConfiguration model with fields from PRD UC 1.1 Step 3, and a one-to-many relation to Order.

createdBy (User @relation(fields: [createdById], references: [id])), createdById (String).

generatedBoms (Bom[] @relation("OrderBoms")).

AssociatedDocument model related to Order. Fields: id, docName, docURL, uploadedBy (String), timestamp, order (Order @relation(fields: [orderId], references: [id])), orderId (String).

3.1.2. Define @uniqueConstraint([poNumber, buildNumber]) if buildNumber should be unique within a PO.

3.2. Order Creation API - Backend (Plain Node.js Handler):

3.2.1. Create POST /api/orders handler in src/api/ordersHandlers.js.

3.2.2. Protected by protectRoute and authorizeRoles([UserRole.PRODUCTION_COORDINATOR, UserRole.ADMIN]).

3.2.3. Parse full order data from request body.

3.2.4. Validate data rigorously against PRD UC 1.1 requirements (use a validation library like Zod on the backend before Prisma interaction if complex).

3.2.5. Use prisma.order.create() with nested writes for related configurations (e.g., basinConfigurations: { create: [...] }).

3.2.6. Ensure poNumber uniqueness.

3.2.7. Return 201 Created with the new order object (including populated relations).

3.3. File Upload for PO Document - Backend (Plain Node.js):

3.3.1. For the PO document upload:

The request will be multipart/form-data. Use a library like formidable or parse manually if simple.

Save the uploaded file to a configured directory (e.g., uploads/po_documents/).

After successful upload, create an AssociatedDocument record in Prisma linked to the order.

3.4. Frontend - Step 1: Customer & Order Information - PRD UC 1.1 (Next.js):

3.4.1. Develop Next.js page/component for Step 1.

3.4.2. Use ShadCN Form, Input, DatePicker, Textarea, RadioGroup, and a file upload component.

3.4.3. Client-side validation (ShadCN Form with Zod). Manage state with Zustand. Adhere to PRD 6.2.

3.5. Frontend - Step 2: Sink Selection & Quantity - PRD UC 1.1 (Next.js):

3.5.1. Develop Step 2 UI.

3.5.2. Selection for Sink Family. Input for Quantity. Dynamic fields for Unique Build Number.

3.5.3. Client-side validation for unique build numbers. Update Zustand store.

3.6. Integrate sink-config.js & accessories.js Logic into Backend Modules (Prisma):

3.6.1. Backend Services (src/services/configuratorService.js):

Encapsulate logic from sink-config.js and accessories.js. Use Prisma Client to fetch data from PostgreSQL.

Define API endpoints (e.g., GET /api/configurator/sink-models?family=MDRD) handled by plain Node.js functions in src/api/configuratorHandlers.js. These handlers call the service methods.

APIs return dynamic options based on prior selections.

3.6.2. Frontend - Step 3 & 4 (Sink Configurations & Accessories - PRD UC 1.1 - Next.js):

Develop UI for Step 3 (Sink Configuration) and Step 4 (Add-on Accessories) per PRD UC 1.1.

Fetch options dynamically from the new configurator APIs.

Manage selections with Zustand. Implement custom part number generation display.

3.7. Integrate bom-generator.js Logic into Backend Module & BOM Model (Prisma):

3.7.1. Backend Service (src/services/bomService.js):

Refactor bom-generator.js logic. Input: sink configuration object.

Logic: Query PostgreSQL via Prisma (Part, Assembly, AssemblyComponent). Implement rules from sink configuration and bom.txt & PRD UC 2.1. Handle custom parts. Include standard manuals/packaging. Output: Hierarchical BOM structure.

3.7.2. BOM Model (Bom in prisma/schema.prisma):

Based on PRD Section 5.3. id (String, @id @default(cuid())), order (Order @relation("OrderBoms", fields: [orderId], references: [id])), orderId (String), buildNumber (String), generatedAt (DateTime @default(now())).

BomItem model: id, bom (Bom @relation(fields: [bomId], references: [id])), bomId (String), partIdOrAssemblyId (String), name (String), quantity (Int), itemType (String), isCustom (Boolean), parentId (String?, for hierarchy), children (BomItem[] @relation("ParentChildBomItem", fields: [], references: [])). Define self-relation for hierarchy.

3.7.3. Order Creation API Enhancement:

After order input validation, loop through configured sinks.

Call bomService.generateBOM(sinkConfig).

Save each BOM using prisma.bom.create() with nested BomItem creations.

3.8. Frontend - Step 5: Review and Submit - PRD UC 1.1 (Next.js):

3.8.1. Develop Step 5 UI. Display summary. Use ShadCN Accordion or Tabs.

3.8.2. Preview BOM by fetching from a 'dry-run' API or display if generated per step.

3.8.3. Submit complete order data from Zustand to POST /api/orders. Handle API responses.

3.9. Multi-Step Form Navigation & UI (Next.js):

3.9.1. Client-side routing for steps. Persist form state with Zustand.

3.9.2. Implement ShadCN Breadcrumb. Adhere to PRD Section 6.2.

Chain 4: Role-Based Dashboards & Order Viewing
Goal: Create tailored dashboards (PRD Section 3 & 4.8) using plain Node.js backend and Prisma.

4.1. API for Orders - Listing, Details, Filtering (Plain Node.js Handlers & Prisma):

4.1.1. Enhance order API handlers in src/api/ordersHandlers.js.

4.1.2. GET /api/orders handler:

Use Prisma for filtering (construct where object), sorting (orderBy), and pagination (skip, take).

Populate relations like createdBy.fullName and BOM summary using Prisma include.

Return { data: orders, totalItems, totalPages, currentPage }.

4.1.3. GET /api/orders/:orderId handler:

Return full order details, deeply populating User, AssociatedDocument, and Bom (with BomItem) using Prisma include.

4.1.4. Apply role-based filtering in service layer if needed.

4.2. Basic Dashboard Structure - Frontend (Next.js):

4.2.1. Create DashboardLayout component (fixed sidebar, top toolbar).

4.2.2. Render content/redirect based on user role from Zustand.

4.3. Production Coordinator Dashboard - PRD Section 3.1 & UC 1.2 (Next.js):

4.3.1. Create ProductionCoordinatorDashboard component.

4.3.2. 'Create New Order' button. ShadCN DataTable for orders. Filtering/sorting.

4.3.3. Click order to view details. Update status to 'Shipped' (PRD UC 1.3).

4.4. Procurement Specialist Dashboard - PRD Section 3.3 & UC 3.x (Next.js):

4.4.1. Create ProcurementDashboard component.

4.4.2. Tabs for 'Production Orders' and 'Service Part Requests'. Data table for orders.

4.4.3. Actions: View BOM, mark parts for outsourcing (requires schema update to BomItem or related model for tracking outsourced status), approve BOM, update order status.

4.5. QC Person Dashboard - PRD Section 3.4 & UC 4.x (Next.js):

4.5.1. Create QCDashboard component.

4.5.2. Tabs for 'Orders Awaiting Pre-QC' and 'Orders Awaiting Final QC'. Data table.

4.5.3. Navigate to order details for QC forms (Chain 6).

4.6. Assembler Dashboard - PRD Section 3.5 & UC 5.x (Next.js):

4.6.1. Create AssemblerDashboard component.

4.6.2. Data table for 'Ready for Production' orders.

4.6.3. 'Claim Task'. Navigate to order details for assembly guidance (Chain 6).

4.7. Admin Dashboard - PRD Section 3.2 & UC 7.x (Next.js):

4.7.1. Create AdminDashboard component with sections:

Order Overview.

User Management (CRUD for users via Prisma, assign roles).

Data Management (Parts, Assemblies, Categories via Prisma). Later: Work Instructions, QC Templates, Tools.

System Configuration.

QR Code Generation (PRD UC 7.3).

4.8. UI/UX for Dashboards & Order Lists - PRD Section 6.2 (Next.js):

4.8.1. Use ShadCN DataTable, Card, Badge, Tooltip.

4.8.2. Strictly follow PRD 6.2 for layout, typography, color, icons, animations.

Chain 5: Workflow State Management & Progression (PRD Section 5.1)
Goal: Implement order state transitions using plain Node.js backend and Prisma.

5.1. Define Order Statuses & History (Prisma):

5.1.1. Define OrderStatus enum in prisma/schema.prisma (e.g., ORDER_CREATED, PARTS_SENT_WAITING_ARRIVAL).

5.1.2. Create OrderHistoryLog model in prisma/schema.prisma: id, order (Order @relation(fields: [orderId], references: [id])), orderId (String), timestamp (DateTime @default(now())), user (User @relation(fields: [userId], references: [id])), userId (String), action (String), oldStatus (String?), newStatus (String?), notes (String?).

5.2. API for Updating Order Status - Backend (Plain Node.js Handler & Prisma):

5.2.1. Create PUT /api/orders/:orderId/status handler.

5.2.2. Request body: { newStatus: String, notes?: String }.

5.2.3. Service-level logic: Validate newStatus. Verify role-based transition rules.

5.2.4. If valid, update Order.status and create a new OrderHistoryLog record in a Prisma transaction: prisma.$transaction([prisma.order.update(...), prisma.orderHistoryLog.create(...)]).

5.2.5. Return updated order.

5.3. Frontend Order Actions for Status Change (Next.js):

5.3.1. Conditionally render action buttons based on order.status and user.role.

5.3.2. Clicking button calls PUT /api/orders/:orderId/status.

5.4. Notifications - Basic In-App - PRD UC 8.4 (Next.js & Prisma):

5.4.1. Notification model (Prisma): id, recipient (User @relation(fields: [recipientId], references: [id])), recipientId (String), message (String), linkToOrder (String?), isRead (Boolean, @default(false)), type (String?), createdAt (DateTime @default(now())).

5.4.2. Triggering Notifications (Backend): In services, use prisma.notification.create() after key events.

5.4.3. Frontend Display: Notification icon in toolbar. Popover lists notifications fetched via API. Clickable. Mark as read (API call to update isRead). Use ShadCN Toast.

Chain 6: Production & QC Checklists (Digitalization - PRD UC 4.x, 5.x, Sections 5.8-5.10)
Goal: Digitize checklists using plain Node.js backend and Prisma.

6.1. Checklist Models (Prisma):

6.1.1. QCFormTemplate model: id, templateName (String, @unique), formType (Enum FormType { PreQC, FinalQC, ... }), version (Int), applicableSinkFamily (String?), CLPReferenceDocument (String?).

checklistItems (QCFormTemplateItem[]).

6.1.2. QCFormTemplateItem model: id, template (QCFormTemplate @relation(fields: [templateId], references: [id])), templateId (String), itemId (String, unique within template), section (String), itemDescription (String), checkType (Enum CheckType { Boolean, Text, ... }), isBasinSpecific (Boolean), guidanceText (String?), isMandatory (Boolean). Add @unique([templateId, itemId]).

6.1.3. QCResult model: id, order (Order @relation(fields: [orderId], references: [id])), orderId (String), buildNumber (String?), qcFormTemplate (QCFormTemplate @relation(fields: [qcFormTemplateId], references: [id])), qcFormTemplateId (String), qcTypePerformed (Enum FormType), performedByUser (User @relation(fields: [performedByUserId], references: [id])), performedByUserId (String), jobIDFromChecklist (String?), numBasinsFromChecklist (Int?), timestamp (DateTime @default(now())), overallStatus (Enum QCStatus { Pass, Fail, ... }).

itemResults (QCItemResult[]).

digitalSignatureUserId (String?), digitalSignatureUserName (String?), digitalSignatureUserInitials (String?), digitalSignatureSignedAt (DateTime?).

6.1.4. QCItemResult model: id, qcResult (QCResult @relation(fields: [qcResultId], references: [id])), qcResultId (String), templateItem (QCFormTemplateItem @relation(fields: [templateItemId], references: [id])), templateItemId (String), resultValueJson (String, store complex results as JSON string), isNA (Boolean, @default(false)), notes (String?).

6.1.5. Similar TestingFormTemplate, TestingResult models if needed.

6.2. API for Checklists - Backend (Plain Node.js Handlers & Prisma):

6.2.1. Admin Template API (src/api/adminQCTemplateHandlers.js):

POST, GET, PUT, DELETE /api/admin/qc-form-templates using Prisma Client for CRUD.

6.2.2. QC Result API (src/api/qcResultHandlers.js):

POST /api/orders/:orderId/qc-results: Create QCResult linked to QCFormTemplate.

GET /api/orders/:orderId/qc-results: Get all QCResult for an order (include template and item results).

GET /api/qc-results/:qcResultId: Get specific QCResult.

PUT /api/qc-results/:qcResultId: Update QCResult (especially itemResults and overallStatus). Use Prisma nested writes or transactional updates for itemResults.

6.3. Frontend for Checklist Template Management - Admin - PRD UC 7.2 (Next.js):

6.3.1. Admin UI for CRUD on QCFormTemplates and their QCFormTemplateItems.

6.4. Frontend for Filling Checklists - QC/Assembler - PRD UC 4.1, 4.2, 5.2, 5.3 (Next.js):

6.4.1. On order detail page, fetch and render QCResult form based on its template.

6.4.2. Group items by section. Render appropriate ShadCN inputs. Pre-fill.

6.4.3. Auto-save or manual save to PUT /api/qc-results/:qcResultId.

6.4.4. 'Finalize & Sign' button to update status and record signature details.

6.5. Link Checklist Completion to Order Status (Backend Logic):

6.5.1. In backend service for PUT /api/qc-results/:qcResultId: if overallStatus is 'Pass' for critical checklist, trigger order status update service.

Chain 7: BOM Management & Reporting Enhancement (PRD UC 2.x)
Goal: Enhance BOM features using plain Node.js backend and Prisma.

7.1. API for BOM Access - Backend (Plain Node.js Handler & Prisma):

7.1.1. Create GET /api/orders/:orderId/boms or GET /api/boms?orderId=X&buildNumber=Y handler.

7.1.2. Fetch Bom documents and their related BomItems using Prisma include for hierarchical structure.

7.2. Frontend BOM View - PRD UC 2.2 (Next.js):

7.2.1. On order details, fetch and render BOM hierarchically (ShadCN DataTable with expandable rows or custom tree).

7.3. BOM Export - PRD UC 2.3 (Plain Node.js Backend):

7.3.1. Backend: GET /api/boms/:bomId/export?format=csv handler.

Fetch BOM data via Prisma.

Use json2csv or similar for CSV. Set Content-Disposition, Content-Type.

For PDF: pdfmake server-side or recommend client-side library.

7.3.2. Frontend: 'Export CSV/PDF' buttons linking to backend.

7.4. Share BOM - Optional - PRD UC 2.3:

7.4.1. Backend: Endpoint to generate temporary token for read-only BOM view.

7.4.2. Frontend: 'Share' button.

Chain 8: UI/UX Refinement and Styling (Adherence to PRD Section 6.2)
Goal: Ensure strict adherence to PRD Section 6.2 UI/UX guidelines. (No major changes from v3, primarily frontend)

8.1. Consistent Styling & Component Usage Review.

8.2. Responsiveness Testing.

8.3. Accessibility Review - PRD Section 6.5.

8.4. UX Patterns Implementation Review - PRD Section 6.2.

8.5. Benchmark Adherence & Overall Polish - PRD Section 6.2.

Chain 9: Implementing Other Sink Families (MDRD is baseline - Future Scope)
Goal: Placeholder for "Endoscope CleanStation" and "InstroSink". (No major changes from v3)

9.1. Placeholder Pages - PRD Section 1.3, 7.

Chain 10: Service Department Workflow (PRD UC 3.5, 6.1, Section 5.11)
Goal: Implement parts ordering for Service Dept. using plain Node.js backend and Prisma.

10.1. Service Order Model (Prisma - PRD Section 5.11):

10.1.1. ServiceOrder model: id, requestedByUser (User @relation), requestTimestamp, status (Enum ServiceOrderStatus), notes?.

items (ServiceOrderItem[]).

10.1.2. ServiceOrderItem model: id, serviceOrder (ServiceOrder @relation), part (Part @relation), quantity.

10.2. API for Service Orders - Backend (Plain Node.js Handlers & Prisma):

10.2.1. POST /api/service-orders handler (for 'ServiceDepartment').

10.2.2. GET /api/service-orders handler (role-based filtering). Populate relations.

10.2.3. GET /api/service-orders/:serviceOrderId handler.

10.2.4. PUT /api/service-orders/:serviceOrderId/status handler (for 'ProcurementSpecialist'/'Admin').

10.3. Frontend - Service Part Ordering UI - PRD UC 6.1 (Next.js):

10.3.1. For 'ServiceDepartment' role: Browse/Search Parts (ShadCN DataTable from /api/parts).

10.3.2. "Request cart" (Zustand). Submit to POST /api/service-orders.

10.4. Frontend - Procurement View of Service Orders - PRD UC 3.5 (Next.js):

10.4.1. Procurement dashboard: Tab for 'Service Part Requests'. DataTable of service orders.

10.4.2. View details. Update status via API.

This version (v4) should give your AI coding assistant a very granular and well-specified set of tasks aligned with your updated technology stack.