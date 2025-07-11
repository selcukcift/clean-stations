import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthUser, checkUserRole } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/orders/[orderId]/qc/template - Find active template for product family
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (!checkUserRole(user, ['ASSEMBLER', 'QC_PERSON', 'PRODUCTION_COORDINATOR', 'ADMIN'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    let productFamily = searchParams.get('productFamily');
    const formType = searchParams.get('formType'); // Get the form type parameter

    // If productFamily not provided, try to determine from order
    if (!productFamily) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          basinConfigurations: true
        }
      });

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Determine product family based on order details
      // For now, we'll assume T2 if not specified
      // In a real implementation, this would be determined from the order configuration
      productFamily = 'MDRD_T2_SINK';
    }

    // Build where clause for template search
    let whereClause: any = {
      isActive: true
    };

    // Enhanced form type matching for our comprehensive templates
    if (formType) {
      // Map form types to template names
      const templateNameMap: { [key: string]: string } = {
        'Pre-Production Check': 'Pre-Production Check MDRD Sink',
        'Final QC': 'T2 Sink Final QC',
        'Production Check': 'T2 Sink Production Assembly',
        'Basin Production Check': 'Basin Production Check',
        'Packaging Verification': 'Packaging Verification',
        'End-of-Line Testing': 'T2 Sink EOL Testing'
      };
      
      const templateName = templateNameMap[formType] || formType;
      
      // When searching by specific template name, search for exact match first
      // then fall back to product family specific templates
      whereClause = {
        isActive: true,
        OR: [
          { name: templateName }, // Exact name match (preferred)
          {
            AND: [
              { name: { contains: templateName } }, // Partial name match
              {
                OR: [
                  { appliesToProductFamily: null }, // Generic template
                  { appliesToProductFamily: productFamily }, // Product-specific template
                  { appliesToProductFamily: 'T2 Sink' }, // T2 Sink family
                  { appliesToProductFamily: 'MDRD' } // MDRD family
                ]
              }
            ]
          }
        ]
      };
    } else {
      // No form type specified, search by product family only
      whereClause = {
        isActive: true,
        OR: [
          { appliesToProductFamily: productFamily },
          { appliesToProductFamily: null } // Generic template as fallback
        ]
      };
    }

    // Log for debugging
    console.log('QC Template search:', {
      formType,
      productFamily,
      whereClause: JSON.stringify(whereClause)
    });

    // Find active template for product family and form type
    const template = await prisma.qcFormTemplate.findFirst({
      where: whereClause,
      include: {
        items: { 
          orderBy: { order: 'asc' } 
        }
      },
      orderBy: [
        { appliesToProductFamily: 'desc' }, // Prefer specific over generic
        { createdAt: 'desc' } // Most recent first
      ]
    });

    if (!template) {
      return NextResponse.json({ 
        error: `No active QC template found for product family ${productFamily}${formType ? ` and form type "${formType}"` : ''}`,
        productFamily,
        formType 
      }, { status: 404 });
    }

    // Check if QC has already been started for this order with this template
    const existingResult = await prisma.orderQcResult.findUnique({
      where: {
        orderId_qcFormTemplateId: {
          orderId: orderId,
          qcFormTemplateId: template.id
        }
      },
      select: {
        id: true,
        overallStatus: true
      }
    });

    return NextResponse.json({ 
      success: true,
      template,
      existingResult,
      productFamily
    });
  } catch (error) {
    console.error('Error fetching QC template:', error);
    return NextResponse.json({ error: 'Failed to fetch QC template' }, { status: 500 });
  }
}