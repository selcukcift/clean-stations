import { NextRequest, NextResponse } from 'next/server'

// Accessories data from accessories.js converted to API responses
const accessories = [
  // Baskets, Bins & Shelves
  {
    id: 'T-OA-BINRAIL-24-KIT',
    name: 'BIN RAIL, 24" KIT',
    category: 'Baskets, Bins & Shelves',
    subcategory: 'Rails',
    partNumber: 'T-OA-BINRAIL-24-KIT',
    description: 'Bin rail system for 24 inch mounting'
  },
  {
    id: 'T-OA-PFW1236FM-KIT',
    name: 'WIRE BASKET, SLOT BRACKET HELD, CHROME, 36"W X 12"D KIT',
    category: 'Baskets, Bins & Shelves',
    subcategory: 'Baskets',
    partNumber: 'T-OA-PFW1236FM-KIT',
    description: 'Chrome wire basket with slot bracket mounting'
  },
  {
    id: 'T-OA-SSSHELF-1812',
    name: 'STAINLESS STEEL SHELF, 18" x 12"',
    category: 'Baskets, Bins & Shelves',
    subcategory: 'Shelves',
    partNumber: 'T-OA-SSSHELF-1812',
    description: 'Stainless steel shelf 18 inches by 12 inches'
  },
  {
    id: 'T-OA-SSSHELF-3612',
    name: 'STAINLESS STEEL SHELF, 36" x 12"',
    category: 'Baskets, Bins & Shelves',
    subcategory: 'Shelves',
    partNumber: 'T-OA-SSSHELF-3612',
    description: 'Stainless steel shelf 36 inches by 12 inches'
  },

  // Holders, Plates & Hangers
  {
    id: 'T-OA-1BRUSH-ORG-PB-KIT',
    name: '1 BRUSH ORGANIZER PEGBOARD KIT',
    category: 'Holders, Plates & Hangers',
    subcategory: 'Organizers',
    partNumber: 'T-OA-1BRUSH-ORG-PB-KIT',
    description: 'Single brush organizer for pegboard mounting'
  },
  {
    id: 'T-OA-2BRUSH-ORG-PB-KIT',
    name: '2 BRUSH ORGANIZER PEGBOARD KIT',
    category: 'Holders, Plates & Hangers',
    subcategory: 'Organizers',
    partNumber: 'T-OA-2BRUSH-ORG-PB-KIT',
    description: 'Double brush organizer for pegboard mounting'
  },
  {
    id: 'T-OA-HOSE-HANGER-PB-KIT',
    name: 'HOSE HANGER PEGBOARD KIT',
    category: 'Holders, Plates & Hangers',
    subcategory: 'Hangers',
    partNumber: 'T-OA-HOSE-HANGER-PB-KIT',
    description: 'Hose hanger for pegboard mounting'
  },
  {
    id: 'T-OA-TOOL-HOLDER-PB-KIT',
    name: 'TOOL HOLDER PEGBOARD KIT',
    category: 'Holders, Plates & Hangers',
    subcategory: 'Holders',
    partNumber: 'T-OA-TOOL-HOLDER-PB-KIT',
    description: 'Universal tool holder for pegboard'
  },

  // Lighting & Electrical
  {
    id: 'T-OA-LED-LIGHT-24',
    name: 'LED LIGHT STRIP, 24"',
    category: 'Lighting & Electrical',
    subcategory: 'Lighting',
    partNumber: 'T-OA-LED-LIGHT-24',
    description: '24 inch LED light strip with mounting hardware'
  },
  {
    id: 'T-OA-LED-LIGHT-36',
    name: 'LED LIGHT STRIP, 36"',
    category: 'Lighting & Electrical',
    subcategory: 'Lighting',
    partNumber: 'T-OA-LED-LIGHT-36',
    description: '36 inch LED light strip with mounting hardware'
  },
  {
    id: 'T-OA-OUTLET-STRIP-4',
    name: 'POWER OUTLET STRIP, 4 OUTLETS',
    category: 'Lighting & Electrical',
    subcategory: 'Power',
    partNumber: 'T-OA-OUTLET-STRIP-4',
    description: '4-outlet power strip with mounting brackets'
  },
  {
    id: 'T-OA-USB-CHARGER',
    name: 'USB CHARGING STATION',
    category: 'Lighting & Electrical',
    subcategory: 'Power',
    partNumber: 'T-OA-USB-CHARGER',
    description: 'USB charging station with multiple ports'
  },

  // Storage & Organization
  {
    id: 'T-OA-DRAWER-UNIT-2',
    name: 'DRAWER UNIT, 2 DRAWER',
    category: 'Storage & Organization',
    subcategory: 'Drawers',
    partNumber: 'T-OA-DRAWER-UNIT-2',
    description: 'Two-drawer storage unit with locking mechanism'
  },
  {
    id: 'T-OA-DRAWER-UNIT-3',
    name: 'DRAWER UNIT, 3 DRAWER',
    category: 'Storage & Organization',
    subcategory: 'Drawers',
    partNumber: 'T-OA-DRAWER-UNIT-3',
    description: 'Three-drawer storage unit with locking mechanism'
  },
  {
    id: 'T-OA-CABINET-24',
    name: 'STORAGE CABINET, 24" WIDE',
    category: 'Storage & Organization',
    subcategory: 'Cabinets',
    partNumber: 'T-OA-CABINET-24',
    description: '24 inch wide storage cabinet with shelf'
  },
  {
    id: 'T-OA-CABINET-36',
    name: 'STORAGE CABINET, 36" WIDE',
    category: 'Storage & Organization',
    subcategory: 'Cabinets',
    partNumber: 'T-OA-CABINET-36',
    description: '36 inch wide storage cabinet with adjustable shelves'
  },

  // Specialized Equipment
  {
    id: 'T-OA-MICROSCOPE-ARM',
    name: 'MICROSCOPE MOUNTING ARM',
    category: 'Specialized Equipment',
    subcategory: 'Microscopy',
    partNumber: 'T-OA-MICROSCOPE-ARM',
    description: 'Adjustable mounting arm for microscopes'
  },
  {
    id: 'T-OA-MONITOR-MOUNT',
    name: 'MONITOR MOUNTING BRACKET',
    category: 'Specialized Equipment',
    subcategory: 'Displays',
    partNumber: 'T-OA-MONITOR-MOUNT',
    description: 'Articulating monitor mount with VESA compatibility'
  },
  {
    id: 'T-OA-SCALE-PLATFORM',
    name: 'DIGITAL SCALE PLATFORM',
    category: 'Specialized Equipment',
    subcategory: 'Measurement',
    partNumber: 'T-OA-SCALE-PLATFORM',
    description: 'Platform for digital scale integration'
  },
  {
    id: 'T-OA-VACUUM-PORT',
    name: 'VACUUM CONNECTION PORT',
    category: 'Specialized Equipment',
    subcategory: 'Utilities',
    partNumber: 'T-OA-VACUUM-PORT',
    description: 'Connection port for vacuum system integration'
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    let filteredAccessories = accessories

    // Filter by category
    if (category && category !== 'all') {
      filteredAccessories = filteredAccessories.filter(
        acc => acc.category.toLowerCase() === category.toLowerCase()
      )
    }

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase()
      filteredAccessories = filteredAccessories.filter(
        acc => 
          acc.name.toLowerCase().includes(searchLower) ||
          acc.partNumber.toLowerCase().includes(searchLower) ||
          acc.description.toLowerCase().includes(searchLower)
      )
    }

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedAccessories = filteredAccessories.slice(startIndex, endIndex)

    // Get unique categories for filtering
    const categories = [...new Set(accessories.map(acc => acc.category))]

    return NextResponse.json({
      success: true,
      data: paginatedAccessories,
      categories: categories,
      pagination: {
        page,
        limit,
        total: filteredAccessories.length,
        pages: Math.ceil(filteredAccessories.length / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching accessories:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
