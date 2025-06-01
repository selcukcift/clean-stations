import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export interface AuthUser {
  id: string
  username: string
  email: string
  fullName: string
  role: string
  isActive: boolean
  initials: string
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser> {
  console.log('getAuthUser called')
  
  // Try to get token from Authorization header first (for API calls)
  let token = request.headers.get('authorization')?.replace('Bearer ', '')
  console.log('Token from Authorization header:', token ? 'found' : 'not found')
  
  // If no Bearer token, try to get from cookies (for browser requests)
  if (!token) {
    try {
      // Get cookies from the request directly
      const cookieHeader = request.headers.get('cookie')
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=')
          acc[key] = value
          return acc
        }, {} as Record<string, string>)
        token = cookies['auth-token']
        console.log('Token from cookies:', token ? 'found' : 'not found')
      }
    } catch (error) {
      console.error('Error getting cookies:', error)
    }
  }

  if (!token) {
    console.log('No token found')
    throw new Error('Authentication required')
  }

  try {
    console.log('Verifying token...')
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    console.log('Token decoded, userId:', decoded.userId)
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        initials: true
      }
    })

    console.log('User found:', user ? 'yes' : 'no')

    if (!user || !user.isActive) {
      throw new Error('Invalid user')
    }

    return user as AuthUser
  } catch (error) {
    console.error('Token verification error:', error)
    throw new Error('Invalid authentication token')
  }
}

export function checkUserRole(user: AuthUser, allowedRoles: string[]): boolean {
  return allowedRoles.includes(user.role)
}

export function canAccessOrder(user: AuthUser, order: any): boolean {
  // Admin can access all orders
  if (user.role === 'ADMIN') {
    return true
  }
  
  // Production Coordinator can access all orders
  if (user.role === 'PRODUCTION_COORDINATOR') {
    return true
  }
  
  // Order creator can access their own orders
  if (order.createdById === user.id) {
    return true
  }
  
  // Assemblers can access orders assigned to them or in specific statuses
  if (user.role === 'ASSEMBLER') {
    return order.currentAssignee === user.id || 
           ['READY_FOR_PRODUCTION', 'TESTING_COMPLETE'].includes(order.orderStatus)
  }
  
  // QC can access orders ready for QC
  if (user.role === 'QC_PERSON') {
    return ['READY_FOR_PRE_QC', 'READY_FOR_FINAL_QC'].includes(order.orderStatus)
  }
  
  // Procurement can access orders that need parts management
  if (user.role === 'PROCUREMENT_SPECIALIST') {
    return ['ORDER_CREATED', 'PARTS_SENT_WAITING_ARRIVAL'].includes(order.orderStatus)
  }
  
  return false
}