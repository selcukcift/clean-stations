import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

// Validation schemas
const CustomerInfoSchema = z.object({
  poNumber: z.string().min(1, 'PO Number is required'),
  customerName: z.string().min(1, 'Customer Name is required'),
  projectName: z.string().optional(),
  salesPerson: z.string().min(1, 'Sales Person is required'),
  wantDate: z.string().transform((str) => new Date(str)),
  language: z.enum(['English', 'Spanish', 'French']),
  notes: z.string().optional()
})

const BasinConfigurationSchema = z.object({
  basinTypeId: z.string().optional(),
  basinSizePartNumber: z.string().optional(),
  addonIds: z.array(z.string()).optional()
})

const FaucetConfigurationSchema = z.object({
  faucetTypeId: z.string().optional(),
  quantity: z.number().optional()
})

const SprayerConfigurationSchema = z.object({
  hasSprayerSystem: z.boolean(),
  sprayerTypeIds: z.array(z.string()).optional()
})

const SinkConfigurationSchema = z.object({
  sinkModelId: z.string(),
  sinkWidth: z.number().optional(),
  sinkLength: z.number().optional(),
  legsTypeId: z.string().optional(),
  feetTypeId: z.string().optional(),
  pegboard: z.boolean().optional(),
  pegboardTypeId: z.string().optional(),
  pegboardSizePartNumber: z.string().optional(),
  workFlowDirection: z.enum(['Left', 'Right']),
  basins: z.array(BasinConfigurationSchema),
  faucet: FaucetConfigurationSchema,
  sprayer: SprayerConfigurationSchema,
  controlBoxId: z.string().optional()
})

const SelectedAccessorySchema = z.object({
  assemblyId: z.string(),
  quantity: z.number().min(1)
})

const SinkSelectionSchema = z.object({
  sinkModelId: z.string(),
  quantity: z.number().min(1),
  buildNumbers: z.array(z.string())
})

const OrderCreateSchema = z.object({
  customerInfo: CustomerInfoSchema,
  sinkSelection: SinkSelectionSchema,
  configurations: z.record(z.string(), SinkConfigurationSchema),
  accessories: z.record(z.string(), z.array(SelectedAccessorySchema))
})

// Authentication helper
async function getAuthenticatedUser(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) {
    throw new Error('Authentication required')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })
    
    if (!user || !user.isActive) {
      throw new Error('Invalid user')
    }
    
    return user
  } catch (error) {
    throw new Error('Invalid authentication token')
  }
}

// BOM Generation Service
async function generateBOM(orderId: string, configurations: Record<string, any>) {
  try {
    // Create a comprehensive BOM for the order
    const bom = await prisma.bom.create({
      data: {
        orderId: orderId,
        buildNumber: null, // Order-wide BOM
      }
    })

    const bomItems = []

    // Add system items (always included)
    bomItems.push({
      bomId: bom.id,
      partIdOrAssemblyId: 'SYSTEM-MANUAL',
      name: 'User Manual',
      quantity: 1,
      itemType: 'SYSTEM',
      category: 'SYSTEM'
    })

    // Process each build configuration
    for (const [buildNumber, config] of Object.entries(configurations)) {
      // Add sink body assembly
      if (config.sinkModelId) {
        bomItems.push({
          bomId: bom.id,
          partIdOrAssemblyId: config.sinkModelId,
          name: `Sink Body ${config.sinkModelId}`,
          quantity: 1,
          itemType: 'ASSEMBLY',
          category: 'SINK_BODY'
        })
      }

      // Add legs and feet
      if (config.legsTypeId) {
        bomItems.push({
          bomId: bom.id,
          partIdOrAssemblyId: config.legsTypeId,
          name: `Legs Kit ${config.legsTypeId}`,
          quantity: 1,
          itemType: 'ASSEMBLY',
          category: 'LEGS'
        })
      }

      if (config.feetTypeId) {
        bomItems.push({
          bomId: bom.id,
          partIdOrAssemblyId: config.feetTypeId,
          name: `Feet ${config.feetTypeId}`,
          quantity: 1,
          itemType: 'PART',
          category: 'FEET'
        })
      }

      // Add pegboard if configured
      if (config.pegboard && config.pegboardTypeId) {
        bomItems.push({
          bomId: bom.id,
          partIdOrAssemblyId: config.pegboardTypeId,
          name: `Pegboard ${config.pegboardTypeId}`,
          quantity: 1,
          itemType: 'ASSEMBLY',
          category: 'PEGBOARD'
        })
      }

      // Add basin assemblies
      if (config.basins && config.basins.length > 0) {
        config.basins.forEach((basin: any, index: number) => {
          if (basin.basinTypeId) {
            bomItems.push({
              bomId: bom.id,
              partIdOrAssemblyId: basin.basinTypeId,
              name: `Basin ${basin.basinTypeId} #${index + 1}`,
              quantity: basin.basinCount || 1,
              itemType: 'ASSEMBLY',
              category: 'BASIN'
            })
          }
        })
      }

      // Add faucet configuration
      if (config.faucet?.faucetTypeId) {
        bomItems.push({
          bomId: bom.id,
          partIdOrAssemblyId: config.faucet.faucetTypeId,
          name: `Faucet ${config.faucet.faucetTypeId}`,
          quantity: config.faucet.quantity || 1,
          itemType: 'ASSEMBLY',
          category: 'FAUCET'
        })
      }

      // Add sprayer system
      if (config.sprayer?.hasSprayerSystem && config.sprayer.sprayerTypeIds) {
        config.sprayer.sprayerTypeIds.forEach((sprayerId: string) => {
          bomItems.push({
            bomId: bom.id,
            partIdOrAssemblyId: sprayerId,
            name: `Sprayer ${sprayerId}`,
            quantity: 1,
            itemType: 'ASSEMBLY',
            category: 'SPRAYER'
          })
        })
      }

      // Add control box if needed
      if (config.controlBoxId) {
        bomItems.push({
          bomId: bom.id,
          partIdOrAssemblyId: config.controlBoxId,
          name: `Control Box ${config.controlBoxId}`,
          quantity: 1,
          itemType: 'ASSEMBLY',
          category: 'CONTROL_BOX'
        })
      }
    }

    // Bulk create BOM items
    if (bomItems.length > 0) {
      await prisma.bomItem.createMany({
        data: bomItems
      })
    }

    return bom.id
  } catch (error) {
    console.error('Error generating BOM:', error)
    throw new Error('Failed to generate BOM')
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request)
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = OrderCreateSchema.parse(body)

    const { customerInfo, sinkSelection, configurations, accessories } = validatedData

    // Check if PO number already exists
    const existingOrder = await prisma.order.findUnique({
      where: { poNumber: customerInfo.poNumber }
    })

    if (existingOrder) {
      return NextResponse.json(
        { success: false, message: 'PO Number already exists' },
        { status: 400 }
      )
    }

    // Create the main order
    const order = await prisma.order.create({
      data: {
        poNumber: customerInfo.poNumber,
        buildNumbers: sinkSelection.buildNumbers,
        customerName: customerInfo.customerName,
        projectName: customerInfo.projectName || null,
        salesPerson: customerInfo.salesPerson,
        wantDate: customerInfo.wantDate,
        notes: customerInfo.notes || null,
        language: customerInfo.language === 'English' ? 'EN' : 
                 customerInfo.language === 'French' ? 'FR' : 'ES',
        createdById: user.id
      }
    })

    // Create basin configurations
    const basinConfigs = []
    for (const [buildNumber, config] of Object.entries(configurations)) {
      if (config.basins && config.basins.length > 0) {
        for (const basin of config.basins) {
          basinConfigs.push({
            buildNumber,
            orderId: order.id,
            basinTypeId: basin.basinTypeId || '',
            basinSizePartNumber: basin.basinSizePartNumber,
            basinCount: basin.addonIds?.length || 1,
            addonIds: basin.addonIds || []
          })
        }
      }
    }

    if (basinConfigs.length > 0) {
      await prisma.basinConfiguration.createMany({
        data: basinConfigs
      })
    }

    // Create faucet configurations
    const faucetConfigs = []
    for (const [buildNumber, config] of Object.entries(configurations)) {
      if (config.faucet?.faucetTypeId) {
        faucetConfigs.push({
          buildNumber,
          orderId: order.id,
          faucetTypeId: config.faucet.faucetTypeId,
          faucetQuantity: config.faucet.quantity || 1,
          faucetPlacement: 'Center' // Default placement
        })
      }
    }

    if (faucetConfigs.length > 0) {
      await prisma.faucetConfiguration.createMany({
        data: faucetConfigs
      })
    }

    // Create sprayer configurations
    const sprayerConfigs = []
    for (const [buildNumber, config] of Object.entries(configurations)) {
      if (config.sprayer) {
        sprayerConfigs.push({
          buildNumber,
          orderId: order.id,
          hasSpray: config.sprayer.hasSprayerSystem,
          sprayerTypeIds: config.sprayer.sprayerTypeIds || [],
          sprayerQuantity: config.sprayer.sprayerTypeIds?.length || 0,
          sprayerLocations: config.sprayer.sprayerTypeIds?.map(() => 'Center') || []
        })
      }
    }

    if (sprayerConfigs.length > 0) {
      await prisma.sprayerConfiguration.createMany({
        data: sprayerConfigs
      })
    }

    // Create selected accessories
    const accessoryItems = []
    for (const [buildNumber, buildAccessories] of Object.entries(accessories)) {
      if (buildAccessories && buildAccessories.length > 0) {
        for (const accessory of buildAccessories) {
          accessoryItems.push({
            buildNumber,
            orderId: order.id,
            assemblyId: accessory.assemblyId,
            quantity: accessory.quantity
          })
        }
      }
    }

    if (accessoryItems.length > 0) {
      await prisma.selectedAccessory.createMany({
        data: accessoryItems
      })
    }

    // Generate BOM
    const bomId = await generateBOM(order.id, configurations)

    // Create order history log
    await prisma.orderHistoryLog.create({
      data: {
        orderId: order.id,
        userId: user.id,
        action: 'ORDER_CREATED',
        newStatus: 'ORDER_CREATED',
        notes: `Order created with ${sinkSelection.buildNumbers.length} sinks`
      }
    })

    return NextResponse.json({
      success: true,
      orderId: order.id,
      bomId: bomId,
      message: 'Order created successfully'
    })

  } catch (error) {
    console.error('Error creating order:', error)
    
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

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const poNumber = searchParams.get('poNumber')

    const where: any = {}
    
    if (status) {
      where.orderStatus = status
    }
    
    if (poNumber) {
      where.poNumber = {
        contains: poNumber,
        mode: 'insensitive'
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        createdBy: {
          select: {
            fullName: true,
            initials: true
          }
        },
        basinConfigurations: true,
        faucetConfigurations: true,
        sprayerConfigurations: true,
        selectedAccessories: true,
        generatedBoms: {
          include: {
            bomItems: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await prisma.order.count({ where })

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching orders:', error)
    
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
