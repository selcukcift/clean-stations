"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { 
  ChevronDown, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Package,
  AlertCircle,
  CheckCircle,
  Download,
  Search,
  DollarSign,
  TreePine,
  List
} from "lucide-react"
import { nextJsApiClient } from "@/lib/api"

interface BOMDebugHelperProps {
  orderConfig: any
  isVisible: boolean
  onToggleVisibility: () => void
}

interface BOMItem {
  assemblyId: string
  name: string
  description?: string
  quantity: number
  category?: string
  subItems?: BOMItem[]
  price?: number
  unitPrice?: number
  partNumber?: string
  id?: string
  level?: number
  indentLevel?: number
  isChild?: boolean
  isPart?: boolean
  hasChildren?: boolean
  children?: BOMItem[]
}

interface BOMData {
  items: BOMItem[]
  totalItems: number
  isComplete: boolean
  missingRequiredFields: string[]
  hierarchical?: BOMItem[]
  topLevelItems?: number
  totalPrice?: number
}

export function BOMDebugHelper({ orderConfig, isVisible, onToggleVisibility }: BOMDebugHelperProps) {
  const [bomData, setBomData] = useState<BOMData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['sink-body', 'basin']))
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'categorized' | 'hierarchical'>('categorized')
  const [showPrices, setShowPrices] = useState(false)

  const generateBOMPreview = useCallback(async () => {
    if (!orderConfig || !orderConfig.sinkModelId) {
      setBomData(null)
      return
    }

    // Check for required fields based on sink model
    const missingFields = []
    if (!orderConfig.width && !orderConfig.length) {
      missingFields.push('Sink dimensions (width/length)')
    }
    
    // If required fields are missing, show them but don't prevent BOM generation
    if (missingFields.length > 0) {
      setBomData({
        items: [],
        totalItems: 0,
        isComplete: false,
        missingRequiredFields: missingFields,
        hierarchical: [],
        topLevelItems: 0
      })
      // Don't return - let it try to generate partial BOM
    }

    setLoading(true)
    setError(null)
    
    try {
      // Create minimal required data structure for BOM preview
      const configData: any = {
        sinkModelId: orderConfig.sinkModelId
      }

      // Add optional fields only if they exist
      if (orderConfig.width) configData.width = orderConfig.width
      if (orderConfig.length) configData.length = orderConfig.length
      if (orderConfig.legsTypeId) configData.legsTypeId = orderConfig.legsTypeId
      if (orderConfig.feetTypeId) configData.feetTypeId = orderConfig.feetTypeId
      if (orderConfig.pegboard) {
        configData.pegboard = orderConfig.pegboard
        if (orderConfig.pegboardTypeId) configData.pegboardTypeId = orderConfig.pegboardTypeId
        if (orderConfig.pegboardSizePartNumber) configData.pegboardSizePartNumber = orderConfig.pegboardSizePartNumber
      }
      if (orderConfig.workflowDirection) configData.workflowDirection = orderConfig.workflowDirection

      // Add basins if configured
      if (orderConfig.basins && orderConfig.basins.length > 0) {
        configData.basins = orderConfig.basins.map((basin: any) => {
          const basinData: any = {}
          if (basin.basinType) basinData.basinTypeId = basin.basinType
          if (basin.basinSizePartNumber) basinData.basinSizePartNumber = basin.basinSizePartNumber
          if (basin.addonIds && basin.addonIds.length > 0) basinData.addonIds = basin.addonIds
          return basinData
        }).filter((basin: any) => basin.basinTypeId || basin.basinSizePartNumber || (basin.addonIds && basin.addonIds.length > 0))
      }

      // Add faucets if configured
      if (orderConfig.faucets && orderConfig.faucets.length > 0) {
        configData.faucets = orderConfig.faucets.map((faucet: any) => ({
          faucetTypeId: faucet.faucetType,
          quantity: 1
        })).filter((faucet: any) => faucet.faucetTypeId)
      }

      // Add sprayers if configured
      if (orderConfig.sprayers && orderConfig.sprayers.length > 0) {
        configData.sprayers = orderConfig.sprayers.map((sprayer: any) => ({
          id: sprayer.id,
          sprayerTypeId: sprayer.sprayerType,
          location: sprayer.location
        })).filter((sprayer: any) => sprayer.sprayerTypeId)
      }

      if (orderConfig.controlBoxId) configData.controlBoxId = orderConfig.controlBoxId

      const previewData = {
        customerInfo: {
          poNumber: "DEBUG-PREVIEW",
          customerName: "Debug Customer",
          salesPerson: "Debug User",
          wantDate: new Date().toISOString(),
          language: "EN"
        },
        sinkSelection: {
          sinkModelId: orderConfig.sinkModelId,
          quantity: 1,
          buildNumbers: ["DEBUG-001"]
        },
        configurations: {
          "DEBUG-001": configData
        },
        accessories: {}
      }

      console.log('Sending BOM preview data:', JSON.stringify(previewData, null, 2))
      
      const axiosResponse = await nextJsApiClient.post('/orders/preview-bom', previewData)
      const response = axiosResponse.data // Extract the actual response data from axios

      console.log('Axios Response:', axiosResponse)
      console.log('BOM API Response:', response)
      console.log('Response type:', typeof response)
      console.log('Response keys:', Object.keys(response || {}))

      if (!response) {
        setError('No response received from BOM API')
        return
      }

      if (response.success) {
        console.log('BOM data received:', response.data)
        
        // Handle new hierarchical BOM structure - bomResult is an object with hierarchical and flattened arrays
        const bomResult = response.data.bom || response.data
        const items = bomResult.flattened || []
        const hierarchicalItems = bomResult.hierarchical || []
        
        // Check for missing required fields based on what was generated
        const currentMissingFields = []
        if (!orderConfig.width && !orderConfig.length) {
          currentMissingFields.push('Sink dimensions (width/length)')
        }
        
        // Check if we got a sink body in the BOM
        const hasSinkBody = items.some((item: BOMItem) => item.category === 'SINK_BODY')
        if (!hasSinkBody && currentMissingFields.includes('Sink dimensions (width/length)')) {
          console.warn('No sink body generated due to missing dimensions')
        }
        
        // Calculate total price if prices are available
        const totalPrice = items.reduce((sum: number, item: BOMItem) => {
          const itemPrice = item.price || (item.unitPrice && item.quantity ? item.unitPrice * item.quantity : 0)
          return sum + itemPrice
        }, 0)

        setBomData({
          items: items,
          totalItems: bomResult.totalItems || items.length,
          isComplete: currentMissingFields.length === 0,
          missingRequiredFields: currentMissingFields,
          hierarchical: hierarchicalItems,
          topLevelItems: bomResult.topLevelItems || 0,
          totalPrice: totalPrice > 0 ? totalPrice : undefined
        })
      } else {
        console.error('BOM generation failed:', response)
        const errorMsg = response.error || response.message || response.errors || 'Failed to generate BOM preview'
        setError(Array.isArray(errorMsg) ? errorMsg.map(e => e.message || e).join(', ') : errorMsg)
      }
    } catch (err) {
      console.error('BOM preview error:', err)
      console.error('Error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      })
      setError('Failed to generate BOM preview: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [orderConfig])

  // Auto-refresh BOM when configuration changes
  useEffect(() => {
    if (isVisible && orderConfig) {
      generateBOMPreview()
    }
  }, [orderConfig, isVisible, generateBOMPreview])

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const categorizeItems = (items: any[]) => {
    const categories: Record<string, any[]> = {
      'system': [],
      'sink-body': [],
      'basin': [],
      'faucet-sprayer': [],
      'control-box': [],
      'accessories': [],
      'service-parts': [],
      'other': []
    }

    items.forEach(item => {
      const id = (item.assemblyId || item.partNumber || '').toLowerCase()
      const name = (item.name || item.description || '').toLowerCase()
      const category = item.category || ''
      
      // Use configuration-based categorization
      if (category === 'SYSTEM' || name.includes('manual')) {
        categories['system'].push(item)
      } else if (
        // Sink Body Configuration - includes legs, feet, pegboard, overhead lights
        category === 'SINK_BODY' || 
        // Sink body assemblies (709.82-709.84)
        id.includes('t2-body-') ||
        // Legs - Height Adjustable (711.97-711.99)
        id.includes('t2-dl27-kit') || id.includes('t2-dl14-kit') || id.includes('t2-lc1-kit') ||
        // Legs - Fixed Height (711.100-711.101) 
        id.includes('t2-dl27-fh-kit') || id.includes('t2-dl14-fh-kit') ||
        // Electromechanical columns/lifters
        id === 't2-lc1-kit' || id === 't2-dl27-kit' || id === 't2-dl14-kit' ||
        // Feet (711.95-711.96)
        id.includes('t2-leveling-castor') || id.includes('t2-seismic-feet') ||
        // Pegboard components (715.120-715.127, 716.128, 716.130-716.131)
        id.includes('t2-adw-pb-') || id.includes('t2-ohl-mdrd-kit') || 
        id.includes('t2-adw-pb-perf-kit') || id.includes('t2-adw-pb-solid-kit') ||
        // Pegboard color options (708.77)
        id.includes('t-oa-pb-color') || id.includes('pb-color') ||
        // Overhead LED light for pegboard
        id.includes('t-oa-ohl-led') ||
        // Explicit pegboard part numbers to ensure they stay in sink body
        id === 't2-adw-pb-3436' || id === 't2-adw-pb-4836' || id === 't2-adw-pb-6036' ||
        id === 't2-adw-pb-7236' || id === 't2-adw-pb-8436' || id === 't2-adw-pb-9636' ||
        id === 't2-adw-pb-10836' || id === 't2-adw-pb-12036' || id === 't2-ohl-mdrd-kit' ||
        id === 't2-adw-pb-perf-kit' || id === 't2-adw-pb-solid-kit' || id === 't-oa-ohl-led' ||
        // Power bar kit (part of sink electrical system)
        id.includes('t2-pwrbar-kit') ||
        // Other sink structure components
        id.includes('t2-adw-') && (id.includes('frame') || id.includes('instro')) ||
        name.includes('sink body') || name.includes('frame') || name.includes('lifter') || 
        name.includes('leg') || name.includes('pegboard') || name.includes('overhead light') ||
        name.includes('power bar')
      ) {
        categories['sink-body'].push(item)
      } else if (
        // Basin Configuration (722.*)
        category === 'BASIN' || category?.includes('BASIN') ||
        // Basin types (713.107-713.109)
        id.includes('t2-bsn-edr-kit') || id.includes('t2-bsn-esk-kit') || id.includes('t2-bsn-esk-di-kit') ||
        // Basin sizes (712.102-712.106)
        id.includes('t2-adw-basin') ||
        // Basin components
        id.includes('t2-drain-') || id.includes('t2-valve-') || id.includes('t2-bottom-fill') ||
        id.includes('t2-edr-temp') || id.includes('t2-esk-temp') || id.includes('t2-emergstop') ||
        name.includes('basin') || name.includes('drain') || name.includes('valve plate')
      ) {
        categories['basin'].push(item)
      } else if (
        // Faucet & Sprayer Configuration
        // Faucet kits (706.58-706.60)
        id.includes('t2-oa-std-faucet') || id.includes('t2-oa-pre-rinse') || id.includes('t2-oa-di-gooseneck') ||
        // Sprayer kits (706.61-706.64)
        id.includes('t2-oa-watergun') || id.includes('t2-oa-airgun') ||
        name.includes('faucet kit') || name.includes('sprayer') || name.includes('gun kit')
      ) {
        categories['faucet-sprayer'].push(item)
      } else if (
        // Control Box (718.* - 719.176-719.184)
        category === 'CONTROL_BOX' || 
        id.includes('t2-ctrl-') ||
        name.includes('control box')
      ) {
        categories['control-box'].push(item)
      } else if (
        // Accessories (720.* - various T-OA and T2-OA items not covered above)
        category === 'ACCESSORY' ||
        (id.includes('t-oa-') || id.includes('t2-oa-')) && 
        !id.includes('faucet') && !id.includes('gun') && !id.includes('pb-') && !id.includes('ohl-led') &&
        // Exclude pegboard items from accessories
        !id.includes('t2-adw-pb-') && !id.includes('t2-ohl-mdrd-kit') && 
        !id.includes('t2-adw-pb-perf-kit') && !id.includes('t2-adw-pb-solid-kit') &&
        (name.includes('basket') || name.includes('shelf') || name.includes('light') || 
         name.includes('mount') || name.includes('holder') || name.includes('organizer') ||
         name.includes('bin') || name.includes('drawer'))
      ) {
        categories['accessories'].push(item)
      } else if (
        // Service Parts (719.* - boards, sensors, cables, etc.)
        category === 'SERVICE_PART' || category?.includes('SERVICE') ||
        id.match(/^\d+$/) || // Numeric IDs are typically service parts
        name.includes('cable') || name.includes('sensor') || name.includes('board') ||
        name.includes('pump') || name.includes('upgrade') || 
        (name.includes('kit') && !name.includes('faucet') && !name.includes('gun') && 
         // Exclude leg kits
         !id.includes('t2-lc1-kit') && !id.includes('t2-dl27-kit') && !id.includes('t2-dl14-kit') &&
         // Exclude pegboard kits
         !id.includes('t2-adw-pb-') && !id.includes('t2-ohl-mdrd-kit') && 
         !id.includes('t2-adw-pb-perf-kit') && !id.includes('t2-adw-pb-solid-kit') &&
         // Exclude power bar kit
         !id.includes('t2-pwrbar-kit'))
      ) {
        categories['service-parts'].push(item)
      } else {
        categories['other'].push(item)
      }
    })

    return categories
  }

  const getCategoryDisplayName = (categoryId: string) => {
    const displayNames: Record<string, string> = {
      'system': '📋 System Items',
      'sink-body': '🏗️ Sink Body (Legs, Feet, Pegboard)',
      'basin': '🪣 Basin Configuration',
      'faucet-sprayer': '🚿 Faucet & Sprayer',
      'control-box': '🎛️ Control Box',
      'accessories': '🔧 Accessories',
      'service-parts': '⚙️ Service Parts',
      'other': '📦 Other Items'
    }
    return displayNames[categoryId] || categoryId.replace('-', ' ').toUpperCase()
  }

  const getStatusColor = () => {
    if (!bomData) return 'gray'
    if (bomData.missingRequiredFields.length > 0) return 'yellow'
    return bomData.isComplete ? 'green' : 'yellow'
  }

  const getStatusIcon = () => {
    if (!bomData) return <Package className="w-4 h-4" />
    if (bomData.missingRequiredFields.length > 0) return <AlertCircle className="w-4 h-4" />
    return bomData.isComplete ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />
  }

  const exportBOM = () => {
    if (!bomData) return

    const exportData = {
      timestamp: new Date().toISOString(),
      configuration: orderConfig,
      bom: {
        totalItems: bomData.totalItems,
        totalPrice: bomData.totalPrice,
        items: bomData.items.map(item => ({
          id: item.id || item.assemblyId || item.partNumber,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          category: item.category,
          unitPrice: item.unitPrice,
          totalPrice: item.price || (item.unitPrice && item.quantity ? item.unitPrice * item.quantity : 0)
        }))
      }
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bom-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filteredItems = (items: BOMItem[]) => {
    if (!searchTerm) return items
    
    return items.filter(item => {
      const searchLower = searchTerm.toLowerCase()
      const idMatch = (item.id || item.assemblyId || item.partNumber || '').toLowerCase().includes(searchLower)
      const nameMatch = (item.name || '').toLowerCase().includes(searchLower)
      const descMatch = (item.description || '').toLowerCase().includes(searchLower)
      return idMatch || nameMatch || descMatch
    })
  }

  const renderHierarchicalItems = (items: BOMItem[], level = 0): React.ReactNode => {
    return items.map((item, index) => {
      const itemPrice = item.price || (item.unitPrice && item.quantity ? item.unitPrice * item.quantity : 0)
      const hasMatch = !searchTerm || filteredItems([item]).length > 0
      
      if (!hasMatch && (!item.children || item.children.length === 0)) {
        return null
      }

      return (
        <div key={`${item.id || item.assemblyId || item.partNumber || index}-${level}`}>
          {hasMatch && (
            <div 
              className={`p-2 border rounded-md mb-1 ${
                level > 0 ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
              }`}
              style={{ marginLeft: `${level * 20}px` }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {level > 0 && (
                      <span className="text-xs text-gray-400">└─</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${level === 0 ? 'font-medium' : 'font-normal'}`}>
                        {item.id || item.assemblyId || item.partNumber || 'Unknown ID'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {item.name || item.description || 'No description'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className="text-xs">
                    Qty: {item.quantity || 1}
                  </Badge>
                  {showPrices && itemPrice > 0 && (
                    <div className="text-xs text-green-600 font-medium">
                      ${itemPrice.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {item.children && item.children.length > 0 && (
            <div className="mt-1">
              {renderHierarchicalItems(item.children, level + 1)}
            </div>
          )}
        </div>
      )
    })
  }

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleVisibility}
        className="fixed bottom-4 right-4 z-50 shadow-lg"
      >
        <Eye className="w-4 h-4 mr-2" />
        Show BOM Debug
      </Button>
    )
  }

  const categorizedItems = bomData ? categorizeItems(filteredItems(bomData.items)) : {}

  return (
    <Card className="fixed top-4 right-4 w-[450px] max-h-[90vh] z-50 shadow-xl border-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">BOM Debug Helper</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {bomData && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPrices(!showPrices)}
                  title="Toggle price display"
                >
                  <DollarSign className={`w-4 h-4 ${showPrices ? 'text-green-600' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'categorized' ? 'hierarchical' : 'categorized')}
                  title="Toggle view mode"
                >
                  {viewMode === 'categorized' ? <TreePine className="w-4 h-4" /> : <List className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportBOM}
                  title="Export BOM"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={generateBOMPreview}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleVisibility}
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {bomData && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2 text-xs">
              <Badge variant={getStatusColor() === 'green' ? 'default' : 'secondary'}>
                {bomData.totalItems} total items
              </Badge>
              {bomData.topLevelItems > 0 && (
                <Badge variant="outline">
                  {bomData.topLevelItems} assemblies
                </Badge>
              )}
              {bomData.missingRequiredFields.length > 0 && (
                <Badge variant="destructive">
                  {bomData.missingRequiredFields.length} missing
                </Badge>
              )}
              {showPrices && bomData.totalPrice && (
                <Badge variant="secondary" className="bg-green-100">
                  Total: ${bomData.totalPrice.toFixed(2)}
                </Badge>
              )}
            </div>
            {searchTerm && (
              <div className="text-xs text-muted-foreground">
                Filtering: {filteredItems(bomData.items).length} matches
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        {bomData && (
          <div className="relative mb-3">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search BOM items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        )}
        
        <ScrollArea className="h-[65vh]">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Generating BOM...</span>
            </div>
          )}

          {bomData && !loading && (
            <div className="space-y-2">
              {/* Missing Fields Warning */}
              {bomData.missingRequiredFields.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 mb-1">Incomplete BOM - Missing:</p>
                      <ul className="text-xs text-yellow-700 space-y-1">
                        {bomData.missingRequiredFields.map((field, index) => (
                          <li key={index}>• {field}</li>
                        ))}
                      </ul>
                      <p className="text-xs text-yellow-600 mt-2">
                        Enter sink dimensions to generate complete BOM including sink body assembly.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* View Mode Toggle */}
              {viewMode === 'hierarchical' && bomData.hierarchical && bomData.hierarchical.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Hierarchical View
                  </div>
                  {renderHierarchicalItems(bomData.hierarchical)}
                </div>
              ) : (
                /* BOM Categories */
                Object.entries(categorizedItems).map(([categoryId, items]) => {
                if (items.length === 0) return null
                
                const isExpanded = expandedCategories.has(categoryId)
                
                return (
                  <Collapsible key={categoryId} open={isExpanded} onOpenChange={() => toggleCategory(categoryId)}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-gray-50 rounded-md hover:bg-gray-100">
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <span className="font-medium text-sm">
                          {getCategoryDisplayName(categoryId)}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {items.length}
                        </Badge>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="ml-4 mt-1 space-y-1">
                      {items.map((item, index) => {
                        const indentLevel = item.indentLevel || item.level || 0
                        const isChild = item.isChild || indentLevel > 0
                        const isPart = item.isPart || item.category === 'PART'
                        
                        const itemPrice = item.price || (item.unitPrice && item.quantity ? item.unitPrice * item.quantity : 0)
                        
                        return (
                          <div 
                            key={`${item.id || item.assemblyId || item.partNumber || index}`} 
                            className={`p-2 border rounded-md ${
                              isChild ? 'bg-gray-50 border-gray-200 ml-4' : 'bg-white border-gray-300'
                            }`}
                            style={{ marginLeft: `${indentLevel * 16}px` }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  {isChild && (
                                    <span className="text-xs text-gray-400">
                                      {'└─'.repeat(Math.min(indentLevel, 3))}
                                    </span>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm truncate ${isChild ? 'font-normal' : 'font-medium'}`}>
                                      {item.id || item.assemblyId || item.partNumber || 'Unknown ID'}
                                    </p>
                                    {item.partNumber && item.partNumber !== item.id && (
                                      <p className="text-xs text-green-600 truncate">
                                        Part: {item.partNumber}
                                      </p>
                                    )}
                                    <p className="text-xs text-gray-500 truncate">
                                      {item.name || item.description || 'No description'}
                                    </p>
                                    {item.category && (
                                      <p className="text-xs text-blue-600 truncate">
                                        {isPart ? 'Part' : 'Assembly'} • {item.category}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-2">
                                  {item.hasChildren && (
                                    <Badge variant="secondary" className="text-xs">
                                      {item.children?.length || 0} items
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    Qty: {item.quantity || 1}
                                  </Badge>
                                </div>
                                {showPrices && itemPrice > 0 && (
                                  <div className="text-xs text-green-600 font-medium">
                                    ${itemPrice.toFixed(2)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                )
              })
              )}
            </div>
          )}

          {!bomData && !loading && !error && (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Configure sink to see BOM preview</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}