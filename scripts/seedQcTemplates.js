const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedQcTemplates() {
  try {
    // Define T2 Sink Production Checklist template
    const t2Template = {
      name: "T2 Sink Production Checklist",
      version: "1.0",
      appliesToProductFamily: "MDRD_T2_SINK",
      description: "Quality control checklist for T2 sink production",
      isActive: true,
      items: {
        create: [
          // Pre-Assembly Checks
          {
            section: "Pre-Assembly Checks",
            checklistItem: "Verify all parts are present per BOM",
            itemType: "PASS_FAIL",
            order: 1,
            isRequired: true
          },
          {
            section: "Pre-Assembly Checks",
            checklistItem: "Check for visible damage on components",
            itemType: "PASS_FAIL",
            order: 2,
            isRequired: true
          },
          {
            section: "Pre-Assembly Checks",
            checklistItem: "Confirm correct sink model (T2)",
            itemType: "PASS_FAIL",
            order: 3,
            isRequired: true
          },
          {
            section: "Pre-Assembly Checks",
            checklistItem: "Record PO number",
            itemType: "TEXT_INPUT",
            order: 4,
            isRequired: true
          },
          {
            section: "Pre-Assembly Checks",
            checklistItem: "Record build number(s)",
            itemType: "TEXT_INPUT",
            order: 5,
            isRequired: true
          },

          // Basin Installation
          {
            section: "Basin Installation",
            checklistItem: "Basin properly mounted and level",
            itemType: "PASS_FAIL",
            order: 6,
            isRequired: true
          },
          {
            section: "Basin Installation",
            checklistItem: "Drain connections secure and leak-free",
            itemType: "PASS_FAIL",
            order: 7,
            isRequired: true
          },
          {
            section: "Basin Installation",
            checklistItem: "Basin type installed",
            itemType: "SINGLE_SELECT",
            options: ["E-Sink", "E-Drain", "Flex-I-Drain", "DI Basin"],
            order: 8,
            isRequired: true
          },
          {
            section: "Basin Installation",
            checklistItem: "Number of basins installed",
            itemType: "NUMERIC_INPUT",
            expectedValue: "1",
            order: 9,
            isRequired: true
          },

          // Faucet Installation
          {
            section: "Faucet Installation",
            checklistItem: "Faucet(s) installed securely",
            itemType: "PASS_FAIL",
            order: 10,
            isRequired: true
          },
          {
            section: "Faucet Installation",
            checklistItem: "Faucet type installed",
            itemType: "SINGLE_SELECT",
            options: ["Deck Mount", "Panel Mount", "Knee Pedal", "Electronic", "Not Applicable"],
            order: 11,
            isRequired: true
          },
          {
            section: "Faucet Installation",
            checklistItem: "Water connections checked for leaks",
            itemType: "PASS_FAIL",
            order: 12,
            isRequired: true
          },
          {
            section: "Faucet Installation",
            checklistItem: "Hot and cold water lines properly connected",
            itemType: "PASS_FAIL",
            order: 13,
            isRequired: true
          },

          // Frame and Structure
          {
            section: "Frame and Structure",
            checklistItem: "Frame assembled according to specifications",
            itemType: "PASS_FAIL",
            order: 14,
            isRequired: true
          },
          {
            section: "Frame and Structure",
            checklistItem: "All bolts and fasteners properly tightened",
            itemType: "PASS_FAIL",
            order: 15,
            isRequired: true
          },
          {
            section: "Frame and Structure",
            checklistItem: "Leg type installed",
            itemType: "SINGLE_SELECT",
            options: ["Fixed Legs", "Adjustable Legs", "Casters"],
            order: 16,
            isRequired: true
          },
          {
            section: "Frame and Structure",
            checklistItem: "Unit is stable and level",
            itemType: "PASS_FAIL",
            order: 17,
            isRequired: true
          },

          // Electrical Components
          {
            section: "Electrical Components",
            checklistItem: "Control box properly mounted",
            itemType: "PASS_FAIL",
            order: 18,
            isRequired: false
          },
          {
            section: "Electrical Components",
            checklistItem: "All electrical connections secure",
            itemType: "PASS_FAIL",
            order: 19,
            isRequired: false
          },
          {
            section: "Electrical Components",
            checklistItem: "Electrical components tested and functional",
            itemType: "PASS_FAIL",
            order: 20,
            isRequired: false
          },

          // Accessories
          {
            section: "Accessories",
            checklistItem: "Pegboard installed (if applicable)",
            itemType: "CHECKBOX",
            order: 21,
            isRequired: false
          },
          {
            section: "Accessories",
            checklistItem: "Soap dispenser installed (if applicable)",
            itemType: "CHECKBOX",
            order: 22,
            isRequired: false
          },
          {
            section: "Accessories",
            checklistItem: "Paper towel dispenser installed (if applicable)",
            itemType: "CHECKBOX",
            order: 23,
            isRequired: false
          },
          {
            section: "Accessories",
            checklistItem: "Spray hose installed (if applicable)",
            itemType: "CHECKBOX",
            order: 24,
            isRequired: false
          },
          {
            section: "Accessories",
            checklistItem: "Additional accessories notes",
            itemType: "TEXT_INPUT",
            order: 25,
            isRequired: false
          },

          // Final Testing
          {
            section: "Final Testing",
            checklistItem: "Water flow test completed",
            itemType: "PASS_FAIL",
            order: 26,
            isRequired: true
          },
          {
            section: "Final Testing",
            checklistItem: "Drainage test completed",
            itemType: "PASS_FAIL",
            order: 27,
            isRequired: true
          },
          {
            section: "Final Testing",
            checklistItem: "All functions operating correctly",
            itemType: "PASS_FAIL",
            order: 28,
            isRequired: true
          },
          {
            section: "Final Testing",
            checklistItem: "Test duration (minutes)",
            itemType: "NUMERIC_INPUT",
            expectedValue: "15",
            order: 29,
            isRequired: true
          },

          // Cleaning and Finishing
          {
            section: "Cleaning and Finishing",
            checklistItem: "Unit cleaned and free of debris",
            itemType: "PASS_FAIL",
            order: 30,
            isRequired: true
          },
          {
            section: "Cleaning and Finishing",
            checklistItem: "Protective film/covers applied where needed",
            itemType: "PASS_FAIL",
            order: 31,
            isRequired: true
          },
          {
            section: "Cleaning and Finishing",
            checklistItem: "Quality stickers/labels applied",
            itemType: "PASS_FAIL",
            order: 32,
            isRequired: true
          },

          // Documentation
          {
            section: "Documentation",
            checklistItem: "Assembly manual included",
            itemType: "CHECKBOX",
            order: 33,
            isRequired: true
          },
          {
            section: "Documentation",
            checklistItem: "Warranty documentation included",
            itemType: "CHECKBOX",
            order: 34,
            isRequired: true
          },
          {
            section: "Documentation",
            checklistItem: "Test certificate completed",
            itemType: "CHECKBOX",
            order: 35,
            isRequired: true
          },
          {
            section: "Documentation",
            checklistItem: "Serial number recorded",
            itemType: "TEXT_INPUT",
            order: 36,
            isRequired: true
          },

          // QC Inspector Sign-off
          {
            section: "QC Inspector Sign-off",
            checklistItem: "QC Inspector Name",
            itemType: "TEXT_INPUT",
            order: 37,
            isRequired: true
          },
          {
            section: "QC Inspector Sign-off",
            checklistItem: "QC Inspection Date",
            itemType: "DATE_INPUT",
            order: 38,
            isRequired: true
          },
          {
            section: "QC Inspector Sign-off",
            checklistItem: "Additional notes or observations",
            itemType: "TEXT_INPUT",
            order: 39,
            isRequired: false
          }
        ]
      }
    };

    // Create the T2 template
    console.log('Creating T2 Sink Production Checklist template...');
    const createdTemplate = await prisma.qcFormTemplate.create({
      data: t2Template,
      include: {
        items: true
      }
    });

    console.log(`Created template: ${createdTemplate.name} with ${createdTemplate.items.length} checklist items`);

    // Create a generic template for other product families
    const genericTemplate = {
      name: "Generic Production Checklist",
      version: "1.0",
      appliesToProductFamily: null, // Applies to all product families without a specific template
      description: "Generic quality control checklist for production",
      isActive: true,
      items: {
        create: [
          {
            section: "Pre-Assembly",
            checklistItem: "All components present per BOM",
            itemType: "PASS_FAIL",
            order: 1,
            isRequired: true
          },
          {
            section: "Pre-Assembly",
            checklistItem: "Components free from damage",
            itemType: "PASS_FAIL",
            order: 2,
            isRequired: true
          },
          {
            section: "Assembly",
            checklistItem: "Assembly completed per work instructions",
            itemType: "PASS_FAIL",
            order: 3,
            isRequired: true
          },
          {
            section: "Assembly",
            checklistItem: "All fasteners properly secured",
            itemType: "PASS_FAIL",
            order: 4,
            isRequired: true
          },
          {
            section: "Testing",
            checklistItem: "Functional test passed",
            itemType: "PASS_FAIL",
            order: 5,
            isRequired: true
          },
          {
            section: "Testing",
            checklistItem: "Test notes",
            itemType: "TEXT_INPUT",
            order: 6,
            isRequired: false
          },
          {
            section: "Final Inspection",
            checklistItem: "Unit cleaned and presentable",
            itemType: "PASS_FAIL",
            order: 7,
            isRequired: true
          },
          {
            section: "Final Inspection",
            checklistItem: "Documentation complete",
            itemType: "PASS_FAIL",
            order: 8,
            isRequired: true
          },
          {
            section: "Sign-off",
            checklistItem: "Inspector name",
            itemType: "TEXT_INPUT",
            order: 9,
            isRequired: true
          },
          {
            section: "Sign-off",
            checklistItem: "Inspection date",
            itemType: "DATE_INPUT",
            order: 10,
            isRequired: true
          }
        ]
      }
    };

    console.log('Creating Generic Production Checklist template...');
    const createdGenericTemplate = await prisma.qcFormTemplate.create({
      data: genericTemplate,
      include: {
        items: true
      }
    });

    console.log(`Created template: ${createdGenericTemplate.name} with ${createdGenericTemplate.items.length} checklist items`);

    console.log('\nQC Templates seeded successfully!');

  } catch (error) {
    console.error('Error seeding QC templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedQcTemplates()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedQcTemplates };