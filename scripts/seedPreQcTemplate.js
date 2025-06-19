const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Seeding Pre-Production Check template...')

  // Check if template already exists
  const existingTemplate = await prisma.qcFormTemplate.findFirst({
    where: {
      name: 'Pre-Production Check MDRD Sink',
      version: '1.0'
    }
  })

  if (existingTemplate) {
    console.log('✅ Pre-Production Check template already exists')
    return
  }

  // Create the Pre-Production Check template
  const template = await prisma.qcFormTemplate.create({
    data: {
      name: 'Pre-Production Check MDRD Sink',
      version: '1.0',
      description: 'Pre-production quality control checklist for T2 Sink production based on CLP.T2.001.V01',
      isActive: true,
      appliesToProductFamily: 'T2 Sink',
      items: {
        create: [
          // Section 1: Pre-Production Check Items
          {
            section: 'PRE-PRODUCTION CHECK',
            checklistItem: 'Check Final Sink Dimensions, basin dimensions, & BOM',
            itemType: 'PASS_FAIL',
            order: 1,
            isRequired: true,
            notesPrompt: 'Check dimensions of the entire sink, each basin, and any other dimension mentioned on the drawing'
          },
          {
            section: 'PRE-PRODUCTION CHECK',
            checklistItem: 'Attach the final approved drawing and paperwork',
            itemType: 'CHECKBOX',
            order: 2,
            isRequired: true,
            notesPrompt: 'Ensure all documentation is attached'
          },
          {
            section: 'PRE-PRODUCTION CHECK',
            checklistItem: 'Pegboard installed – dimensions match drawing',
            itemType: 'PASS_FAIL',
            order: 3,
            isRequired: false,
            applicabilityCondition: 'hasPegboard',
            notesPrompt: 'N/A if no pegboard'
          },
          {
            section: 'PRE-PRODUCTION CHECK',
            checklistItem: 'Location of sink faucet holes and mounting holes match drawing/customer order requirements',
            itemType: 'PASS_FAIL',
            order: 4,
            isRequired: true
          },
          {
            section: 'PRE-PRODUCTION CHECK',
            checklistItem: 'Sink has castors/feet as specified',
            itemType: 'SINGLE_SELECT',
            order: 5,
            isRequired: true,
            options: JSON.stringify({
              choices: ['Lock & levelling castors', 'Levelling Feet', 'Both', 'None']
            })
          },
          // Basin-specific items (repeat per basin)
          {
            section: 'PRE-PRODUCTION CHECK',
            checklistItem: 'Bottom fill hole',
            itemType: 'CHECKBOX',
            order: 6,
            isRequired: true,
            repeatPer: 'BASIN',
            notesPrompt: 'Check for each basin'
          },
          {
            section: 'PRE-PRODUCTION CHECK',
            checklistItem: 'Drain Button',
            itemType: 'CHECKBOX',
            order: 7,
            isRequired: true,
            repeatPer: 'BASIN',
            notesPrompt: 'Check for each basin'
          },
          {
            section: 'PRE-PRODUCTION CHECK',
            checklistItem: 'Basin Light',
            itemType: 'CHECKBOX',
            order: 8,
            isRequired: true,
            repeatPer: 'BASIN',
            notesPrompt: 'Check for each basin'
          },
          {
            section: 'PRE-PRODUCTION CHECK',
            checklistItem: 'Drain Location',
            itemType: 'SINGLE_SELECT',
            order: 9,
            isRequired: true,
            repeatPer: 'BASIN',
            options: JSON.stringify({
              choices: ['Center', 'Other']
            }),
            notesPrompt: 'Specify location if "Other"'
          },
          {
            section: 'PRE-PRODUCTION CHECK',
            checklistItem: 'Sink Faucet Location',
            itemType: 'SINGLE_SELECT',
            order: 10,
            isRequired: true,
            options: JSON.stringify({
              choices: [
                'Center of basin',
                'Between Basins 1/2',
                'Between Basins 2/3',
                'Center',
                'Other'
              ]
            }),
            notesPrompt: 'Specify location if "Other"'
          },
          // Additional metadata fields
          {
            section: 'METADATA',
            checklistItem: 'Job ID#',
            itemType: 'TEXT_INPUT',
            order: 11,
            isRequired: true,
            notesPrompt: 'Enter the Job ID number'
          },
          {
            section: 'METADATA',
            checklistItem: '# of Basins',
            itemType: 'NUMERIC_INPUT',
            order: 12,
            isRequired: true,
            expectedValue: '1-3',
            notesPrompt: 'Enter number of basins (1-3)'
          },
          {
            section: 'METADATA',
            checklistItem: 'Initials',
            itemType: 'TEXT_INPUT',
            order: 13,
            isRequired: true,
            notesPrompt: 'Enter your initials'
          }
        ]
      }
    },
    include: {
      items: true
    }
  })

  console.log(`✅ Created Pre-Production Check template with ${template.items.length} items`)
  
  // Display template structure
  console.log('\n📋 Template structure:')
  template.items.forEach(item => {
    console.log(`  - ${item.section}: ${item.checklistItem} (${item.itemType})${item.repeatPer ? ` [Repeat per ${item.repeatPer}]` : ''}`)
  })
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })