import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAuthUser, canAccessOrder } from '@/lib/nextAuthUtils'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // Authenticate user
    const user = await getAuthUser(request)
    const { orderId } = params

    // Fetch the order with all required relations
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            initials: true,
            email: true
          }
        },
        associatedDocuments: true,
        generatedBoms: {
          include: {
            bomItems: {
              include: {
                children: {
                  include: {
                    children: true // Support nested hierarchy
                  }
                }
              }
            }
          }
        },
        historyLogs: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                initials: true
              }
            }
          },
          orderBy: {
            timestamp: 'desc'
          }
        },
        basinConfigurations: true,
        faucetConfigurations: true,
        sprayerConfigurations: true,
        selectedAccessories: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    // Check role-based access control
    if (!canAccessOrder(user, order)) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: order
    })

  } catch (error) {
    console.error('Error fetching order details:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
