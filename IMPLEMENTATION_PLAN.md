# Implementation Plan: CPCv5 Chains 1-6 Completion

**Project**: Torvan Medical CleanStation Workflow Digitalization  
**Document**: Retrospective Implementation Plan  
**Target**: Complete all missing/partial implementations through Chain 6  
**Created**: June 1, 2025

---

## Executive Summary

This plan addresses critical gaps identified in the CPCv5 verification report, focusing on completing the core workflow functionality through Chain 6. The plan is structured in priority order to ensure production readiness with minimal risk.

**Estimated Timeline**: 3-4 sprints (6-8 weeks)  
**Critical Path**: Configurator Services → Frontend Integration → BOM Export → QC System

---

## Sprint 1: Core Configurator Services (Week 1-2)

### 🎯 **Goal**: Complete dynamic configurator backend services for order creation workflow

### **Task 1.1: Complete `src/services/configuratorService.js`** 
**Priority**: 🔴 Critical  
**Estimated Effort**: 3-4 days  
**Dependencies**: Database seeded with parts.json, assemblies.json

**Current State**: Basic structure exists, business logic missing  
**Target State**: Full configurator business logic implementation

**Detailed Implementation Steps**:

1. **Custom Part Number Generation Logic**
   ```javascript
   // Implement in configuratorService.js
   generateCustomPegboardPartNumber(width, length) {
     return `720.215.002 T2-ADW-PB-${width}x${length}`;
   }
   
   generateCustomBasinPartNumber(basinType, width, length, depth) {
     // Rules from sink configuration and bom.txt
   }
   ```

2. **Enhanced Business Logic Functions**
   - `getPegboardOptions(sinkDimensions)`: Implement "Same as Sink Length" logic
   - `getBasinSizeOptions(basinType)`: Custom size generation rules
   - `getControlBox(basinConfigurationsArray)`: Multi-basin control box logic
   - `getFaucetTypeOptions(basinType)`: Conditional faucet availability

3. **Integration with Prisma Database**
   - Replace hardcoded data with dynamic Prisma queries
   - Add error handling for missing parts/assemblies
   - Implement caching for frequently accessed data

**Acceptance Criteria**:
- All configurator API endpoints return dynamic data
- Custom part numbers generate correctly
- Control box logic handles multiple basin configurations
- DI basin automatically selects compatible faucets

---

### **Task 1.2: Complete `src/services/accessoriesService.js`**
**Priority**: 🔴 Critical  
**Estimated Effort**: 2-3 days  
**Dependencies**: Categories seeded in database

**Current State**: Skeleton file with minimal implementation  
**Target State**: Full accessories data service

**Implementation Steps**:

1. **Core Service Functions**
   ```javascript
   async getAccessoryCategories() {
     // Fetch subcategories under "ACCESSORY LIST" (720)
     return await prisma.category.findMany({
       where: { parentCode: '720' },
       include: { assemblies: true }
     });
   }
   
   async getAccessoriesByCategory(categoryCode) {
     // Fetch assemblies for specific category
   }
   
   async getAllAccessories({ searchTerm, categoryFilter, priceRange }) {
     // Advanced filtering and search
   }
   ```

2. **Search and Filtering Logic**
   - Text search across assembly names and descriptions
   - Category-based filtering
   - Price range filtering (if pricing data available)
   - Sorting options (name, price, category)

3. **Performance Optimization**
   - Implement pagination for large accessory lists
   - Add database indexes for search performance
   - Cache frequently accessed category data

**Acceptance Criteria**:
- Categories load dynamically from database
- Search and filtering work correctly
- Pagination handles large datasets
- API responses include all necessary accessory metadata

---

### **Task 1.3: Update Frontend Order Steps for Dynamic Data**
**Priority**: 🔴 Critical  
**Estimated Effort**: 3-4 days  
**Dependencies**: Tasks 1.1 and 1.2 completion

**Current State**: React components exist but use mock/static data  
**Target State**: Fully dynamic data integration

**Implementation Steps**:

1. **Update `ConfigurationStep.tsx`**
   ```typescript
   // Replace static options with API calls
   const [sinkModels, setSinkModels] = useState([]);
   const [legTypes, setLegTypes] = useState([]);
   // ... other state variables
   
   useEffect(() => {
     // Fetch initial configuration options
     fetchSinkModels(selectedFamily);
     fetchLegTypes();
     fetchFeetTypes();
   }, [selectedFamily]);
   
   // Add dependent option loading
   useEffect(() => {
     if (selectedBasinType) {
       fetchFaucetOptions(selectedBasinType);
     }
   }, [selectedBasinType]);
   ```

2. **Update `AccessoriesStep.tsx`**
   ```typescript
   // Implement dynamic accessory loading
   const [categories, setCategories] = useState([]);
   const [accessories, setAccessories] = useState([]);
   const [searchTerm, setSearchTerm] = useState('');
   
   // Add search and filtering functionality
   const handleSearch = useDebouncedCallback(async (term) => {
     const results = await nextJsApiClient.get('/accessories', {
       params: { searchTerm: term, categoryFilter: selectedCategory }
     });
     setAccessories(results.data);
   }, 300);
   ```

3. **Enhance `orderCreateStore.ts`**
   ```typescript
   // Add proper state management for dynamic data
   interface OrderCreateState {
     // Configuration selections
     selectedSinkModel: string | null;
     selectedLegType: string | null;
     customPegboardDimensions: { width: number; length: number } | null;
     basinConfigurations: BasinConfiguration[];
     selectedAccessories: SelectedAccessory[];
     
     // Dynamic data caches
     availableOptions: {
       sinkModels: SinkModel[];
       legTypes: LegType[];
       faucetTypes: FaucetType[];
       // ... other option types
     };
     
     // Actions
     updateConfiguration: (field: string, value: any) => void;
     addBasinConfiguration: (config: BasinConfiguration) => void;
     removeBasinConfiguration: (index: number) => void;
   }
   ```

**Acceptance Criteria**:
- All dropdowns populate from backend APIs
- Dependent selections update automatically (e.g., faucets update when basin type changes)
- Custom part numbers display correctly in UI
- Order store captures all configuration data properly
- Loading states and error handling implemented

---

## Sprint 2: BOM Export & UI Polish (Week 3-4)

### **Task 2.1: Implement BOM Export API**
**Priority**: 🟡 High  
**Estimated Effort**: 2-3 days  
**Dependencies**: Order BOM data structure exists

**Current State**: BOM data displayed in UI, no export functionality  
**Target State**: CSV/PDF export API endpoints

**Implementation Steps**:

1. **Create Export API Route**
   ```typescript
   // app/api/orders/[orderId]/bom/export/route.ts
   export async function GET(
     request: NextRequest,
     { params }: { params: { orderId: string } }
   ) {
     const { searchParams } = new URL(request.url);
     const format = searchParams.get('format') || 'csv';
     
     // Authenticate user
     const user = await getAuthUser(request);
     if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     
     // Fetch BOM data with hierarchy
     const bom = await prisma.bom.findFirst({
       where: { orderId: params.orderId },
       include: {
         bomItems: {
           orderBy: { order: 'asc' },
           include: {
             part: true,
             assembly: true
           }
         }
       }
     });
     
     if (format === 'csv') {
       return generateCSVResponse(bom);
     } else if (format === 'pdf') {
       return generatePDFResponse(bom);
     }
   }
   ```

2. **CSV Generation Logic**
   ```typescript
   function generateCSVResponse(bom: BomWithItems) {
     const csvData = [
       ['Level', 'Part Number', 'Description', 'Quantity', 'Type', 'Category'],
       ...bom.bomItems.map(item => [
         item.level || '1',
         item.partIdOrAssemblyId,
         item.name,
         item.quantity.toString(),
         item.itemType,
         item.category || ''
       ])
     ];
     
     const csvContent = csvData.map(row => 
       row.map(field => `"${field}"`).join(',')
     ).join('\n');
     
     return new NextResponse(csvContent, {
       headers: {
         'Content-Type': 'text/csv',
         'Content-Disposition': `attachment; filename="bom_order_${bom.orderId}.csv"`
       }
     });
   }
   ```

3. **PDF Generation (Future Enhancement)**
   - Install pdfmake or puppeteer
   - Create BOM template with company branding
   - Generate hierarchical PDF with proper formatting

**Acceptance Criteria**:
- CSV export generates correct BOM structure
- File downloads with proper filename
- Authentication and authorization enforced
- Error handling for missing BOMs

---

### **Task 2.2: Frontend BOM Export Integration**
**Priority**: 🟡 High  
**Estimated Effort**: 1-2 days  
**Dependencies**: Task 2.1 completion

**Implementation Steps**:

1. **Update Order Details Page**
   ```typescript
   // app/orders/[orderId]/page.tsx
   const handleBOMExport = async (format: 'csv' | 'pdf') => {
     try {
       const response = await nextJsApiClient.get(
         `/orders/${orderId}/bom/export?format=${format}`,
         { responseType: 'blob' }
       );
       
       // Create download link
       const url = window.URL.createObjectURL(new Blob([response.data]));
       const link = document.createElement('a');
       link.href = url;
       link.setAttribute('download', `bom_order_${orderId}.${format}`);
       document.body.appendChild(link);
       link.click();
       link.remove();
       window.URL.revokeObjectURL(url);
       
       toast({
         title: "Export Successful",
         description: `BOM exported as ${format.toUpperCase()}`
       });
     } catch (error) {
       toast({
         variant: "destructive",
         title: "Export Failed",
         description: "Unable to export BOM"
       });
     }
   };
   ```

2. **Enhanced BOM Display Component**
   ```typescript
   // components/order/BOMDisplay.tsx
   export function BOMDisplay({ bom, orderId }: BOMDisplayProps) {
     return (
       <Card>
         <CardHeader className="flex flex-row items-center justify-between">
           <CardTitle>Bill of Materials</CardTitle>
           <div className="flex gap-2">
             <Button 
               onClick={() => handleBOMExport('csv')}
               variant="outline"
               size="sm"
             >
               <Download className="w-4 h-4 mr-2" />
               Export CSV
             </Button>
             <Button 
               onClick={() => handleBOMExport('pdf')}
               variant="outline"
               size="sm"
               disabled // Enable when PDF is implemented
             >
               <FileText className="w-4 h-4 mr-2" />
               Export PDF
             </Button>
           </div>
         </CardHeader>
         <CardContent>
           {/* Hierarchical BOM table */}
           <BOMTable items={bom.bomItems} />
         </CardContent>
       </Card>
     );
   }
   ```

**Acceptance Criteria**:
- Export buttons visible on order details page
- CSV download works correctly
- PDF button present but disabled (for future implementation)
- Success/error notifications displayed
- Loading states during export

---

## Sprint 3: QC Checklist System - Backend (Week 5-6)

### **Task 3.1: Implement QC Checklist Prisma Models**
**Priority**: 🟡 High  
**Estimated Effort**: 1-2 days  
**Dependencies**: None

**Current State**: Models missing from schema  
**Target State**: Complete QC checklist data model

**Implementation Steps**:

1. **Add Prisma Models**
   ```prisma
   // prisma/schema.prisma
   
   model QcFormTemplate {
     id                    String   @id @default(cuid())
     name                  String   // "T2 Sink Production Checklist"
     version               String   @default("1.0")
     description           String?
     isActive              Boolean  @default(true)
     appliesToProductFamily String? // "MDRD_T2_SINK"
     createdAt             DateTime @default(now())
     updatedAt             DateTime @updatedAt
     
     // Relations
     items                 QcFormTemplateItem[]
     orderQcResults        OrderQcResult[]
   }
   
   model QcFormTemplateItem {
     id            String   @id @default(cuid())
     templateId    String
     section       String   // "Pre-Assembly Checks", "Basin Installation"
     checklistItem String   // Text of the check
     itemType      QcItemType
     options       Json?    // For select types
     expectedValue String?  // For validation
     order         Int      // Display sequence
     isRequired    Boolean  @default(true)
     
     // Relations
     template      QcFormTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
     itemResults   OrderQcItemResult[]
   }
   
   model OrderQcResult {
     id                String   @id @default(cuid())
     orderId           String
     qcFormTemplateId  String
     qcPerformedById   String
     qcTimestamp       DateTime @default(now())
     overallStatus     QcStatus @default(PENDING)
     notes             String?
     
     // Relations
     order             Order    @relation(fields: [orderId], references: [id])
     qcFormTemplate    QcFormTemplate @relation(fields: [qcFormTemplateId], references: [id])
     qcPerformedBy     User     @relation("UserQcResults", fields: [qcPerformedById], references: [id])
     itemResults       OrderQcItemResult[]
     
     @@unique([orderId, qcFormTemplateId])
   }
   
   model OrderQcItemResult {
     id                     String   @id @default(cuid())
     orderQcResultId        String
     qcFormTemplateItemId   String
     resultValue            String?  // Store various input types
     isConformant           Boolean? // For pass/fail items
     notes                  String?
     
     // Relations
     orderQcResult          OrderQcResult @relation(fields: [orderQcResultId], references: [id], onDelete: Cascade)
     qcFormTemplateItem     QcFormTemplateItem @relation(fields: [qcFormTemplateItemId], references: [id])
   }
   
   enum QcItemType {
     PASS_FAIL
     TEXT_INPUT
     NUMERIC_INPUT
     SINGLE_SELECT
     MULTI_SELECT
     DATE_INPUT
     CHECKBOX
   }
   
   enum QcStatus {
     PENDING
     IN_PROGRESS
     PASSED
     FAILED
     REQUIRES_REVIEW
   }
   ```

2. **Run Migration**
   ```bash
   npx prisma migrate dev --name add_qc_checklist_models
   npx prisma generate
   ```

3. **Create Seed Data for T2 Checklist**
   ```javascript
   // scripts/seedQcTemplates.js
   const t2Template = {
     name: "T2 Sink Production Checklist",
     version: "1.0",
     appliesToProductFamily: "MDRD_T2_SINK",
     items: [
       {
         section: "Pre-Assembly Checks",
         checklistItem: "Verify all parts are present per BOM",
         itemType: "PASS_FAIL",
         order: 1
       },
       {
         section: "Basin Installation", 
         checklistItem: "Basin properly mounted and level",
         itemType: "PASS_FAIL",
         order: 2
       },
       // ... more items from CLP.T2.001.V01 document
     ]
   };
   ```

**Acceptance Criteria**:
- All QC models created without errors
- Migration runs successfully
- Prisma client generates new types
- Seed data creates sample T2 checklist template

---

### **Task 3.2: Create QC Template Management APIs**
**Priority**: 🟡 High  
**Estimated Effort**: 2-3 days  
**Dependencies**: Task 3.1 completion

**Implementation Steps**:

1. **Admin QC Template APIs**
   ```typescript
   // app/api/admin/qc-templates/route.ts
   export async function GET(request: NextRequest) {
     const user = await getAuthUser(request);
     if (!checkUserRole(user, ['ADMIN'])) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
     }
     
     const templates = await prisma.qcFormTemplate.findMany({
       include: {
         items: {
           orderBy: { order: 'asc' }
         },
         _count: {
           select: { orderQcResults: true }
         }
       }
     });
     
     return NextResponse.json({ templates });
   }
   
   export async function POST(request: NextRequest) {
     const user = await getAuthUser(request);
     if (!checkUserRole(user, ['ADMIN'])) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
     }
     
     const body = await request.json();
     const validatedData = QcTemplateCreateSchema.parse(body);
     
     const template = await prisma.qcFormTemplate.create({
       data: {
         ...validatedData,
         items: {
           create: validatedData.items
         }
       },
       include: { items: true }
     });
     
     return NextResponse.json({ template }, { status: 201 });
   }
   ```

2. **Individual Template Management**
   ```typescript
   // app/api/admin/qc-templates/[templateId]/route.ts
   export async function GET(request: NextRequest, { params }: { params: { templateId: string } }) {
     // Get specific template with items
   }
   
   export async function PUT(request: NextRequest, { params }: { params: { templateId: string } }) {
     // Update template and items (transaction-based)
   }
   
   export async function DELETE(request: NextRequest, { params }: { params: { templateId: string } }) {
     // Delete template (cascade to items)
   }
   ```

3. **Validation Schemas**
   ```typescript
   // lib/validationSchemas.ts
   export const QcTemplateCreateSchema = z.object({
     name: z.string().min(1),
     version: z.string().default("1.0"),
     description: z.string().optional(),
     appliesToProductFamily: z.string().optional(),
     items: z.array(z.object({
       section: z.string(),
       checklistItem: z.string(),
       itemType: z.enum(['PASS_FAIL', 'TEXT_INPUT', 'NUMERIC_INPUT', 'SINGLE_SELECT', 'MULTI_SELECT']),
       options: z.array(z.string()).optional(),
       expectedValue: z.string().optional(),
       order: z.number(),
       isRequired: z.boolean().default(true)
     }))
   });
   ```

**Acceptance Criteria**:
- CRUD operations work for QC templates
- Proper authentication and authorization
- Validation prevents invalid data
- Template items can be reordered
- Error handling for edge cases

---

## Sprint 4: QC Checklist System - Frontend (Week 7-8)

### **Task 4.1: Build QC Template Management UI**
**Priority**: 🟡 High  
**Estimated Effort**: 3-4 days  
**Dependencies**: Task 3.2 completion

**Implementation Steps**:

1. **Template List Page**
   ```typescript
   // app/admin/qc-templates/page.tsx
   export default function QcTemplatesPage() {
     const [templates, setTemplates] = useState([]);
     const [loading, setLoading] = useState(true);
     
     useEffect(() => {
       fetchTemplates();
     }, []);
     
     return (
       <div className="container mx-auto py-6">
         <div className="flex justify-between items-center mb-6">
           <h1 className="text-2xl font-bold">QC Form Templates</h1>
           <Button asChild>
             <Link href="/admin/qc-templates/new">
               <Plus className="w-4 h-4 mr-2" />
               New Template
             </Link>
           </Button>
         </div>
         
         <DataTable
           columns={qcTemplateColumns}
           data={templates}
           searchKey="name"
         />
       </div>
     );
   }
   ```

2. **Template Create/Edit Form**
   ```typescript
   // app/admin/qc-templates/[templateId]/edit/page.tsx
   export default function EditQcTemplatePage({ params }: { params: { templateId: string } }) {
     const form = useForm<QcTemplateFormData>({
       resolver: zodResolver(QcTemplateCreateSchema)
     });
     
     const [items, setItems] = useState<QcTemplateItem[]>([]);
     
     const onSubmit = async (data: QcTemplateFormData) => {
       try {
         await nextJsApiClient.put(`/admin/qc-templates/${params.templateId}`, {
           ...data,
           items: items
         });
         toast({ title: "Template updated successfully" });
         router.push('/admin/qc-templates');
       } catch (error) {
         toast({ 
           variant: "destructive",
           title: "Failed to update template" 
         });
       }
     };
     
     return (
       <Form {...form}>
         {/* Template basic info form */}
         <QcTemplateBasicInfoForm form={form} />
         
         {/* Dynamic items editor */}
         <QcTemplateItemsEditor 
           items={items}
           onItemsChange={setItems}
         />
         
         <Button type="submit">Save Template</Button>
       </Form>
     );
   }
   ```

3. **Dynamic Items Editor Component**
   ```typescript
   // components/admin/QcTemplateItemsEditor.tsx
   export function QcTemplateItemsEditor({ items, onItemsChange }: Props) {
     const addItem = () => {
       const newItem: QcTemplateItem = {
         id: `temp-${Date.now()}`,
         section: "",
         checklistItem: "",
         itemType: "PASS_FAIL",
         order: items.length + 1,
         isRequired: true
       };
       onItemsChange([...items, newItem]);
     };
     
     const updateItem = (index: number, updates: Partial<QcTemplateItem>) => {
       const updatedItems = [...items];
       updatedItems[index] = { ...updatedItems[index], ...updates };
       onItemsChange(updatedItems);
     };
     
     const removeItem = (index: number) => {
       onItemsChange(items.filter((_, i) => i !== index));
     };
     
     const reorderItems = (startIndex: number, endIndex: number) => {
       const result = Array.from(items);
       const [removed] = result.splice(startIndex, 1);
       result.splice(endIndex, 0, removed);
       
       // Update order values
       result.forEach((item, index) => {
         item.order = index + 1;
       });
       
       onItemsChange(result);
     };
     
     return (
       <Card>
         <CardHeader>
           <CardTitle>Checklist Items</CardTitle>
         </CardHeader>
         <CardContent>
           <DragDropContext onDragEnd={handleDragEnd}>
             <Droppable droppableId="qc-items">
               {(provided) => (
                 <div {...provided.droppableProps} ref={provided.innerRef}>
                   {items.map((item, index) => (
                     <Draggable key={item.id} draggableId={item.id} index={index}>
                       {(provided) => (
                         <QcTemplateItemEditor
                           ref={provided.innerRef}
                           {...provided.draggableProps}
                           {...provided.dragHandleProps}
                           item={item}
                           onUpdate={(updates) => updateItem(index, updates)}
                           onRemove={() => removeItem(index)}
                         />
                       )}
                     </Draggable>
                   ))}
                   {provided.placeholder}
                 </div>
               )}
             </Droppable>
           </DragDropContext>
           
           <Button onClick={addItem} variant="outline" className="mt-4">
             <Plus className="w-4 h-4 mr-2" />
             Add Item
           </Button>
         </CardContent>
       </Card>
     );
   }
   ```

**Acceptance Criteria**:
- Admin can create new QC templates
- Items can be added, edited, removed, and reordered
- Different item types (pass/fail, text, select) supported
- Form validation prevents invalid submissions
- Responsive design works on all screen sizes

---

### **Task 4.2: Implement QC Form Filling APIs**
**Priority**: 🟡 High  
**Estimated Effort**: 2-3 days  
**Dependencies**: Task 3.2 completion

**Implementation Steps**:

1. **QC Form APIs for Orders**
   ```typescript
   // app/api/orders/[orderId]/qc/route.ts
   export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
     const user = await getAuthUser(request);
     if (!checkUserRole(user, ['ASSEMBLER', 'QC_PERSON', 'PRODUCTION_COORDINATOR', 'ADMIN'])) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
     }
     
     // Get existing QC result for this order
     const qcResult = await prisma.orderQcResult.findFirst({
       where: { orderId: params.orderId },
       include: {
         qcFormTemplate: {
           include: { items: { orderBy: { order: 'asc' } } }
         },
         itemResults: true,
         qcPerformedBy: {
           select: { id: true, fullName: true }
         }
       }
     });
     
     return NextResponse.json({ qcResult });
   }
   
   export async function POST(request: NextRequest, { params }: { params: { orderId: string } }) {
     const user = await getAuthUser(request);
     if (!checkUserRole(user, ['ASSEMBLER', 'QC_PERSON'])) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
     }
     
     const body = await request.json();
     const validatedData = QcResultSubmissionSchema.parse(body);
     
     // Create or update QC result
     const qcResult = await prisma.$transaction(async (tx) => {
       // Upsert QC result
       const result = await tx.orderQcResult.upsert({
         where: {
           orderId_qcFormTemplateId: {
             orderId: params.orderId,
             qcFormTemplateId: validatedData.templateId
           }
         },
         update: {
           overallStatus: validatedData.overallStatus,
           notes: validatedData.notes,
           qcTimestamp: new Date()
         },
         create: {
           orderId: params.orderId,
           qcFormTemplateId: validatedData.templateId,
           qcPerformedById: user.id,
           overallStatus: validatedData.overallStatus,
           notes: validatedData.notes
         }
       });
       
       // Delete existing item results
       await tx.orderQcItemResult.deleteMany({
         where: { orderQcResultId: result.id }
       });
       
       // Create new item results
       await tx.orderQcItemResult.createMany({
         data: validatedData.itemResults.map(item => ({
           orderQcResultId: result.id,
           qcFormTemplateItemId: item.templateItemId,
           resultValue: item.resultValue,
           isConformant: item.isConformant,
           notes: item.notes
         }))
       });
       
       return result;
     });
     
     return NextResponse.json({ qcResult }, { status: 201 });
   }
   ```

2. **Template Selection API**
   ```typescript
   // app/api/orders/[orderId]/qc/template/route.ts
   export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
     const { searchParams } = new URL(request.url);
     const productFamily = searchParams.get('productFamily');
     
     // Find active template for product family
     const template = await prisma.qcFormTemplate.findFirst({
       where: {
         isActive: true,
         OR: [
           { appliesToProductFamily: productFamily },
           { appliesToProductFamily: null } // Generic template
         ]
       },
       include: {
         items: { orderBy: { order: 'asc' } }
       },
       orderBy: {
         appliesToProductFamily: 'desc' // Prefer specific over generic
       }
     });
     
     return NextResponse.json({ template });
   }
   ```

**Acceptance Criteria**:
- QC forms can be fetched for specific orders
- Form submissions save correctly to database
- Multiple users can work on different sections
- Data validation prevents invalid submissions
- Audit trail maintained for all QC activities

---

### **Task 4.3: Build QC Form Filling UI**
**Priority**: 🟡 High  
**Estimated Effort**: 3-4 days  
**Dependencies**: Task 4.2 completion

**Implementation Steps**:

1. **QC Form Filling Page**
   ```typescript
   // app/orders/[orderId]/qc/fill/page.tsx
   export default function QcFormFillPage({ params }: { params: { orderId: string } }) {
     const [template, setTemplate] = useState<QcFormTemplate | null>(null);
     const [existingResult, setExistingResult] = useState<OrderQcResult | null>(null);
     const [formData, setFormData] = useState<QcFormData>({});
     const [overallStatus, setOverallStatus] = useState<QcStatus>('IN_PROGRESS');
     
     useEffect(() => {
       loadQcData();
     }, [params.orderId]);
     
     const loadQcData = async () => {
       try {
         // Load template for this order's product family
         const order = await nextJsApiClient.get(`/orders/${params.orderId}`);
         const templateResponse = await nextJsApiClient.get(
           `/orders/${params.orderId}/qc/template?productFamily=${order.data.productFamily}`
         );
         setTemplate(templateResponse.data.template);
         
         // Load existing QC result if any
         const resultResponse = await nextJsApiClient.get(`/orders/${params.orderId}/qc`);
         if (resultResponse.data.qcResult) {
           setExistingResult(resultResponse.data.qcResult);
           populateFormFromResult(resultResponse.data.qcResult);
         }
       } catch (error) {
         toast({
           variant: "destructive",
           title: "Failed to load QC form"
         });
       }
     };
     
     const handleSubmit = async () => {
       try {
         const submission = {
           templateId: template.id,
           overallStatus,
           notes: formData.generalNotes || '',
           itemResults: template.items.map(item => ({
             templateItemId: item.id,
             resultValue: formData[item.id]?.value || '',
             isConformant: formData[item.id]?.isConformant,
             notes: formData[item.id]?.notes || ''
           }))
         };
         
         await nextJsApiClient.post(`/orders/${params.orderId}/qc`, submission);
         
         toast({
           title: "QC Form Submitted",
           description: "Quality control checklist has been saved"
         });
         
         router.push(`/orders/${params.orderId}`);
       } catch (error) {
         toast({
           variant: "destructive",
           title: "Submission Failed"
         });
       }
     };
     
     if (!template) return <QcFormSkeleton />;
     
     return (
       <div className="container mx-auto py-6">
         <div className="mb-6">
           <h1 className="text-2xl font-bold">{template.name}</h1>
           <p className="text-gray-600">Order #{params.orderId}</p>
         </div>
         
         <QcFormRenderer
           template={template}
           formData={formData}
           onFormDataChange={setFormData}
           overallStatus={overallStatus}
           onOverallStatusChange={setOverallStatus}
         />
         
         <div className="mt-8 flex gap-4">
           <Button onClick={handleSubmit} size="lg">
             Submit QC Form
           </Button>
           <Button variant="outline" onClick={() => router.back()}>
             Cancel
           </Button>
         </div>
       </div>
     );
   }
   ```

2. **Dynamic Form Renderer Component**
   ```typescript
   // components/qc/QcFormRenderer.tsx
   export function QcFormRenderer({ template, formData, onFormDataChange, overallStatus, onOverallStatusChange }: Props) {
     const sections = groupBy(template.items, 'section');
     
     const updateFormData = (itemId: string, field: string, value: any) => {
       onFormDataChange(prev => ({
         ...prev,
         [itemId]: {
           ...prev[itemId],
           [field]: value
         }
       }));
     };
     
     return (
       <div className="space-y-8">
         {Object.entries(sections).map(([sectionName, items]) => (
           <Card key={sectionName}>
             <CardHeader>
               <CardTitle>{sectionName}</CardTitle>
             </CardHeader>
             <CardContent className="space-y-6">
               {items.map((item) => (
                 <QcFormItem
                   key={item.id}
                   item={item}
                   value={formData[item.id]}
                   onChange={(field, value) => updateFormData(item.id, field, value)}
                 />
               ))}
             </CardContent>
           </Card>
         ))}
         
         <Card>
           <CardHeader>
             <CardTitle>Overall Assessment</CardTitle>
           </CardHeader>
           <CardContent>
             <RadioGroup
               value={overallStatus}
               onValueChange={onOverallStatusChange}
             >
               <div className="flex items-center space-x-2">
                 <RadioGroupItem value="PASSED" id="passed" />
                 <Label htmlFor="passed" className="text-green-600">
                   ✓ Passed - All checks completed successfully
                 </Label>
               </div>
               <div className="flex items-center space-x-2">
                 <RadioGroupItem value="FAILED" id="failed" />
                 <Label htmlFor="failed" className="text-red-600">
                   ✗ Failed - Issues found requiring attention
                 </Label>
               </div>
               <div className="flex items-center space-x-2">
                 <RadioGroupItem value="REQUIRES_REVIEW" id="review" />
                 <Label htmlFor="review" className="text-yellow-600">
                   ⚠ Requires Review - Uncertain items need supervisor review
                 </Label>
               </div>
             </RadioGroup>
           </CardContent>
         </Card>
       </div>
     );
   }
   ```

3. **Individual QC Item Component**
   ```typescript
   // components/qc/QcFormItem.tsx
   export function QcFormItem({ item, value, onChange }: Props) {
     const renderInput = () => {
       switch (item.itemType) {
         case 'PASS_FAIL':
           return (
             <RadioGroup
               value={value?.isConformant?.toString() || ''}
               onValueChange={(val) => onChange('isConformant', val === 'true')}
             >
               <div className="flex items-center space-x-2">
                 <RadioGroupItem value="true" id={`${item.id}-pass`} />
                 <Label htmlFor={`${item.id}-pass`} className="text-green-600">Pass</Label>
               </div>
               <div className="flex items-center space-x-2">
                 <RadioGroupItem value="false" id={`${item.id}-fail`} />
                 <Label htmlFor={`${item.id}-fail`} className="text-red-600">Fail</Label>
               </div>
             </RadioGroup>
           );
           
         case 'TEXT_INPUT':
           return (
             <Input
               value={value?.value || ''}
               onChange={(e) => onChange('value', e.target.value)}
               placeholder="Enter text..."
             />
           );
           
         case 'NUMERIC_INPUT':
           return (
             <Input
               type="number"
               value={value?.value || ''}
               onChange={(e) => onChange('value', e.target.value)}
               placeholder="Enter number..."
             />
           );
           
         case 'SINGLE_SELECT':
           return (
             <Select
               value={value?.value || ''}
               onValueChange={(val) => onChange('value', val)}
             >
               <SelectTrigger>
                 <SelectValue placeholder="Select option..." />
               </SelectTrigger>
               <SelectContent>
                 {item.options?.map((option) => (
                   <SelectItem key={option} value={option}>
                     {option}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           );
           
         default:
           return <div>Unsupported item type: {item.itemType}</div>;
       }
     };
     
     return (
       <div className="space-y-3">
         <div className="flex items-start justify-between">
           <Label className="text-sm font-medium">
             {item.checklistItem}
             {item.isRequired && <span className="text-red-500 ml-1">*</span>}
           </Label>
           {item.expectedValue && (
             <span className="text-xs text-gray-500">
               Expected: {item.expectedValue}
             </span>
           )}
         </div>
         
         {renderInput()}
         
         <Textarea
           placeholder="Add notes (optional)..."
           value={value?.notes || ''}
           onChange={(e) => onChange('notes', e.target.value)}
           rows={2}
         />
       </div>
     );
   }
   ```

**Acceptance Criteria**:
- QC forms render correctly based on template structure
- All item types (pass/fail, text, numeric, select) work properly
- Form data saves and loads correctly
- Progress can be saved and resumed later
- Overall status calculation works correctly
- Form validation prevents incomplete submissions

---

## Sprint 5: UI Polish & Final Integration (Week 9-10)

### **Task 5.1: Add Framer Motion Animations**
**Priority**: 🟢 Medium  
**Estimated Effort**: 2-3 days  
**Dependencies**: Core functionality complete

**Implementation Steps**:

1. **Page Transition Animations**
   ```typescript
   // components/ui/PageTransition.tsx
   export function PageTransition({ children }: { children: React.ReactNode }) {
     return (
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         exit={{ opacity: 0, y: -20 }}
         transition={{ duration: 0.3 }}
       >
         {children}
       </motion.div>
     );
   }
   ```

2. **Modal and Popover Animations**
   ```typescript
   // Enhanced ShadCN components with Framer Motion
   export function AnimatedDialog({ children, ...props }: DialogProps) {
     return (
       <Dialog {...props}>
         <AnimatePresence>
           <DialogContent asChild>
             <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               transition={{ duration: 0.2 }}
             >
               {children}
             </motion.div>
           </DialogContent>
         </AnimatePresence>
       </Dialog>
     );
   }
   ```

3. **Loading and State Animations**
   ```typescript
   // components/ui/AnimatedLoading.tsx
   export function AnimatedLoading() {
     return (
       <motion.div
         className="flex justify-center items-center"
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
       >
         <motion.div
           className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
           animate={{ rotate: 360 }}
           transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
         />
       </motion.div>
     );
   }
   ```

**Acceptance Criteria**:
- Smooth page transitions
- Modal animations feel polished
- Loading states are visually appealing
- Animations don't impact performance
- Reduced motion preferences respected

---

## Risk Mitigation & Quality Assurance

### **Testing Strategy**
1. **Unit Tests**: Critical service functions and API endpoints
2. **Integration Tests**: Order creation workflow end-to-end
3. **User Acceptance Testing**: Role-based dashboard workflows
4. **Performance Testing**: Large BOM exports and complex QC forms

### **Deployment Strategy**
1. **Staging Environment**: Deploy and test each sprint completion
2. **Database Migrations**: Careful planning for production migration
3. **Feature Flags**: Gradual rollout of QC checklist system
4. **Rollback Plan**: Database backup before each major migration

### **Success Metrics**
- Order creation workflow completion rate
- QC checklist adoption by production teams  
- BOM export usage statistics
- User satisfaction scores from role-based dashboards
- System performance benchmarks

---

## Timeline Summary

| Sprint | Duration | Focus | Deliverables |
|--------|----------|-------|--------------|
| 1 | Week 1-2 | Core Services | Dynamic configurator & accessories |
| 2 | Week 3-4 | Export & Polish | BOM export functionality |
| 3 | Week 5-6 | QC Backend | Database models & APIs |
| 4 | Week 7-8 | QC Frontend | Admin & user interfaces |
| 5 | Week 9-10 | Polish | Animations & final testing |

**Total Estimated Duration**: 10 weeks  
**Critical Path**: Configurator Services → Frontend Integration → Production Ready

This implementation plan provides a structured approach to completing all CPCv5 requirements through Chain 6, ensuring production readiness with proper quality assurance and risk mitigation.