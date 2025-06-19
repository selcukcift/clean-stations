const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testQCTemplateQuery() {
  try {
    console.log('🔍 Testing QC template query...');
    
    // Get the order first
    const order = await prisma.order.findFirst({
      where: { orderStatus: 'READY_FOR_PRE_QC' }
    });
    
    if (!order) {
      console.log('❌ No order with READY_FOR_PRE_QC status found');
      return;
    }
    
    console.log('📦 Order found:', {
      id: order.id,
      poNumber: order.poNumber,
      status: order.orderStatus
    });
    
    // Test the template query
    const template = await prisma.qcFormTemplate.findFirst({
      where: {
        isActive: true,
        name: 'Pre-Production Check MDRD Sink'
      },
      include: {
        items: { orderBy: { order: 'asc' } }
      }
    });
    
    console.log('✅ Template found:', {
      found: !!template,
      name: template?.name,
      itemCount: template?.items?.length || 0,
      productFamily: template?.appliesToProductFamily
    });
    
    if (template) {
      console.log('\n📋 Template items:');
      template.items.forEach((item, i) => {
        console.log(`${i+1}. ${item.section}: ${item.checklistItem} (${item.itemType})`);
      });
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

testQCTemplateQuery();