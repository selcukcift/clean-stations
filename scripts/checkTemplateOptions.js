const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTemplateOptions() {
  try {
    const template = await prisma.qcFormTemplate.findFirst({
      where: { name: 'Pre-Production Check MDRD Sink' },
      include: {
        items: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            checklistItem: true,
            itemType: true,
            options: true,
            order: true
          }
        }
      }
    });
    
    if (!template) {
      console.log('❌ Template not found');
      return;
    }
    
    console.log('📋 Template items with options:');
    template.items.forEach(item => {
      if (item.itemType === 'SINGLE_SELECT' || item.options) {
        console.log(`${item.order}. ${item.checklistItem} (${item.itemType})`);
        console.log(`   Options raw: ${JSON.stringify(item.options)}`);
        if (item.options) {
          try {
            const parsed = typeof item.options === 'string' ? JSON.parse(item.options) : item.options;
            console.log(`   Parsed: ${JSON.stringify(parsed)}`);
          } catch (e) {
            console.log(`   Parse error: ${e.message}`);
          }
        }
        console.log('');
      }
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTemplateOptions();