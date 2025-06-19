import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { orderId: string; buildNumber: string } }
) {
  try {
    const { orderId, buildNumber } = params
    
    // Authenticate user and check permissions
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Only admins can delete configurations
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required to delete configurations' },
        { status: 403 }
      )
    }

    // Check if order exists and user can access it
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        sinkConfigurations: true,
        accessories: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if the build number exists in this order
    if (!order.buildNumbers.includes(buildNumber)) {
      return NextResponse.json(
        { success: false, error: 'Build number not found in this order' },
        { status: 404 }
      )
    }

    // Prevent deletion if it's the only configuration
    if (order.buildNumbers.length <= 1) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the only configuration in an order' },
        { status: 400 }
      )
    }

    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Remove sink configuration for this build number
      await tx.sinkConfiguration.deleteMany({
        where: {
          orderId: orderId,
          buildNumber: buildNumber
        }
      })

      // Remove accessories for this build number
      await tx.accessory.deleteMany({
        where: {
          orderId: orderId,
          buildNumbers: {
            has: buildNumber
          }
        }
      })

      // Update order to remove build number
      const updatedBuildNumbers = order.buildNumbers.filter(bn => bn !== buildNumber)
      
      await tx.order.update({
        where: { id: orderId },
        data: {
          buildNumbers: updatedBuildNumbers,
          // Update total items count if needed
          totalItems: Math.max(1, updatedBuildNumbers.length),
          updatedAt: new Date()
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: `Configuration for build ${buildNumber} has been deleted successfully`
    })

  } catch (error) {
    console.error('Delete configuration error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error while deleting configuration' 
      },
      { status: 500 }
    )
  }
}