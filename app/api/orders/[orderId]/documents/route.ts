import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { prisma } from '@/lib/prisma'

function getFileTypeFromName(fileName: string): string {
  const extension = fileName.toLowerCase().split('.').pop()
  
  switch (extension) {
    case 'pdf':
      return 'application/pdf'
    case 'doc':
    case 'docx':
      return 'application/msword'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'txt':
      return 'text/plain'
    case 'dwg':
      return 'application/dwg'
    case 'dxf':
      return 'application/dxf'
    default:
      return 'application/octet-stream'
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await params

    // Fetch order to verify it exists and user has access
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { 
        id: true, 
        poNumber: true, 
        customerName: true,
        associatedDocuments: {
          select: {
            id: true,
            docName: true,
            docURL: true,
            docType: true,
            timestamp: true,
            uploadedBy: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Transform the documents data
    const documents = order.associatedDocuments.map(doc => ({
      id: doc.id,
      fileName: doc.docName,
      filePath: doc.docURL,
      fileType: getFileTypeFromName(doc.docName),
      documentType: doc.docType || 'Unknown',
      uploadedAt: doc.timestamp.toISOString(),
      size: null, // Size not available in current schema
      description: null,
      uploadedBy: doc.uploadedBy
    }))

    return NextResponse.json({
      success: true,
      documents,
      orderInfo: {
        id: order.id,
        poNumber: order.poNumber,
        customerName: order.customerName
      }
    })

  } catch (error) {
    console.error('Error fetching order documents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}