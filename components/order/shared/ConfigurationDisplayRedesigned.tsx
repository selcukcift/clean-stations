"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Package2, 
  Ruler, 
  Layers, 
  Droplets, 
  Wrench,
  Grid3x3,
  Palette,
  Box,
  Wind,
  Gauge,
  Settings2,
  ChevronRight,
  Activity,
  Zap,
  Database
} from "lucide-react"
import { ConfigurationDisplayProps } from "./ConfigurationDisplay"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"

// Helper functions (reuse from original)
const toTitleCase = (str: string): string => {
  if (!str) return str
  
  const preserveWords = ['ID', 'QC', 'DI', 'PVC', 'ABS', 'SS', 'LED', 'USB', 'AC', 'DC', 'PSU']
  const lowerCaseWords = ['and', 'or', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
  
  return str.split(/[\s-_]+/).map((word, index) => {
    const upperWord = word.toUpperCase()
    
    if (preserveWords.includes(upperWord)) {
      return upperWord
    }
    
    if (index > 0 && lowerCaseWords.includes(word.toLowerCase())) {
      return word.toLowerCase()
    }
    
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  }).join(' ')
}

// Part descriptions mapping (reuse from original)
const partDescriptions: Record<string, string> = {
  // Sink Models
  'MDRD_B1_ESINK_48': 'Single Basin E-Sink (48")',
  'MDRD_B1_ESINK_60': 'Single Basin E-Sink (60")',
  'MDRD_B1_ESINK_72': 'Single Basin E-Sink (72")',
  'MDRD_B2_ESINK_48': 'Double Basin E-Sink (48")',
  'MDRD_B2_ESINK_60': 'Double Basin E-Sink (60")',
  'MDRD_B2_ESINK_72': 'Double Basin E-Sink (72")',
  'MDRD_B3_ESINK_72': 'Triple Basin E-Sink (72")',
  'MDRD_B3_ESINK_84': 'Triple Basin E-Sink (84")',
  
  // Legs
  'T2-DL27-KIT': 'Height Adjustable Column Kit (DL27)',
  'T2-DL14-KIT': 'Height Adjustable Column Kit (DL14)',
  'T2-LC1-KIT': 'Height Adjustable Triple Column Kit (LC1)',
  'T2-DL27-FH-KIT': 'Fixed Height Column Kit (DL27)',
  'T2-DL14-FH-KIT': 'Fixed Height Column Kit (DL14)',
  
  // Feet
  'T2-LEVELING-CASTOR-475': 'Lock & Leveling Casters',
  'T2-SEISMIC-FEET': 'S.S Adjustable Seismic Feet',
  
  // Control Boxes
  'T2-CB-BASIC': 'Basic Control Box - Manual Controls',
  'T2-CB-ADVANCED': 'Advanced Control Box - Digital Display',
  'T2-CB-PREMIUM': 'Premium Control Box - Touch Screen',
  
  // Pegboard Types
  'PERF': 'Perforated Pegboard',
  'SOLID': 'Solid Pegboard',
  
  // Basin Types
  'E_SINK': 'Standard E-Sink Basin',
  'E_SINK_DI': 'E-Sink Basin with Deionized Water',
  'E_DRAIN': 'E-Drain Basin for Drainage',
  'T2-BSN-EDR-KIT': 'E-Drain Basin Kit',
  'T2-BSN-ESK-KIT': 'E-Sink Basin Kit',
  'T2-BSN-ESK-DI-KIT': 'E-Sink DI Kit',
  
  // Basin Sizes
  'T2-ADW-BASIN20X20X8': 'Basin 20" x 20" x 8"',
  'T2-ADW-BASIN24X20X8': 'Basin 24" x 20" x 8"',
  'T2-ADW-BASIN24X20X10': 'Basin 24" x 20" x 10"',
  'T2-ADW-BASIN30X20X8': 'Basin 30" x 20" x 8"',
  'T2-ADW-BASIN30X20X10': 'Basin 30" x 20" x 10"',
  
  // Faucet Types
  'T2-OA-STD-FAUCET-WB-KIT': '10" Wrist Blade Faucet Kit',
  'T2-OA-PRE-RINSE-FAUCET-KIT': 'Pre-Rinse Overhead Spray Unit',
  'T2-OA-DI-GOOSENECK-FAUCET-KIT': 'Gooseneck DI Water Faucet',
  
  // Sprayer Types
  'T2-OA-WATERGUN-TURRET-KIT': 'Water Gun & Turret Kit',
  'T2-OA-WATERGUN-ROSETTE-KIT': 'Water Gun & Rosette Kit',
  'T2-OA-AIRGUN-TURRET-KIT': 'Air Gun & Turret Kit',
  'T2-OA-AIRGUN-ROSETTE-KIT': 'Air Gun & Rosette Kit',
  
  // Drawers
  'T2-OA-2D-152012-STACKED': '15x20x12 Stacked Two-Drawer Housing',
  'T2-OA-PO-SHLF-1212': '12"x12" Pull Out Shelf',
  
  // Add-ons
  '706.65': 'P-Trap Disinfection Unit',
  '706.67': 'Basin Light (E-Drain)',
  '706.68': 'Basin Light (E-Sink)',
  
  // Accessories - Bin Rails & Baskets
  'T-OA-BINRAIL-24': 'Bin Rail, 24"',
  'T-OA-BINRAIL-36': 'Bin Rail, 36"',
  'T-OA-BINRAIL-48': 'Bin Rail, 48"',
  'T-OA-BINRAIL-24-KIT': 'Bin Rail Kit, 24"',
  'T-OA-BINRAIL-36-KIT': 'Bin Rail Kit, 36"',
  'T-OA-BINRAIL-48-KIT': 'Bin Rail Kit, 48"',
  'T-OA-PFW1236FM': 'Wire Basket, Slot Bracket Held, Chrome, 36"W X 12"D',
  'T-OA-PWBRACKETSLT': 'Wire Basket Slot Bracket Set, Tilt-Adjust (L & R)',
  'T-OA-PWBRACKET': 'Wire Basket Slot Bracket Set, Right Angle (L& R)',
  'T-OA-PFW1218FM': 'Wire Basket Kit, Slot Bracket Held, Chrome, 18"W X 12"D with Brackets',
  'T-OA-PFW1818FM': 'Wire Basket Kit, Slot Bracket Held, Chrome, 18"W X 18"D with Brackets',
  'T-OA-PFW1218FM-KIT': 'Wire Basket Kit, Slot Bracket Held, Chrome, 18"W X 12"D with Brackets',
  'T-OA-PFW1818FM-KIT': 'Wire Basket Kit, Slot Bracket Held, Chrome, 18"W X 18"D with Brackets',
  
  // Accessories - Shelves
  'T-OA-SSSHELF-1812': 'Stainless Steel Slot Shelf, 18"W X 12"D',
  'T-OA-SSSHELF-1812-BOLT-ON': 'Stainless Steel Shelf, 18"W X 12"D Bolt On (for Solid Pegboard)',
  'T-OA-SSSHELF-3612': 'Stainless Steel Slot Shelf, 36"W X 12"D',
  'T-OA-SSSHELF-3612-BOLT-ON': 'Stainless Steel Slot Shelf, 36"W X 12"D Bolt On (for Solid Pegboard)',
  'T2-OA-SSSHELF-2712-INSTRO': 'Stainless Steel Slot Shelf for Instrosink Overhead Light, 27"W X 12"D',
  'T2-OA-LT-SSSHELF-LRG': 'Stainless Steel Leak Tester Pegboard Shelf, 10"X20", for Large Scope',
  'T2-OA-LT-SSSHELF-SML': 'Stainless Steel Leak Tester Pegboard Shelf, 6"X10", for Small Scope',
  'T2-OA-CUST-SHELF-HA-SML': 'Height Adjustable Bottom Shelf Adder (Lengths Less Then 84")',
  'T2-OA-CUST-SHELF-HA-LRG': 'Height Adjustable Bottom Shelf Adder (Lengths Greater Then 84")',
  'T-OA-RAIL-SHELF-ADDER-SML': 'Rail Shelf Adder (Lengths Less Then 84")',
  'T-OA-RAIL-SHELF-ADDER-LRG': 'Rail Shelf Adder (Lengths Greater Then 84")',
  'T2-OA-PO-SHLF-1212': '12"X12" Pull Out Shelf (Only Compatible with HA Shelf)',
  
  // Accessories - Lighting
  'T-OA-OHL-LED': 'Overhead LED Light for Sinks 6000K 24VDC (Custom Length)',
  
  // Accessories - Storage Bins
  'T-OA-B110505': 'Blue, 10-7/8" X 5-1/2" X 5" Hanging and Stacking Bin',
  'T-OA-B110807': 'Blue, 10-7/8" X 8-1/8" X 7" Hanging and Stacking Bin',
  'T-OA-B111105': 'Blue, 10-7/8" X 11" X 5" Hanging and Stacking Bin',
  'B210-BLUE': 'Blue Plastic Bin, 5.75"X4.125"X3"',
  
  // Accessories - Pegboard Organization
  'T-OA-1BRUSH-ORG-PB': 'Stay-Put Single Hook for Pegboard',
  'T-OA-6BRUSH-ORG-PB': 'Stay-Put 6 Hook Organizer for Pegboard',
  'T-OA-WRK-FLW-PB': 'Pegboard Mount Workflow Indicator (Set of 3)',
  'T-OA-PPRACK-2066': 'Stainless Steel Peel Pouch Rack, 20.5 X 6 X 6',
  
  // Accessories - Dispensers
  'T-OA-PB-SS-1L-SHLF': 'One Litre Double Bottle Holder, Stainless Steel',
  'T-OA-PB-SS-2G-SHLF': 'One Gallon Double Detergent Holder, Stainless Steel',
  'T-OA-PB-SS-1GLOVE': 'Single Glove Dispenser, Stainless Steel, 6"W X 11"H',
  'T-OA-PB-SS-2GLOVE': 'Double Glove Dispenser, Stainless Steel, 10"W X 11"H',
  'T-OA-PB-SS-3GLOVE': 'Triple Glove Dispenser, Stainless Steel, 10"W X 17"H',
  
  // Accessories - Staging Covers
  'T2-OA-SC-2020-SS': 'Sink Staging Cover for 20X20 Basin, Stainless Steel',
  'T2-OA-SC-2420-SS': 'Sink Staging Cover for 24X20 Basin, Stainless Steel',
  'T2-OA-SC-3020-SS': 'Sink Staging Cover for 30X20 Basin, Stainless Steel',
  
  // Accessories - Specialized Equipment
  'T2-AER-TUBEORG': 'AER Tubing Organizer',
  'T-OA-MLIGHT-CCLAMP': 'Magnifying Light, 5" Lens, C-Clamp Mount',
  'T-OA-MAG-LIGHT-PB-BRKT': 'Pegboard Mounting Bracket',
  'T-OA-DIM-MLIGHT-CCLAMP': 'Dimmable Magnifying Light, 5" Lens, C-Clamp Mount',
  'T-OA-TASKLIGHT-PB': 'Gooseneck 27" LED Task Light, 10Deg Focusing Beam, IP65 Head, 24VDC, PB Mount',
  'ACC 14085': 'Magnifier Lens for Task Light Head, 2X Magnification (4 Diopter)',
  
  // Accessories - Monitor & Computer Mounts
  'T-OA-MNT-ARM': 'Wall Monitor Pivot, Single Monitor Mount',
  'T-OA-MNT-ARM-1EXT': 'Wall Monitor Arm, 1 Extension, Single Monitor Mount',
  'T-OA-MNT-ARM-2EXT': 'Wall Monitor Arm, 2 Extension, Single Monitor Mount',
  'T-OA-KB-MOUSE-ARM': 'Wall Keyboard Arm, Keyboard Mount with Slide-Out Mouse Tray',
  'T-OA-2H-CPUSM': 'CPU Holder, Vertical, Small (80-063-200)',
  'T-OA-2H-CPULG': 'CPU Holder, Vertical, Large (97-468-202)',
  'T-OA-2H-CPUUV': 'CPU Holder, Tethered, Universal (80-105-064)',
  'T-OA-MMA-PB': 'Monitor Mount Arm, Single, PB Mount (45-353-026)',
  'T-OA-MMA-DUAL': 'Monitor Mount Adapter, Dual Monitor (97-783)',
  'T-OA-MMA-LTAB': 'Monitor Mount Adapter, Tablet, Locking (45-460-026)',
  'T-OA-MMA-LAP': 'Monitor Mount Adapter, Laptop Tray (50-193-200)',
  'T-OA-MNT-SINGLE-COMBO-PB': 'Combo Arm, Keyboard & Monitor Mount for Pegboard (Black)',
  
  // Accessories - Drawers & Storage
  'T2-OA-2D-152012-STACKED': '15 X 20 X 12 Tall Stacked Two-Drawer Housing'
}

const getPartDescription = (partId: string): string => {
  if (partDescriptions[partId]) {
    return partDescriptions[partId]
  }
  
  // Handle -KIT suffix by trying without it
  if (partId.endsWith('-KIT')) {
    const basePartId = partId.replace('-KIT', '')
    if (partDescriptions[basePartId]) {
      return partDescriptions[basePartId] + ' Kit'
    }
  }
  
  return partId
}

// Helper function to format basin type description (from original)
const getBasinTypeDescription = (basinTypeId: string) => {
  const basinTypeMap: { [key: string]: string } = {
    // User Interface IDs
    'E_DRAIN': 'E-Drain Basin Kit with Overflow Protection',
    'E_SINK': 'E-Sink Basin Kit with Automated Dosing',
    'E_SINK_DI': 'E-Sink Kit for DI Water (No Bottom Fill)',
    // Assembly IDs (from BOM)
    'T2-BSN-EDR-KIT': 'E-Drain Basin Kit with Overflow Protection',
    'T2-BSN-ESK-KIT': 'E-Sink Basin Kit with Automated Dosing',
    'T2-BSN-ESK-DI-KIT': 'E-Sink Kit for DI Water (No Bottom Fill)'
  }
  return basinTypeMap[basinTypeId] || getPartDescription(basinTypeId)
}

// Helper function to format basin size (remove "Basin" wording) (from original)
const getBasinSizeDescription = (basinSizePartNumber: string) => {
  const description = getPartDescription(basinSizePartNumber)
  return description.replace(/^Basin\s+/, '')
}

// Helper function to get drawer/compartment descriptions from part numbers (from original)
const getDrawerDescription = (drawerId: string) => {
  // Map actual drawer/compartment part numbers to descriptions from resource files
  const drawerDescriptionMap: { [key: string]: string } = {
    'T2-OA-2D-152012-STACKED': '15 X 20 X 12 Tall Stacked Two-Drawer Housing With Interior Liner Kit',
    'T2-OA-2D-152012-STACKED-KIT': '15 X 20 X 12 Tall Stacked Two-Drawer Housing With Interior Liner Kit',
    'T2-OA-PO-SHLF-1212': '12"X12" Pull Out Shelf (Only Compatible With HA Shelf)'
  }
  
  const result = drawerDescriptionMap[drawerId] || getPartDescription(drawerId) || drawerId
  return result
}

// Helper function to get basin add-on descriptions from part numbers (from original)
const getBasinAddonDescription = (addonId: string) => {
  const addonDescriptionMap: { [key: string]: string } = {
    '706.65': 'P-Trap Disinfection Drain Unit',
    'T2-OA-MS-1026': 'P-Trap Disinfection Drain Unit',
    '706.67': 'Basin Light (E-Drain Kit)',
    'T2-OA-BASIN-LIGHT-EDR-KIT': 'Basin Light (E-Drain Kit)',
    '706.68': 'Basin Light (E-Sink Kit)', 
    'T2-OA-BASIN-LIGHT-ESK-KIT': 'Basin Light (E-Sink Kit)'
  }
  return addonDescriptionMap[addonId] || getPartDescription(addonId) || addonId
}

const getDrawerDisplayName = (drawerId: string) => {
  return getDrawerDescription(drawerId)
}

const extractColorFromId = (colorId: string) => {
  if (!colorId) return null
  const colorMap: { [key: string]: { name: string; hex: string } } = {
    'T-OA-PB-COLOR-GREEN': { name: 'Green', hex: '#10b981' },
    'T-OA-PB-COLOR-BLUE': { name: 'Blue', hex: '#3b82f6' }, 
    'T-OA-PB-COLOR-RED': { name: 'Red', hex: '#ef4444' },
    'T-OA-PB-COLOR-BLACK': { name: 'Black', hex: '#000000' },
    'T-OA-PB-COLOR-YELLOW': { name: 'Yellow', hex: '#eab308' },
    'T-OA-PB-COLOR-GREY': { name: 'Grey', hex: '#6b7280' },
    'T-OA-PB-COLOR-ORANGE': { name: 'Orange', hex: '#f97316' },
    'T-OA-PB-COLOR-WHITE': { name: 'White', hex: '#ffffff' }
  }
  return colorMap[colorId] || null
}

const formatWorkflowDirection = (direction: string) => {
  if (!direction) return 'Not Specified'
  return direction
    .split('_')
    .map((word, index) => {
      if (word.toLowerCase() === 'to') return 'to'
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

const formatPlacement = (placement: string) => {
  if (!placement) return null
  
  if (placement.includes('BETWEEN_') && placement.match(/\d+_\d+/)) {
    const match = placement.match(/BETWEEN_(\d+)_(\d+)/)
    if (match) {
      return `Between Basins ${match[1]} & ${match[2]}`
    }
  }
  
  if (placement.toUpperCase() === 'CENTER') {
    return 'Center'
  }
  
  return placement
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

const generateDisplayModel = (config: any) => {
  if (!config) return 'N/A'
  
  const basinCount = config.basins?.length || 1
  const length = config.length || 48
  const width = config.width || 30
  
  const lengthStr = length.toString().padStart(2, '0')
  const widthStr = width.toString().padStart(2, '0')
  const dimensions = lengthStr + widthStr
  
  return `T2-${basinCount}B-${dimensions}HA`
}

interface ConfigurationDisplayRedesignedProps extends ConfigurationDisplayProps {
  onEditConfiguration?: (buildNumber: string) => void
  onDeleteConfiguration?: (buildNumber: string) => void
  userRole?: string
  orderId?: string
}

export function ConfigurationDisplayRedesigned({ 
  buildNumbers, 
  configurations, 
  accessories,
  onEditConfiguration,
  onDeleteConfiguration,
  userRole,
  orderId
}: ConfigurationDisplayRedesignedProps) {
  return (
    <div className="space-y-6">
      {buildNumbers.map((buildNumber: string) => {
        const config = configurations[buildNumber]
        const buildAccessories = accessories[buildNumber] || []

        if (!config) return null

        return (
          <div key={buildNumber} className="space-y-6">
            {/* Build Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">Build Configuration</h3>
                <Badge variant="outline" className="text-sm font-medium">
                  {buildNumber}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="text-sm">
                  {generateDisplayModel(config)}
                </Badge>
                {/* Admin Controls */}
                {userRole === 'ADMIN' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => onEditConfiguration?.(buildNumber)}
                        className="cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Configuration
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDeleteConfiguration?.(buildNumber)}
                        className="cursor-pointer text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Configuration
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Main Configuration Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sink Body Configuration */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package2 className="w-4 h-4 text-blue-600" />
                    Sink Body Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Ruler className="w-4 h-4" />
                        Dimensions
                      </div>
                      <span className="font-medium text-base">
                        {config.width}″ W × {config.length}″ L
                      </span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Settings2 className="w-4 h-4" />
                        Legs Type
                      </div>
                      <span className="text-sm font-medium">
                        {getPartDescription(config.legsTypeId || '') || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Box className="w-4 h-4" />
                        Feet Type
                      </div>
                      <span className="text-sm font-medium">
                        {getPartDescription(config.feetTypeId || '') || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Activity className="w-4 h-4" />
                        Workflow
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {formatWorkflowDirection(config.workflowDirection || '')}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pegboard & Storage */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Grid3x3 className="w-4 h-4 text-purple-600" />
                    Pegboard & Storage
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {config.pegboard ? (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Layers className="w-4 h-4" />
                            Type
                          </div>
                          <span className="font-medium text-sm">
                            {getPartDescription(config.pegboardTypeId || '') || 'N/A'}
                          </span>
                        </div>
                        
                        {extractColorFromId(config.pegboardColorId || '') && (
                          <>
                            <Separator />
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Palette className="w-4 h-4" />
                                Color
                              </div>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded-full border" 
                                  style={{ backgroundColor: extractColorFromId(config.pegboardColorId)?.hex }}
                                />
                                <span className="text-sm font-medium">
                                  {extractColorFromId(config.pegboardColorId)?.name}
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                        
                        <Separator />
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Ruler className="w-4 h-4" />
                            Size
                          </div>
                          <span className="text-sm font-medium">
                            {config.length}″ × 36″ H
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4 text-slate-500">
                        <Grid3x3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No Pegboard Configured</p>
                      </div>
                    )}
                    
                    {config.drawersAndCompartments && config.drawersAndCompartments.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                            <Database className="w-4 h-4" />
                            Storage Units ({config.drawersAndCompartments.length})
                          </div>
                          <div className="space-y-1">
                            {config.drawersAndCompartments.map((item: string, idx: number) => (
                              <div key={idx} className="text-xs text-slate-700 pl-6">
                                • {getDrawerDisplayName(item)}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Basin Configurations */}
            {config.basins && config.basins.length > 0 && (
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-cyan-600" />
                    Basin Configurations
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {config.basins.length} Basin{config.basins.length > 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {config.basins.map((basin: any, idx: number) => (
                      <div 
                        key={idx} 
                        className="relative p-3 rounded-lg border-2 border-slate-200 hover:border-blue-300 transition-colors"
                      >
                        <div className="absolute top-2 right-2">
                          <Badge variant="outline" className="text-xs">
                            Basin {idx + 1}
                          </Badge>
                        </div>
                        
                        <div className="space-y-3 pt-6">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Type</p>
                            <p className="font-medium text-sm">
                              {getBasinTypeDescription(basin.basinType)}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Size</p>
                            <p className="font-medium text-sm">
                              {getBasinSizeDescription(basin.basinSizePartNumber)}
                            </p>
                          </div>
                          
                          {(basin.customWidth || basin.customLength || basin.customDepth) && (
                            <div className="pt-2 border-t">
                              <p className="text-xs text-amber-600 mb-1">Custom Dimensions</p>
                              <p className="font-medium text-sm">
                                {basin.customWidth}″W × {basin.customLength}″L × {basin.customDepth}″D
                              </p>
                            </div>
                          )}
                          
                          {basin.addonIds?.length > 0 && (
                            <div className="pt-2 border-t">
                              <p className="text-xs text-slate-500 mb-2">Add-ons</p>
                              <div className="flex flex-wrap gap-1">
                                {basin.addonIds.map((addon: string, addonIdx: number) => (
                                  <Badge key={addonIdx} variant="secondary" className="text-xs">
                                    {getBasinAddonDescription(addon)}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Faucets & Sprayers Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Faucets */}
              {config.faucets && config.faucets.length > 0 && (
                <Card className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-emerald-600" />
                      Faucet Configurations
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {config.faucets.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {config.faucets.map((faucet: any, idx: number) => (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <div className="space-y-1">
                            <p className="font-medium text-sm">
                              {getPartDescription(faucet.faucetTypeId)}
                            </p>
                            {faucet.placement && (
                              <p className="text-xs text-slate-600">
                                Location: {formatPlacement(faucet.placement)}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary">
                            Qty: {faucet.quantity || 1}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sprayers */}
              {config.sprayers && config.sprayers.length > 0 && (
                <Card className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wind className="w-4 h-4 text-orange-600" />
                      Sprayer Configurations
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {config.sprayers.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {config.sprayers.map((sprayer: any, idx: number) => (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <div className="space-y-1">
                            <p className="font-medium text-sm">
                              {getPartDescription(sprayer.sprayerTypeId)}
                            </p>
                            {sprayer.location && (
                              <p className="text-xs text-slate-600">
                                Location: {formatPlacement(sprayer.location)}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary">
                            Qty: {sprayer.quantity || 1}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Accessories */}
            {buildAccessories.length > 0 && (
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-violet-600" />
                    Selected Accessories
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {buildAccessories.length} Item{buildAccessories.length > 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    {buildAccessories.map((accessory: any, idx: number) => {
                      
                      return (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between py-2 px-3 rounded-md bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Zap className="w-4 h-4 text-violet-500 shrink-0" />
                            <span className="text-sm font-medium truncate">
                              {getPartDescription(accessory.name || accessory.assemblyId || accessory.partNumber || 'Unknown Accessory')}
                            </span>
                          </div>
                          <Badge variant="secondary" className="shrink-0 ml-2">
                            Qty: {accessory.quantity}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )
      })}
    </div>
  )
}