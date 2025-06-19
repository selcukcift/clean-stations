import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthUser } from '@/lib/auth'
import { notificationTriggerService } from '@/lib/notificationTriggerService'

// Validation schema for broadcast notification
const BroadcastNotificationSchema = z.object({
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  notifyAll: z.boolean().default(true)
})

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Only ADMIN users can send broadcast notifications
    if (user.role !== 'ADMIN' && user.role !== 'PRODUCTION_COORDINATOR') {
      return NextResponse.json(
        { success: false, message: 'Only administrators and production coordinators can send broadcast notifications' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const { title, message, priority } = BroadcastNotificationSchema.parse(body)

    // Send broadcast notification to all users
    await notificationTriggerService.sendBroadcastNotification(
      title,
      message,
      priority
    )

    return NextResponse.json({
      success: true,
      message: 'Broadcast notification sent to all active users'
    })

  } catch (error) {
    console.error('Error sending broadcast notification:', error)
    
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