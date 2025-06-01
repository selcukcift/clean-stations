import { NextRequest, NextResponse } from 'next/server'

// Configuration data from sink-config.js converted to API responses
const sinkModels = [
  { id: 'T2-B1', name: 'T2-B1 (1 basin)', basins: 1 },
  { id: 'T2-B2', name: 'T2-B2 (2 basins)', basins: 2 },
  { id: 'T2-B3', name: 'T2-B3 (3 basins)', basins: 3 }
]

const legsTypes = [
  { id: 'DL27', name: 'DL27', category: 'Height Adjustable' },
  { id: 'DL14', name: 'DL14', category: 'Height Adjustable' },
  { id: 'LC1', name: 'LC1', category: 'Height Adjustable' },
  { id: 'DL27-FH', name: 'DL27 (Fixed Height)', category: 'Fixed Height' },
  { id: 'DL14-FH', name: 'DL14 (Fixed Height)', category: 'Fixed Height' }
]

const feetTypes = [
  { id: 'F-AF', name: 'Adjustable Feet', description: 'Height adjustable feet' },
  { id: 'F-RF', name: 'Rigid Feet', description: 'Fixed height feet' },
  { id: 'F-CF', name: 'Caster Feet', description: 'Rolling casters' }
]

const pegboardTypes = [
  { id: 'PB-SS-1824', name: 'Stainless Steel Pegboard 18" x 24"', size: '18x24' },
  { id: 'PB-SS-3624', name: 'Stainless Steel Pegboard 36" x 24"', size: '36x24' },
  { id: 'PB-SS-4824', name: 'Stainless Steel Pegboard 48" x 24"', size: '48x24' }
]

const basinTypes = [
  { id: 'E-SINK', name: 'E-Sink', description: 'Electronic sink with sensors' },
  { id: 'E-DRAIN', name: 'E-Drain', description: 'Electronic drain only' },
  { id: 'M-SINK', name: 'Manual Sink', description: 'Traditional manual operation' },
  { id: 'BASIN-ONLY', name: 'Basin Only', description: 'Basin without electronics' }
]

const basinSizes = [
  { id: 'BS-1620', name: '16" x 20"', width: 16, length: 20 },
  { id: 'BS-1824', name: '18" x 24"', width: 18, length: 24 },
  { id: 'BS-2024', name: '20" x 24"', width: 20, length: 24 },
  { id: 'BS-CUSTOM', name: 'Custom Size', width: 0, length: 0 }
]

const faucetTypes = [
  { id: 'F-ELECT', name: 'Electronic Faucet', description: 'Touch-free electronic faucet' },
  { id: 'F-MANUAL', name: 'Manual Faucet', description: 'Traditional manual faucet' },
  { id: 'F-KNEE', name: 'Knee Operated', description: 'Knee-operated faucet' }
]

const sprayerTypes = [
  { id: 'S-HANDHELD', name: 'Handheld Sprayer', description: 'Detachable handheld sprayer' },
  { id: 'S-FIXED', name: 'Fixed Sprayer', description: 'Fixed position sprayer' },
  { id: 'S-RETRACT', name: 'Retractable Sprayer', description: 'Retractable hose sprayer' }
]

const controlBoxes = [
  { id: 'CB-SINGLE', name: 'Single Basin Control', description: 'Control box for 1 basin' },
  { id: 'CB-DUAL', name: 'Dual Basin Control', description: 'Control box for 2 basins' },
  { id: 'CB-TRIPLE', name: 'Triple Basin Control', description: 'Control box for 3 basins' }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    switch (type) {
      case 'sink-models':
        return NextResponse.json({ success: true, data: sinkModels })
      
      case 'legs-types':
        return NextResponse.json({ success: true, data: legsTypes })
      
      case 'feet-types':
        return NextResponse.json({ success: true, data: feetTypes })
      
      case 'pegboard-types':
        return NextResponse.json({ success: true, data: pegboardTypes })
      
      case 'basin-types':
        return NextResponse.json({ success: true, data: basinTypes })
      
      case 'basin-sizes':
        return NextResponse.json({ success: true, data: basinSizes })
      
      case 'faucet-types':
        return NextResponse.json({ success: true, data: faucetTypes })
      
      case 'sprayer-types':
        return NextResponse.json({ success: true, data: sprayerTypes })
      
      case 'control-boxes':
        return NextResponse.json({ success: true, data: controlBoxes })
      
      case 'all':
        return NextResponse.json({
          success: true,
          data: {
            sinkModels,
            legsTypes,
            feetTypes,
            pegboardTypes,
            basinTypes,
            basinSizes,
            faucetTypes,
            sprayerTypes,
            controlBoxes
          }
        })
      
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid configuration type' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error fetching configuration:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
