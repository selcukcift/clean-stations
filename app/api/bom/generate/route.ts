import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { generateBOMForOrder } from '@/lib/bomService.native'

/**
 * Native Next.js API Route for BOM Generation
 * 
 * This route uses the native TypeScript implementation of the BOM rules engine,
 * eliminating the dependency on the Node.js backend while preserving all 
 * complex business logic for pegboard mapping, control box selection, etc.
 */
export async function POST(request: NextRequest) {
  let body: unknown = null
  
  try {
    // Authenticate user
    const user = await getAuthUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Parse request body
    body = await request.json()
    
    // Validate required fields
    if (!body.customer || !body.configurations || !body.buildNumbers) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid order data provided',
          error: 'Missing required fields: customer, configurations, buildNumbers'
        },
        { status: 400 }
      )
    }
    
    // Generate BOM using native TypeScript implementation
    const bomData = await generateBOMForOrder(body)
    
    // Return the BOM data in standardized format
    return NextResponse.json({
      success: true,
      data: {
        bom: bomData,
        totalItems: bomData.totalItems,
        topLevelItems: bomData.topLevelItems
      }
    })

  } catch (error) {
    console.error('❌ Native BOM Generation API Error:', error)
    console.error('❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      requestBody: body
    })
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to generate BOM',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}