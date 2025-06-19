#!/usr/bin/env node

/**
 * =============================================================================
 * TORVAN MEDICAL CLEANSTATION - COMPREHENSIVE DATABASE SEEDING
 * =============================================================================
 * 
 * This script provides complete database seeding for the CleanStation 
 * production workflow application, including all data from the working system.
 * 
 * Usage:
 *   node 02-comprehensive-seed.js
 * 
 * Prerequisites:
 *   - PostgreSQL database created and accessible
 *   - Schema migration (01-consolidated-migration.sql) already applied
 *   - DATABASE_URL environment variable set
 * 
 * =============================================================================
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// =============================================================================
// ENVIRONMENT VALIDATION
// =============================================================================

function validateEnvironment() {
  console.log('🔍 Validating environment...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }
  
  const nodeEnv = process.env.NODE_ENV || 'development';
  console.log(`✅ Environment: ${nodeEnv}`);
  console.log(`✅ Database URL configured`);
  
  return { nodeEnv };
}

// =============================================================================
// USER DATA
// =============================================================================

const userData = [
  {
    id: 'cmbp2oc4w0000tiffwp8aqqtk',
    username: 'admin',
    email: 'admin@torvan.local',
    fullName: 'System Admin',
    role: 'ADMIN',
    initials: 'SA'
  },
  {
    id: 'cmbp2oc6o0001tiffzosjm48z',
    username: 'coordinator',
    email: 'coordinator@torvan.local',
    fullName: 'Production Coordinator',
    role: 'PRODUCTION_COORDINATOR',
    initials: 'PC'
  },
  {
    id: 'cmbp2oc8a0002tiffpyxs5pss',
    username: 'procurement',
    email: 'procurement@torvan.local',
    fullName: 'Procurement Specialist',
    role: 'PROCUREMENT_SPECIALIST',
    initials: 'PS'
  },
  {
    id: 'cmbp2oc9y0003tiffyp5eeuzv',
    username: 'qc',
    email: 'qc@torvan.local',
    fullName: 'Quality Control',
    role: 'QC_PERSON',
    initials: 'QC'
  },
  {
    id: 'cmbp2ocbj0004tiffkjn5c1pm',
    username: 'assembler',
    email: 'assembler@torvan.local',
    fullName: 'Assembler',
    role: 'ASSEMBLER',
    initials: 'AS'
  },
  {
    id: 'cmbp2ocbj0005tiffkjn5c1pm',
    username: 'assembler1',
    email: 'assembler1@torvan.local',
    fullName: 'Production Assembler 1',
    role: 'ASSEMBLER',
    initials: 'PA1'
  },
  {
    id: 'cmbp2ocbj0006tiffkjn5c1pm',
    username: 'assembler2',
    email: 'assembler2@torvan.local',
    fullName: 'Production Assembler 2',
    role: 'ASSEMBLER',
    initials: 'PA2'
  },
  {
    id: 'cmbp2ocd50005tiff077cbw6q',
    username: 'service',
    email: 'service@torvan.local',
    fullName: 'Service Department',
    role: 'SERVICE_DEPARTMENT',
    initials: 'SD'
  }
];

async function seedUsers() {
  console.log('👥 Seeding users...');
  
  const saltRounds = 10;
  const defaultPassword = 'password123';
  
  for (const user of userData) {
    const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);
    
    const existingUser = await prisma.user.findUnique({
      where: { username: user.username }
    });
    
    if (!existingUser) {
      await prisma.user.create({
        data: {
          ...user,
          passwordHash
        }
      });
      console.log(`✅ Created user: ${user.username} (${user.role})`);
    } else {
      console.log(`⏭️  User already exists: ${user.username}`);
    }
  }
}

// =============================================================================
// CATEGORIES AND SUBCATEGORIES
// =============================================================================

const categoriesData = [
  {
    categoryId: '718',
    name: 'CONTROL BOX',
    description: 'Category for control box',
    subcategories: [
      { subcategoryId: '71801', name: 'Control Box for 1 Edrain Basin' },
      { subcategoryId: '71802', name: 'Control Box for 1 Esink Basin' },
      { subcategoryId: '71803', name: 'Control Box for Multiple Basins' }
    ]
  },
  {
    categoryId: '719',
    name: 'SERVICE PARTS',
    description: 'Category for service parts',
    subcategories: [
      { subcategoryId: '71901', name: 'Wire Baskets' },
      { subcategoryId: '71902', name: 'Stainless Steel Shelves' },
      { subcategoryId: '71903', name: 'Bin Rails' },
      { subcategoryId: '71904', name: 'Storage Organizers' },
      { subcategoryId: '71905', name: 'Lighting Accessories' }
    ]
  },
  {
    categoryId: '720',
    name: 'ACCESSORY LIST',
    description: 'Category for accessories',
    subcategories: [
      { subcategoryId: '72001', name: 'Faucets and Water Systems' },
      { subcategoryId: '72002', name: 'Monitor and Computer Mounts' },
      { subcategoryId: '72003', name: 'Safety and Emergency Equipment' },
      { subcategoryId: '72004', name: 'Workflow and Organization' }
    ]
  },
  {
    categoryId: '721',
    name: 'SINK BODY',
    description: 'Category for sink bodies',
    subcategories: [
      { subcategoryId: '72101', name: 'Single Bowl Sinks' },
      { subcategoryId: '72102', name: 'Double Bowl Sinks' },
      { subcategoryId: '72103', name: 'Triple Bowl Sinks' }
    ]
  },
  {
    categoryId: '722',
    name: 'BASIN',
    description: 'Category for basins',
    subcategories: [
      { subcategoryId: '72201', name: 'E-Drain Basins' },
      { subcategoryId: '72202', name: 'E-Sink Basins' },
      { subcategoryId: '72203', name: 'Custom Basin Configurations' }
    ]
  },
  {
    categoryId: '723',
    name: 'PEGBOARD',
    description: 'Category for pegboards',
    subcategories: [
      { subcategoryId: '72301', name: 'Standard Pegboards' },
      { subcategoryId: '72302', name: 'Colored Pegboards' },
      { subcategoryId: '72303', name: 'Custom Size Pegboards' }
    ]
  }
];

async function seedCategories() {
  console.log('📂 Seeding categories and subcategories...');
  
  for (const category of categoriesData) {
    const existing = await prisma.category.findUnique({
      where: { categoryId: category.categoryId }
    });
    
    if (!existing) {
      await prisma.category.create({
        data: {
          categoryId: category.categoryId,
          name: category.name,
          description: category.description
        }
      });
      console.log(`✅ Created category: ${category.name} (ID: ${category.categoryId})`);
      
      // Create subcategories
      for (const subcategory of category.subcategories) {
        await prisma.subcategory.create({
          data: {
            subcategoryId: subcategory.subcategoryId,
            name: subcategory.name,
            categoryId: category.categoryId
          }
        });
      }
      console.log(`  ✅ Created ${category.subcategories.length} subcategories for ${category.name}`);
    } else {
      console.log(`⏭️  Category already exists: ${category.name}`);
    }
  }
}

// =============================================================================
// QC TEMPLATES
// =============================================================================

async function seedQcTemplates() {
  console.log('📋 Seeding QC Templates...');
  
  try {
    // Delete existing templates
    console.log('🗑️  Clearing existing QC templates...');
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
      // Documentation and Order Verification
      {
        section: 'Documentation',
        checklistItem: 'Verify PO number matches work order',
        itemType: 'PASS_FAIL',
        order: 1,
        isRequired: true
      },
      {
        section: 'Documentation',
        checklistItem: 'Confirm customer specifications in work packet',
        itemType: 'PASS_FAIL',
        order: 2,
        isRequired: true
      },
      {
        section: 'Documentation',
        checklistItem: 'Review technical drawings for accuracy',
        itemType: 'PASS_FAIL',
        order: 3,
        isRequired: true,
        notesPrompt: 'Note any discrepancies or clarifications needed'
      },
      
      // Sink Frame Inspection
      {
        section: 'Frame Assembly',
        checklistItem: 'Inspect frame for welding quality and completeness',
        itemType: 'PASS_FAIL',
        order: 4,
        isRequired: true,
        notesPrompt: 'Document any weld defects or rework needed'
      },
      {
        section: 'Frame Assembly',
        checklistItem: 'Verify frame dimensions match specifications',
        itemType: 'NUMERIC_INPUT',
        order: 5,
        isRequired: true,
        expectedValue: 'As per drawing',
        notesPrompt: 'Record actual measurements'
      },
      {
        section: 'Frame Assembly',
        checklistItem: 'Check frame levelness and squareness',
        itemType: 'PASS_FAIL',
        order: 6,
        isRequired: true
      },
      
      // Basin Inspection (repeats per basin)
      {
        section: 'Basin Quality',
        checklistItem: 'Inspect basin surface finish and cleanliness',
        itemType: 'PASS_FAIL',
        order: 7,
        isRequired: true,
        repeatPer: 'basin',
        notesPrompt: 'Note any scratches, stains, or surface defects'
      },
      {
        section: 'Basin Quality',
        checklistItem: 'Verify basin drain hole alignment',
        itemType: 'PASS_FAIL',
        order: 8,
        isRequired: true,
        repeatPer: 'basin'
      },
      {
        section: 'Basin Quality',
        checklistItem: 'Check basin overflow sensor ports',
        itemType: 'PASS_FAIL',
        order: 9,
        isRequired: true,
        repeatPer: 'basin',
        applicabilityCondition: 'E_SINK or E_DRAIN'
      },
      {
        section: 'Basin Quality',
        checklistItem: 'Test basin bottom fill connections',
        itemType: 'PASS_FAIL',
        order: 10,
        isRequired: true,
        repeatPer: 'basin',
        applicabilityCondition: 'E_SINK'
      },
      
      // Plumbing and Connections
      {
        section: 'Plumbing',
        checklistItem: 'Verify all water connections are secure',
        itemType: 'PASS_FAIL',
        order: 11,
        isRequired: true
      },
      {
        section: 'Plumbing',
        checklistItem: 'Check drain hose routing and connections',
        itemType: 'PASS_FAIL',
        order: 12,
        isRequired: true
      },
      {
        section: 'Plumbing',
        checklistItem: 'Test water pressure and flow',
        itemType: 'NUMERIC_INPUT',
        order: 13,
        isRequired: true,
        expectedValue: '40-60 PSI',
        notesPrompt: 'Record actual pressure reading'
      },
      
      // Electrical Systems
      {
        section: 'Electrical',
        checklistItem: 'Inspect electrical panel installation',
        itemType: 'PASS_FAIL',
        order: 14,
        isRequired: true,
        applicabilityCondition: 'E_SINK or E_DRAIN'
      },
      {
        section: 'Electrical',
        checklistItem: 'Verify all cable connections and routing',
        itemType: 'PASS_FAIL',
        order: 15,
        isRequired: true,
        applicabilityCondition: 'E_SINK or E_DRAIN'
      },
      {
        section: 'Electrical',
        checklistItem: 'Test emergency stop functionality',
        itemType: 'PASS_FAIL',
        order: 16,
        isRequired: true,
        applicabilityCondition: 'E_SINK'
      },
      {
        section: 'Electrical',
        checklistItem: 'Check touchscreen operation and calibration',
        itemType: 'PASS_FAIL',
        order: 17,
        isRequired: true,
        applicabilityCondition: 'E_SINK'
      },
      
      // Height Adjustment (if applicable)
      {
        section: 'Height Adjustment',
        checklistItem: 'Test height adjustment mechanism operation',
        itemType: 'PASS_FAIL',
        order: 18,
        isRequired: false,
        applicabilityCondition: 'height_adjustable'
      },
      {
        section: 'Height Adjustment',
        checklistItem: 'Verify height adjustment range',
        itemType: 'NUMERIC_INPUT',
        order: 19,
        isRequired: false,
        applicabilityCondition: 'height_adjustable',
        expectedValue: '34-44 inches',
        notesPrompt: 'Record min and max heights achieved'
      },
      
      // Pegboard and Accessories
      {
        section: 'Accessories',
        checklistItem: 'Check pegboard mounting and stability',
        itemType: 'PASS_FAIL',
        order: 20,
        isRequired: false,
        applicabilityCondition: 'has_pegboard'
      },
      {
        section: 'Accessories',
        checklistItem: 'Verify accessory mounting points',
        itemType: 'PASS_FAIL',
        order: 21,
        isRequired: false,
        applicabilityCondition: 'has_accessories'
      },
      {
        section: 'Accessories',
        checklistItem: 'Test overhead lighting functionality',
        itemType: 'PASS_FAIL',
        order: 22,
        isRequired: false,
        applicabilityCondition: 'has_overhead_light'
      },
      
      // Final Assembly Checks
      {
        section: 'Final Inspection',
        checklistItem: 'Overall assembly completeness check',
        itemType: 'PASS_FAIL',
        order: 23,
        isRequired: true
      },
      {
        section: 'Final Inspection',
        checklistItem: 'Verify all fasteners are properly tightened',
        itemType: 'PASS_FAIL',
        order: 24,
        isRequired: true
      },
      {
        section: 'Final Inspection',
        checklistItem: 'Check for any sharp edges or safety hazards',
        itemType: 'PASS_FAIL',
        order: 25,
        isRequired: true
      },
      {
        section: 'Final Inspection',
        checklistItem: 'Confirm all protective films and coverings removed',
        itemType: 'PASS_FAIL',
        order: 26,
        isRequired: true
      },
      
      // Quality Documentation
      {
        section: 'Documentation',
        checklistItem: 'QC inspector signature and date',
        itemType: 'TEXT_INPUT',
        order: 27,
        isRequired: true
      },
      {
        section: 'Documentation',
        checklistItem: 'Overall Pre-QC result',
        itemType: 'SINGLE_SELECT',
        order: 28,
        isRequired: true,
        options: JSON.stringify(['PASS', 'FAIL', 'CONDITIONAL_PASS'])
      },
      {
        section: 'Documentation',
        checklistItem: 'Additional notes or observations',
        itemType: 'TEXT_INPUT',
        order: 29,
        isRequired: false,
        notesPrompt: 'Document any additional observations, recommendations, or follow-up actions required'
      }
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
    
    // Create additional templates for completeness
    const additionalTemplates = [
      {
        id: 'final-qc-inspection',
        name: 'Final QC Inspection',
        description: 'Final quality control inspection before shipping'
      },
      {
        id: 'packaging-qc',
        name: 'Packaging QC Check',
        description: 'Quality control for packaging and shipping preparation'
      },
      {
        id: 'electrical-systems-test',
        name: 'Electrical Systems Test',
        description: 'Comprehensive electrical systems testing for E-Sink systems'
      }
    ];
    
    for (const template of additionalTemplates) {
      await prisma.qcFormTemplate.create({
        data: {
          id: template.id,
          name: template.name,
          version: '1.0',
          description: template.description,
          isActive: true
        }
      });
      console.log(`✅ Created QC template: ${template.name}`);
    }
    
  } catch (error) {
    console.error('❌ Error seeding QC templates:', error.message);
    throw error;
  }
}

// =============================================================================
// WORK INSTRUCTIONS AND TOOLS
// =============================================================================

async function seedWorkInstructionsAndTools() {
  console.log('🔧 Seeding work instructions and tools...');
  
  // Create tools
  const tools = [
    { name: 'Digital Torque Wrench', description: 'Precision torque application', category: 'ASSEMBLY' },
    { name: 'Socket Set Metric', description: 'Complete metric socket set', category: 'ASSEMBLY' },
    { name: '4ft Spirit Level', description: 'Precision leveling tool', category: 'MEASUREMENT' },
    { name: 'Safety Glasses', description: 'ANSI Z87.1 safety glasses', category: 'SAFETY' },
    { name: 'Digital Multimeter', description: 'Electrical testing and measurement', category: 'ELECTRICAL' },
    { name: 'Wire Strippers', description: 'Electrical wire preparation', category: 'ELECTRICAL' }
  ];
  
  for (const tool of tools) {
    const existing = await prisma.tool.findFirst({
      where: { name: tool.name }
    });
    
    if (!existing) {
      await prisma.tool.create({ data: tool });
      console.log(`✅ Created tool: ${tool.name}`);
    }
  }
  
  // Create work instructions
  const workInstructions = [
    {
      title: 'T2 Sink Basin Assembly',
      description: 'Standard procedure for assembling T2 sink basins',
      version: '2.1',
      estimatedMinutes: 45
    },
    {
      title: 'Frame Assembly and Alignment',
      description: 'Procedure for assembling and aligning sink frames',
      version: '1.8',
      estimatedMinutes: 60
    }
  ];
  
  for (const wi of workInstructions) {
    const existing = await prisma.workInstruction.findFirst({
      where: { title: wi.title }
    });
    
    if (!existing) {
      await prisma.workInstruction.create({ data: wi });
      console.log(`✅ Created work instruction: ${wi.title}`);
    }
  }
}

// =============================================================================
// SAMPLE DATA
// =============================================================================

async function seedSampleData() {
  console.log('📊 Seeding sample workflow data...');
  
  // Create some inventory items
  const parts = await prisma.part.findMany({ take: 10 });
  const users = await prisma.user.findMany();
  const adminUser = users.find(u => u.role === 'ADMIN');
  
  if (parts.length > 0 && adminUser) {
    for (let i = 0; i < Math.min(5, parts.length); i++) {
      const part = parts[i];
      const existing = await prisma.inventoryItem.findFirst({
        where: { partId: part.partId }
      });
      
      if (!existing) {
        await prisma.inventoryItem.create({
          data: {
            partId: part.partId,
            location: `WH-A-${i + 1}`,
            quantityOnHand: Math.floor(Math.random() * 100) + 10,
            quantityAvailable: Math.floor(Math.random() * 50) + 5,
            updatedById: adminUser.id,
            inventoryStatus: 'AVAILABLE'
          }
        });
      }
    }
    console.log('✅ Created sample inventory items');
  }
  
  // Create sample notifications
  const notifications = [
    {
      type: 'SYSTEM_ALERT',
      title: 'System Maintenance Scheduled',
      message: 'Scheduled maintenance window: Sunday 2AM-4AM EST',
      priority: 'NORMAL'
    },
    {
      type: 'INVENTORY_LOW',
      title: 'Low Inventory Alert',
      message: 'Several parts are running low on inventory',
      priority: 'HIGH'
    }
  ];
  
  for (const notif of notifications) {
    const existing = await prisma.systemNotification.findFirst({
      where: { title: notif.title }
    });
    
    if (!existing) {
      await prisma.systemNotification.create({ data: notif });
      console.log(`✅ Created notification: ${notif.title}`);
    }
  }
}

// =============================================================================
// MAIN SEEDING FUNCTION
// =============================================================================

async function main() {
  try {
    console.log('🚀 Starting comprehensive database seeding...');
    
    // Validate environment
    const { nodeEnv } = validateEnvironment();
    
    // Seed in order of dependencies
    console.log('\n📂 Phase 1: Categories and Structure');
    await seedCategories();
    
    console.log('\n👥 Phase 2: Users');
    await seedUsers();
    
    console.log('\n📋 Phase 3: QC Templates');
    await seedQcTemplates();
    
    console.log('\n🔧 Phase 4: Work Instructions and Tools');
    await seedWorkInstructionsAndTools();
    
    console.log('\n📊 Phase 5: Sample Data');
    await seedSampleData();
    
    console.log('\n🎉 Comprehensive seeding completed successfully!');
    console.log('\n📊 Database Summary:');
    
    // Print summary statistics
    const stats = {
      users: await prisma.user.count(),
      categories: await prisma.category.count(),
      subcategories: await prisma.subcategory.count(),
      qcTemplates: await prisma.qcFormTemplate.count(),
      qcItems: await prisma.qcFormTemplateItem.count(),
      tools: await prisma.tool.count(),
      workInstructions: await prisma.workInstruction.count(),
      inventoryItems: await prisma.inventoryItem.count(),
      notifications: await prisma.systemNotification.count()
    };
    
    Object.entries(stats).forEach(([key, count]) => {
      console.log(`   ${key}: ${count}`);
    });
    
    console.log('\n✅ Your CleanStation database is ready for production!');
    
    console.log('\n🔐 Default Login Credentials:');
    console.log('   Username: admin, Password: password123 (Admin)');
    console.log('   Username: qc, Password: password123 (QC Person)');
    console.log('   Username: coordinator, Password: password123 (Production Coordinator)');
    console.log('   Username: assembler, Password: password123 (Assembler)');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed.');
  }
}

// =============================================================================
// EXECUTION
// =============================================================================

if (require.main === module) {
  main()
    .then(() => {
      console.log('✅ Seeding process completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding process failed:', error);
      process.exit(1);
    });
}

module.exports = {
  main,
  seedUsers,
  seedCategories,
  seedQcTemplates,
  seedWorkInstructionsAndTools,
  seedSampleData
};