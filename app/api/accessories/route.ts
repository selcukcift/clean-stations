import { NextRequest, NextResponse } from 'next/server'
// [Per Coding Prompt Chains v5 - Hybrid Backend]
// Use src/services/accessoriesService.js for all accessory data
const accessoriesService = require('@/src/services/accessoriesService')

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    switch (type) {
      case 'categories': {
        const data = await accessoriesService.getAccessoryCategories()
        return NextResponse.json({ success: true, data })
      }
      case 'by-category': {
        const categoryCode = searchParams.get('categoryCode')
        if (!categoryCode) {
          return NextResponse.json({ success: false, message: 'categoryCode is required' }, { status: 400 })
        }
        const data = await accessoriesService.getAccessoriesByCategory(categoryCode)
        return NextResponse.json({ success: true, data })
      }
      case 'all': {
        const searchTerm = searchParams.get('search') || ''
        const categoryFilter = searchParams.get('category') || ''
        const data = await accessoriesService.getAllAccessories({ searchTerm, categoryFilter })
        return NextResponse.json({ success: true, data })
      }
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid accessories query type' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error fetching accessories:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
