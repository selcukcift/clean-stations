"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  ChevronDown, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Package,
  AlertCircle,
  CheckCircle
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
}

interface BOMData {
  items: BOMItem[]
  totalItems: number
  isComplete: boolean
  missingRequiredFields: string[]
}

export function BOMDebugHelper({ orderConfig, isVisible, onToggleVisibility }: BOMDebugHelperProps) {
  const [bomData, setBomData] = useState<BOMData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['sink-body', 'basins']))

  // Auto-refresh BOM when configuration changes
  useEffect(() => {
    if (isVisible && orderConfig) {
      generateBOMPreview()
    }
  }, [orderConfig, isVisible])

  const generateBOMPreview = async () => {
    if (!orderConfig || !orderConfig.sinkModelId) {
      setBomData(null)
      return
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
        
        // Handle new hierarchical BOM structure
        const bomResult = response.data.bom || response.data
        const items = bomResult.flattened || bomResult.hierarchical || bomResult || []
        
        setBomData({
          items: items,
          totalItems: bomResult.totalItems || items.length,
          isComplete: true,
          missingRequiredFields: [],
          hierarchical: bomResult.hierarchical || [],
          topLevelItems: bomResult.topLevelItems || 0
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
  }

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
      'sink-body': [],
      'legs': [],
      'feet': [],
      'basins': [],
      'faucets': [],
      'sprayers': [],
      'accessories': [],
      'other': []
    }

    items.forEach(item => {
      const id = (item.assemblyId || item.partNumber || '').toLowerCase()
      const name = (item.name || item.description || '').toLowerCase()
      const category = item.category || ''
      
      if (category === 'SINK_BODY' || id.includes('body')) {
        categories['sink-body'].push(item)
      } else if (category === 'LEGS' || id.includes('dl27') || id.includes('dl14') || id.includes('lc1') || name.includes('leg')) {
        categories['legs'].push(item)
      } else if (category === 'FEET' || id.includes('castor') || id.includes('seismic') || id.includes('feet') || name.includes('feet') || name.includes('caster')) {
        categories['feet'].push(item)
      } else if (category?.includes('BASIN') || id.includes('basin') || id.includes('adw') || name.includes('basin')) {
        categories['basins'].push(item)
      } else if (category === 'FAUCET' || id.includes('faucet') || name.includes('faucet')) {
        categories['faucets'].push(item)
      } else if (category === 'SPRAYER' || id.includes('sprayer') || id.includes('spray') || name.includes('sprayer')) {
        categories['sprayers'].push(item)
      } else if (id.includes('p-trap') || id.includes('light') || name.includes('trap') || name.includes('light')) {
        categories['accessories'].push(item)
      } else {
        categories['other'].push(item)
      }
    })

    return categories
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

  const categorizedItems = bomData ? categorizeItems(bomData.items) : {}

  return (
    <Card className="fixed top-4 right-4 w-96 max-h-[80vh] z-50 shadow-xl border-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">BOM Debug Helper</CardTitle>
          </div>
          <div className="flex items-center gap-2">
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
        <CardDescription>
          {bomData && (
            <div className="flex items-center gap-4 text-xs">
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
            </div>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <ScrollArea className="h-[60vh]">
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
                  <p className="text-sm font-medium text-yellow-800 mb-1">Missing Required Fields:</p>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    {bomData.missingRequiredFields.map((field, index) => (
                      <li key={index}>• {field}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* BOM Categories */}
              {Object.entries(categorizedItems).map(([categoryId, items]) => {
                if (items.length === 0) return null
                
                const isExpanded = expandedCategories.has(categoryId)
                
                return (
                  <Collapsible key={categoryId} open={isExpanded} onOpenChange={() => toggleCategory(categoryId)}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-gray-50 rounded-md hover:bg-gray-100">
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <span className="font-medium text-sm capitalize">
                          {categoryId.replace('-', ' ')}
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
                        
                        return (
                          <div 
                            key={`${item.id || item.assemblyId || item.partNumber || index}`} 
                            className={`p-2 border rounded-md ${
                              isChild ? 'bg-gray-50 border-gray-200 ml-4' : 'bg-white border-gray-300'
                            }`}
                            style={{ marginLeft: `${indentLevel * 16}px` }}
                          >
                            <div className="flex items-center justify-between">
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
                              <div className="flex items-center gap-2">
                                {item.hasChildren && (
                                  <Badge variant="secondary" className="text-xs">
                                    {item.children?.length || 0} child{(item.children?.length || 0) !== 1 ? 'ren' : ''}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  Qty: {item.quantity || 1}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                )
              })}
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