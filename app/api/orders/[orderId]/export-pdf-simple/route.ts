import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthUser } from '@/lib/auth';

const prisma = new PrismaClient();

// Simple server-side PDF generation using jsPDF without html2canvas dependencies
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  
  try {
    // Authentication check
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Fetch complete order data
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        sinkConfigurations: true,
        basinConfigurations: true,
        faucetConfigurations: true,
        sprayerConfigurations: true,
        selectedAccessories: true,
        generatedBoms: {
          include: {
            bomItems: {
              orderBy: { parentId: 'asc' }
            }
          }
        },
        createdBy: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Authorization check - allow admins, order creators, and procurement specialists
    const allowedRoles = ['ADMIN', 'PROCUREMENT_SPECIALIST', 'PRODUCTION_COORDINATOR'];
    if (!allowedRoles.includes(user.role) && order.createdById !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Dynamic import to avoid build-time issues
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;

    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Professional colors
    const primaryBlue = [30, 58, 138]; // #1e3a8a
    const lightGray = [248, 250, 252]; // #f8fafc
    const mediumGray = [226, 232, 240]; // #e2e8f0
    const darkText = [30, 41, 59]; // #1e293b

    // Page setup
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);

    // Company Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryBlue);
    doc.text('TORVAN MEDICAL', margin, margin + 12);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // gray
    doc.text('CleanStation Manufacturing', margin, margin + 20);
    
    // Horizontal line
    doc.setDrawColor(...mediumGray);
    doc.setLineWidth(0.5);
    doc.line(margin, margin + 25, pageWidth - margin, margin + 25);
    
    // Document title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkText);
    doc.text('Order Summary Report', margin, margin + 40);
    
    // Generation timestamp
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Generated: ${timestamp}`, pageWidth - margin - 60, margin + 40);

    let currentY = margin + 55;

    // Order Information Table
    const orderInfoData = [
      ['PO Number', order.poNumber, 'Order Status', order.orderStatus.replace(/_/g, ' ')],
      ['Customer', order.customerName, 'Sales Person', order.salesPerson],
      ['Project', order.projectName || 'N/A', 'Language', order.language],
      ['Want Date', order.wantDate.toLocaleDateString(), 'Created', order.createdAt.toLocaleDateString()],
      ['Created By', order.createdBy?.fullName || 'Unknown', 'Build Numbers', order.buildNumbers.join(', ')]
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['Order Information', '', '', '']],
      body: orderInfoData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryBlue,
        textColor: 255,
        fontSize: 12,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 4
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: contentWidth * 0.25 },
        1: { cellWidth: contentWidth * 0.25 },
        2: { fontStyle: 'bold', cellWidth: contentWidth * 0.25 },
        3: { cellWidth: contentWidth * 0.25 }
      },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Build Configuration Summary
    const buildConfigData = order.buildNumbers.map(buildNum => {
      const sinkConfig = order.sinkConfigurations?.find(sc => sc.buildNumber === buildNum);
      const basinCount = order.basinConfigurations?.filter(bc => bc.buildNumber === buildNum).length || 0;
      const faucetCount = order.faucetConfigurations?.filter(fc => fc.buildNumber === buildNum).length || 0;
      const sprayerCount = order.sprayerConfigurations?.filter(sc => sc.buildNumber === buildNum).length || 0;
      const accessoryCount = order.selectedAccessories?.filter(sa => sa.buildNumber === buildNum).length || 0;

      return [
        buildNum,
        sinkConfig ? `${sinkConfig.length || 'N/A'}" L × ${sinkConfig.width || 'N/A'}" W` : 'Not configured',
        basinCount.toString(),
        faucetCount.toString(),
        sprayerCount.toString(),
        accessoryCount.toString()
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Build #', 'Sink Dimensions', 'Basins', 'Faucets', 'Sprayers', 'Accessories']],
      body: buildConfigData,
      theme: 'striped',
      headStyles: {
        fillColor: [100, 116, 139],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { halign: 'center', fontStyle: 'bold' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' }
      },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Summary Statistics
    const totalBasins = order.basinConfigurations?.length || 0;
    const totalFaucets = order.faucetConfigurations?.length || 0;
    const totalSprayers = order.sprayerConfigurations?.length || 0;
    const totalAccessories = order.selectedAccessories?.length || 0;
    const bomItemCount = order.generatedBoms?.[0]?.bomItems?.length || 0;

    const summaryData = [
      ['Total Components', '', 'Build Information', ''],
      ['Basin Configurations', totalBasins.toString(), 'Number of Builds', order.buildNumbers.length.toString()],
      ['Faucet Configurations', totalFaucets.toString(), 'Current Assignee', order.currentAssignee || 'Unassigned'],
      ['Sprayer Configurations', totalSprayers.toString(), 'BOM Items Generated', bomItemCount.toString()],
      ['Selected Accessories', totalAccessories.toString(), 'Order Age (Days)', Math.ceil((Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24)).toString()]
    ];

    autoTable(doc, {
      startY: currentY,
      body: summaryData,
      theme: 'plain',
      bodyStyles: {
        fontSize: 10,
        cellPadding: 3
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: contentWidth * 0.25 },
        1: { halign: 'center', cellWidth: contentWidth * 0.25 },
        2: { fontStyle: 'bold', cellWidth: contentWidth * 0.25 },
        3: { halign: 'center', cellWidth: contentWidth * 0.25 }
      },
      margin: { left: margin, right: margin }
    });

    // Add BOM if available
    if (order.generatedBoms?.[0]?.bomItems?.length > 0) {
      doc.addPage();
      
      // Page header for BOM
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryBlue);
      doc.text('TORVAN MEDICAL', margin, margin + 12);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text('CleanStation Manufacturing', margin, margin + 20);
      
      doc.setDrawColor(...mediumGray);
      doc.line(margin, margin + 25, pageWidth - margin, margin + 25);
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkText);
      doc.text('Bill of Materials', margin, margin + 40);

      currentY = margin + 55;

      // Process BOM items
      const bomItems = order.generatedBoms[0].bomItems;
      
      // Create simple flat BOM table
      const bomTableData = bomItems.map(item => [
        item.partIdOrAssemblyId || '',
        item.name || '',
        (item.quantity || 0).toString(),
        item.itemType || '',
        item.category || ''
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Part Number', 'Description', 'Qty', 'Type', 'Category']],
        body: bomTableData,
        theme: 'striped',
        headStyles: {
          fillColor: primaryBlue,
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 2
        },
        columnStyles: {
          0: { cellWidth: contentWidth * 0.25, fontStyle: 'bold' },
          1: { cellWidth: contentWidth * 0.40 },
          2: { cellWidth: contentWidth * 0.10, halign: 'center' },
          3: { cellWidth: contentWidth * 0.15, halign: 'center' },
          4: { cellWidth: contentWidth * 0.10, halign: 'center' }
        },
        margin: { left: margin, right: margin }
      });

      // BOM Summary
      const totalItems = bomItems.length;
      const totalQuantity = bomItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const assemblies = bomItems.filter(item => item.itemType === 'ASSEMBLY').length;
      const parts = bomItems.filter(item => item.itemType === 'PART').length;

      currentY = (doc as any).lastAutoTable.finalY + 10;

      autoTable(doc, {
        startY: currentY,
        body: [
          ['BOM Summary', '', '', '', ''],
          ['Total Items', totalItems.toString(), 'Total Quantity', totalQuantity.toString(), ''],
          ['Assemblies', assemblies.toString(), 'Parts', parts.toString(), '']
        ],
        theme: 'plain',
        bodyStyles: {
          fontSize: 10,
          cellPadding: 3
        },
        columnStyles: {
          0: { fontStyle: 'bold' },
          2: { fontStyle: 'bold' }
        },
        margin: { left: margin, right: margin }
      });
    }

    // Add page numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
    }

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer');

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="order-${order.poNumber}-summary.pdf"`
      }
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}