import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { getAuthUser, canAccessOrder } from '@/lib/auth'
import { notificationTriggerService } from '@/lib/notificationTriggerService'

const prisma = new PrismaClient()

// Validation schema for status update
const StatusUpdateSchema = z.object({
  newStatus: z.enum([
    'ORDER_CREATED',
    'PARTS_SENT_WAITING_ARRIVAL',
    'READY_FOR_PRE_QC',
    'READY_FOR_PRODUCTION',
    'ASSEMBLY_IN_PROGRESS',
    'READY_FOR_EOL_TESTING',
    'EOL_TESTING_IN_PROGRESS',
    'TESTING_COMPLETE',
    'PACKAGING_IN_PROGRESS',
    'PACKAGING_COMPLETE',
    'READY_FOR_FINAL_QC',
    'READY_FOR_SHIP',
    'SHIPPED'
  ]),
  notes: z.string().optional(),
  notifyAll: z.boolean().optional() // Flag to notify all users
})

// Status transition validation logic
function validateStatusTransition(
  currentStatus: string,
  newStatus: string,
  userRole: string
): { valid: boolean; message?: string } {
  // Admin can make any transition
  if (userRole === 'ADMIN') {
    return { valid: true }
  }

  // Production Coordinator can make most transitions
  if (userRole === 'PRODUCTION_COORDINATOR') {
    return { valid: true }
  }

  // Define allowed transitions based on current status and role
  const transitions: Record<string, Record<string, string[]>> = {
    'ORDER_CREATED': {
      'PROCUREMENT_SPECIALIST': ['PARTS_SENT_WAITING_ARRIVAL'], // Procurement sends parts first
      'PRODUCTION_COORDINATOR': ['PARTS_SENT_WAITING_ARRIVAL', 'READY_FOR_PRE_QC']
    },
    'PARTS_SENT_WAITING_ARRIVAL': {
      'PROCUREMENT_SPECIALIST': ['READY_FOR_PRE_QC'],
      'PRODUCTION_COORDINATOR': ['READY_FOR_PRE_QC', 'READY_FOR_PRODUCTION'] // Can skip if parts arrive quickly
    },
    'READY_FOR_PRE_QC': { // Auto-transitions to READY_FOR_PRODUCTION on QC pass
      'QC_PERSON': ['READY_FOR_PRODUCTION'], // If Pre-QC passes
      'PRODUCTION_COORDINATOR': ['READY_FOR_PRODUCTION'] // Override
    },
    'READY_FOR_PRODUCTION': { // Auto-transitions to ASSEMBLY_IN_PROGRESS when tasks start
      'ASSEMBLER': ['ASSEMBLY_IN_PROGRESS'], // Assembler manually indicates start
      'PRODUCTION_COORDINATOR': ['ASSEMBLY_IN_PROGRESS'] // Override
    },
    'ASSEMBLY_IN_PROGRESS': { // Auto-transitions to READY_FOR_EOL_TESTING when all tasks complete
      'ASSEMBLER': ['READY_FOR_EOL_TESTING'], // Assembler confirms all assembly done
      'PRODUCTION_COORDINATOR': ['READY_FOR_EOL_TESTING'] // Override
    },
    'READY_FOR_EOL_TESTING': { // Auto-transitions to EOL_TESTING_IN_PROGRESS when tests start
      'ASSEMBLER': ['EOL_TESTING_IN_PROGRESS'], // Assembler starts EOL tests
      'PRODUCTION_COORDINATOR': ['EOL_TESTING_IN_PROGRESS'] // Override
    },
    'EOL_TESTING_IN_PROGRESS': { // Auto-transitions to TESTING_COMPLETE on test pass
      'ASSEMBLER': ['TESTING_COMPLETE'], // Assembler confirms tests passed
      'PRODUCTION_COORDINATOR': ['TESTING_COMPLETE'] // Override
    },
    'TESTING_COMPLETE': { // This is after EOL testing is done
      'ASSEMBLER': ['PACKAGING_IN_PROGRESS'], // Start packaging
      'PRODUCTION_COORDINATOR': ['PACKAGING_IN_PROGRESS', 'READY_FOR_PACKAGING_QC'] // Can skip to QC if packaging is quick/simple
    },
    'PACKAGING_IN_PROGRESS': { // This would be set if packaging is a distinct, tracked phase
      'ASSEMBLER': ['PACKAGING_COMPLETE'],
      'PRODUCTION_COORDINATOR': ['PACKAGING_COMPLETE', 'READY_FOR_PACKAGING_QC']
    },
    'PACKAGING_COMPLETE': { // This implies packaging checklist (if any) is done
      // This might become READY_FOR_PACKAGING_QC if we implement packaging QC
      // For now, let's assume it can go to READY_FOR_FINAL_QC
      'ASSEMBLER': ['READY_FOR_FINAL_QC'], // Assembler hands over for Final QC
      'QC_PERSON': ['READY_FOR_FINAL_QC'], // QC can pull it if they see it's packaged
      'PRODUCTION_COORDINATOR': ['READY_FOR_FINAL_QC']
    },
    'READY_FOR_FINAL_QC': {
      'QC_PERSON': ['READY_FOR_SHIP'],
      'PRODUCTION_COORDINATOR': ['READY_FOR_SHIP']
    },
    'READY_FOR_SHIP': {
      'PRODUCTION_COORDINATOR': ['SHIPPED']
    }
  }

  const allowedTransitions = transitions[currentStatus]?.[userRole] || []
  
  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      message: `${userRole} cannot transition from ${currentStatus} to ${newStatus}`
    }
  }

  return { valid: true }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  try {
    // Authenticate user
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const { newStatus, notes, notifyAll } = StatusUpdateSchema.parse(body)

    // Fetch the current order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            initials: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    // Check access control
    if (!canAccessOrder(user, order)) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    // Validate status transition
    const transitionValidation = validateStatusTransition(
      order.orderStatus,
      newStatus,
      user.role
    )

    if (!transitionValidation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          message: transitionValidation.message || 'Invalid status transition' 
        },
        { status: 403 }
      )
    }

    // Perform the update within a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          orderStatus: newStatus as any,
          updatedAt: new Date()
        },
        include: {
          createdBy: {
            select: {
              id: true,
              fullName: true,
              initials: true
            }
          }
        }
      })

      // Create history log entry
      await tx.orderHistoryLog.create({
        data: {
          orderId: orderId,
          userId: user.id,
          action: 'STATUS_UPDATED',
          oldStatus: order.orderStatus,
          newStatus: newStatus,
          notes: notes || `Status updated from ${order.orderStatus} to ${newStatus}`
        }
      })

      return updatedOrder
    })

    // Trigger notifications for order status change (async, non-blocking)
    notificationTriggerService.triggerOrderStatusChange(
      orderId, 
      order.orderStatus, 
      newStatus, 
      user.id,
      notifyAll || false
    ).catch(error => {
      console.error('Failed to trigger order status change notifications:', error)
    })

    // Trigger QC approval notifications for specific statuses
    if (newStatus === 'READY_FOR_PRE_QC') {
      notificationTriggerService.triggerQcApprovalRequired(orderId, 'PRE_QC').catch(error => {
        console.error('Failed to trigger QC approval notification:', error)
      })
    } else if (newStatus === 'READY_FOR_FINAL_QC') {
      notificationTriggerService.triggerQcApprovalRequired(orderId, 'FINAL_QC').catch(error => {
        console.error('Failed to trigger QC approval notification:', error)
      })
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Order status updated to ${newStatus}`
    })

  } catch (error) {
    console.error('Error updating order status:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation error',
          errors: error.errors
        },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
