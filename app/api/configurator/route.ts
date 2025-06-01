import { NextRequest, NextResponse } from 'next/server'
// [Per Coding Prompt Chains v5 - Hybrid Backend]
// Use src/services/configuratorService.js for all configuration data
import configuratorService from '@/src/services/configuratorService'
import { getAuthUser } from '@/lib/nextAuthUtils'

export async function GET(request: NextRequest) {
  try {
    console.log('Configurator API called')
    
    // Add authentication as per Prompt 2.B
    try {
      const user = await getAuthUser(request)
      console.log('User authenticated:', user.username)
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'Authentication required' },
          { status: 401 }
        )
      }
    } catch (authError) {
      console.error('Authentication error:', authError)
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    switch (type) {
      case 'sink-models': {
        const family = searchParams.get('family') || 'MDRD'
        const data = await configuratorService.getSinkModels(family)
        return NextResponse.json({ success: true, data })
      }
      case 'legs-types': {
        const data = await configuratorService.getLegTypes()
        return NextResponse.json({ success: true, data })
      }
      case 'feet-types': {
        const data = await configuratorService.getFeetTypes()
        return NextResponse.json({ success: true, data })
      }
      case 'pegboard-types': {
        const data = await configuratorService.getPegboardOptions()
        return NextResponse.json({ success: true, data })
      }
      case 'basin-types': {
        const data = await configuratorService.getBasinTypeOptions()
        return NextResponse.json({ success: true, data })
      }
      case 'basin-sizes': {
        const data = await configuratorService.getBasinSizeOptions()
        return NextResponse.json({ success: true, data })
      }
      case 'faucet-types': {
        const data = await configuratorService.getFaucetTypeOptions()
        return NextResponse.json({ success: true, data })
      }
      case 'sprayer-types': {
        const data = await configuratorService.getSprayerTypeOptions()
        return NextResponse.json({ success: true, data })
      }      case 'control-box': {
        // Get basin configurations from request body or query params
        const basinConfigurationsArray = searchParams.get('basins') 
          ? JSON.parse(searchParams.get('basins')!) 
          : []
        const data = await configuratorService.getControlBox(basinConfigurationsArray)
        return NextResponse.json({ success: true, data })
      }
      case 'all': {
        // Optionally fetch all config data at once
        const [sinkModels, legsTypes, feetTypes, pegboardTypes, basinTypes, basinSizes, faucetTypes, sprayerTypes] = await Promise.all([
          configuratorService.getSinkModels('MDRD'),
          configuratorService.getLegTypes(),
          configuratorService.getFeetTypes(),
          configuratorService.getPegboardOptions(),
          configuratorService.getBasinTypeOptions(),
          configuratorService.getBasinSizeOptions(),
          configuratorService.getFaucetTypeOptions(),
          configuratorService.getSprayerTypeOptions()
        ])
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
            sprayerTypes
          }
        })
      }
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
