"use client"

import { useState, useEffect } from "react"
import { 
  Package, 
  Ruler, 
  Droplets, 
  Wrench, 
  Grid3x3, 
  Check,
  ChevronRight,
  Plus,
  Minus,
  AlertCircle,
  Info,
  ShowerHead,
  Waves,
  ChevronLeft,
  Settings
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useOrderCreateStore } from "@/stores/orderCreateStore"
import { nextJsApiClient } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

interface ConfigurationStepProps {
  buildNumbers: string[]
}

export default function ConfigurationStepCompact({ buildNumbers }: ConfigurationStepProps) {
  const { configurations, updateSinkConfiguration } = useOrderCreateStore()
  const [currentBuildIndex, setCurrentBuildIndex] = useState(0)
  const [activeDialog, setActiveDialog] = useState<string | null>(null)
  
  // API States
  const [sinkModels, setSinkModels] = useState<any[]>([])
  const [legsOptions, setLegsOptions] = useState<any[]>([])
  const [feetOptions, setFeetOptions] = useState<any[]>([])
  const [pegboardOptions, setPegboardOptions] = useState<any>({})
  const [basinTypes, setBasinTypes] = useState<any[]>([])
  const [basinSizeOptions, setBasinSizeOptions] = useState<any>({})
  const [basinAddons, setBasinAddons] = useState<any[]>([])
  const [faucetTypes, setFaucetTypes] = useState<any[]>([])
  const [sprayerTypes, setSprayerTypes] = useState<any[]>([])
  const [controlBox, setControlBox] = useState<any>(null)
  
  // Loading states
  const [loading, setLoading] = useState(true)

  const currentBuildNumber = buildNumbers[currentBuildIndex]
  const currentConfig = configurations[currentBuildNumber] || {}

  const updateConfig = (updates: any) => {
    updateSinkConfiguration(currentBuildNumber, updates)
  }

  // Initialize configuration
  useEffect(() => {
    if (currentBuildNumber && !configurations[currentBuildNumber]) {
      updateSinkConfiguration(currentBuildNumber, {
        sinkModelId: '',
        width: null,
        length: null,
        legsTypeId: '',
        feetTypeId: '',
        pegboard: false,
        pegboardTypeId: '',
        pegboardSizePartNumber: '',
        workflowDirection: 'LEFT_TO_RIGHT',
        basins: [],
        faucets: [],
        sprayers: [],
        controlBoxId: null
      })
    }
  }, [currentBuildNumber, configurations, updateSinkConfiguration])

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [
        sinkModelsRes,
        legsRes,
        feetRes,
        basinTypesRes,
        basinAddonsRes,
        faucetTypesRes,
        sprayerTypesRes
      ] = await Promise.all([
        nextJsApiClient.get('/configurator/sink-models'),
        nextJsApiClient.get('/configurator/leg-types'),
        nextJsApiClient.get('/configurator/feet-types'),
        nextJsApiClient.get('/configurator/basin-type-options'),
        nextJsApiClient.get('/configurator/basin-addon-options'),
        nextJsApiClient.get('/configurator/faucet-type-options'),
        nextJsApiClient.get('/configurator/sprayer-type-options')
      ])

      setSinkModels(sinkModelsRes.data.data || [])
      setLegsOptions(legsRes.data.data || [])
      setFeetOptions(feetRes.data.data || [])
      setBasinTypes(basinTypesRes.data.data || [])
      setBasinAddons(basinAddonsRes.data.data || [])
      setFaucetTypes(faucetTypesRes.data.data || [])
      setSprayerTypes(sprayerTypesRes.data.data || [])
    } catch (error) {
      console.error('Error loading configuration data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSelectedModel = () => {
    return sinkModels.find(model => model.id === currentConfig.sinkModelId)
  }

  const getMaxBasins = () => {
    const model = getSelectedModel()
    return model ? model.basinCount : 1
  }

  const getPlacementOptions = (currentFaucetIndex: number) => {
    const basinCount = currentConfig.basins?.length || 0
    const otherFaucets = currentConfig.faucets?.filter((_: any, i: number) => i !== currentFaucetIndex) || []
    const occupiedPlacements = otherFaucets.map((f: any) => f.placement)
    
    const options = []
    options.push({ value: 'CENTER', label: 'Center' })
    
    if (basinCount >= 2) {
      const between12 = 'BETWEEN_1_2'
      if (!occupiedPlacements.includes(between12)) {
        options.push({ value: between12, label: 'Between Basin 1-2' })
      }
    }
    
    if (basinCount >= 3) {
      const between23 = 'BETWEEN_2_3'
      if (!occupiedPlacements.includes(between23)) {
        options.push({ value: between23, label: 'Between Basin 2-3' })
      }
    }
    
    if (!occupiedPlacements.includes('LEFT')) {
      options.push({ value: 'LEFT', label: 'Left Side' })
    }
    if (!occupiedPlacements.includes('RIGHT')) {
      options.push({ value: 'RIGHT', label: 'Right Side' })
    }
    
    return options
  }

  const isStepComplete = (step: string) => {
    switch (step) {
      case 'body':
        return currentConfig.sinkModelId && currentConfig.width && currentConfig.length && 
               currentConfig.legsTypeId && currentConfig.feetTypeId
      case 'basins':
        return currentConfig.basins?.length > 0 && 
               currentConfig.basins.every((b: any) => b.basinType && b.basinSizePartNumber)
      default:
        return false
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading configuration options...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between bg-slate-50 rounded-lg p-4">
        <div>
          <h3 className="text-lg font-semibold">Configure {currentBuildNumber}</h3>
          <p className="text-sm text-slate-600">Sink {currentBuildIndex + 1} of {buildNumbers.length}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentBuildIndex(Math.max(0, currentBuildIndex - 1))}
            disabled={currentBuildIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentBuildIndex(Math.min(buildNumbers.length - 1, currentBuildIndex + 1))}
            disabled={currentBuildIndex === buildNumbers.length - 1}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Sink Body - Takes 2 columns on large screens */}
        <Card className={cn(
          "lg:col-span-2 cursor-pointer hover:shadow-lg transition-all",
          isStepComplete('body') && "ring-2 ring-green-500"
        )}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-slate-600" />
                <CardTitle className="text-base">Sink Body</CardTitle>
              </div>
              {isStepComplete('body') && <Check className="w-4 h-4 text-green-600" />}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Model</Label>
                <Select 
                  value={currentConfig.sinkModelId} 
                  onValueChange={(value) => updateConfig({ sinkModelId: value })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {sinkModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Width"</Label>
                  <Input
                    type="number"
                    value={currentConfig.width || ''}
                    onChange={(e) => updateConfig({ width: parseInt(e.target.value) || null })}
                    placeholder="48"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Length"</Label>
                  <Input
                    type="number"
                    value={currentConfig.length || ''}
                    onChange={(e) => updateConfig({ length: parseInt(e.target.value) || null })}
                    placeholder="60"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Legs</Label>
                <Select 
                  value={currentConfig.legsTypeId} 
                  onValueChange={(value) => updateConfig({ legsTypeId: value })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {legsOptions.map((leg) => (
                      <SelectItem key={leg.assemblyId} value={leg.assemblyId}>
                        {leg.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs">Feet</Label>
                <Select 
                  value={currentConfig.feetTypeId} 
                  onValueChange={(value) => updateConfig({ feetTypeId: value })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {feetOptions.map((feet) => (
                      <SelectItem key={feet.assemblyId} value={feet.assemblyId}>
                        {feet.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basin Configuration - Compact View */}
        <Card 
          className={cn(
            "cursor-pointer hover:shadow-lg transition-all",
            isStepComplete('basins') && "ring-2 ring-green-500"
          )}
          onClick={() => setActiveDialog('basins')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-slate-600" />
                <CardTitle className="text-base">Basins</CardTitle>
              </div>
              {isStepComplete('basins') && <Check className="w-4 h-4 text-green-600" />}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Configured</span>
                <Badge variant="secondary">{currentConfig.basins?.length || 0} / {getMaxBasins()}</Badge>
              </div>
              {currentConfig.basins?.map((basin: any, i: number) => (
                <div key={i} className="text-xs bg-slate-50 rounded px-2 py-1">
                  Basin {i + 1}: {basin.basinType || 'Not set'}
                </div>
              ))}
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveDialog('basins')
                }}
              >
                <Settings className="w-3 h-3 mr-2" />
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Faucets - Compact Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all"
          onClick={() => setActiveDialog('faucets')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShowerHead className="w-5 h-5 text-slate-600" />
                <CardTitle className="text-base">Faucets</CardTitle>
              </div>
              {currentConfig.faucets?.length > 0 && <Badge variant="secondary">{currentConfig.faucets.length}</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-3">
              {currentConfig.faucets?.length || 0} configured
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full"
              onClick={(e) => {
                e.stopPropagation()
                setActiveDialog('faucets')
              }}
            >
              <Settings className="w-3 h-3 mr-2" />
              Configure
            </Button>
          </CardContent>
        </Card>

        {/* Sprayers - Compact Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all"
          onClick={() => setActiveDialog('sprayers')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Waves className="w-5 h-5 text-slate-600" />
                <CardTitle className="text-base">Sprayers</CardTitle>
              </div>
              {currentConfig.sprayers?.length > 0 && <Badge variant="secondary">{currentConfig.sprayers.length}</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-3">
              {currentConfig.sprayers?.length || 0} configured
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full"
              onClick={(e) => {
                e.stopPropagation()
                setActiveDialog('sprayers')
              }}
            >
              <Settings className="w-3 h-3 mr-2" />
              Configure
            </Button>
          </CardContent>
        </Card>

        {/* Pegboard - Compact Card */}
        <Card className="cursor-pointer hover:shadow-lg transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid3x3 className="w-5 h-5 text-slate-600" />
                <CardTitle className="text-base">Pegboard</CardTitle>
              </div>
              {currentConfig.pegboard && <Check className="w-4 h-4 text-green-600" />}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-normal">Enable Pegboard</Label>
              <Switch 
                checked={currentConfig.pegboard || false}
                onCheckedChange={(checked) => updateConfig({ pegboard: checked })}
              />
            </div>
            {currentConfig.pegboard && (
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                onClick={() => setActiveDialog('pegboard')}
              >
                <Settings className="w-3 h-3 mr-2" />
                Configure
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Summary */}
      <Card className="bg-slate-50">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {isStepComplete('body') ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                )}
                <span className="text-sm">Body Configuration</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                {isStepComplete('basins') ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                )}
                <span className="text-sm">Basin Configuration</span>
              </div>
            </div>
            <div className="text-sm text-slate-600">
              Optional: {currentConfig.faucets?.length || 0} faucets, {currentConfig.sprayers?.length || 0} sprayers
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basin Configuration Dialog */}
      <Dialog open={activeDialog === 'basins'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Basin Configuration</DialogTitle>
            <DialogDescription>
              Configure up to {getMaxBasins()} basins for this sink
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <Label>Basins</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const currentBasins = currentConfig.basins || []
                  if (currentBasins.length < getMaxBasins()) {
                    updateConfig({ 
                      basins: [...currentBasins, {
                        id: `basin-${Date.now()}`,
                        basinType: '',
                        basinSizePartNumber: null,
                        addonIds: []
                      }]
                    })
                  }
                }}
                disabled={!getSelectedModel() || (currentConfig.basins?.length || 0) >= getMaxBasins()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Basin
              </Button>
            </div>

            {currentConfig.basins?.map((basin: any, index: number) => (
              <Card key={basin.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Basin {index + 1}</h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const updatedBasins = currentConfig.basins.filter((_: any, i: number) => i !== index)
                        updateConfig({ basins: updatedBasins })
                      }}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Type</Label>
                      <Select 
                        value={basin.basinType} 
                        onValueChange={(value) => {
                          const updatedBasins = [...currentConfig.basins]
                          updatedBasins[index] = { ...basin, basinType: value }
                          updateConfig({ basins: updatedBasins })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {basinTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Size</Label>
                      <Select 
                        value={basin.basinSizePartNumber || ''} 
                        onValueChange={(value) => {
                          const updatedBasins = [...currentConfig.basins]
                          updatedBasins[index] = { ...basin, basinSizePartNumber: value }
                          updateConfig({ basins: updatedBasins })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {basinSizeOptions?.standardSizes?.map((size: any) => (
                            <SelectItem key={size.assemblyId} value={size.assemblyId}>
                              {size.dimensions}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Faucets Configuration Dialog */}
      <Dialog open={activeDialog === 'faucets'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Faucet Configuration</DialogTitle>
            <DialogDescription>
              Configure faucets for your sink (Maximum: {getMaxBasins()})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <Label>Faucets</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const currentFaucets = currentConfig.faucets || []
                  if (currentFaucets.length < getMaxBasins()) {
                    updateConfig({ 
                      faucets: [...currentFaucets, {
                        id: `faucet-${Date.now()}`,
                        faucetTypeId: '',
                        placement: 'CENTER'
                      }]
                    })
                  }
                }}
                disabled={!getSelectedModel() || (currentConfig.faucets?.length || 0) >= getMaxBasins()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Faucet
              </Button>
            </div>

            {currentConfig.faucets?.map((faucet: any, index: number) => (
              <Card key={faucet.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Faucet {index + 1}</h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const updatedFaucets = currentConfig.faucets.filter((_: any, i: number) => i !== index)
                        updateConfig({ faucets: updatedFaucets })
                      }}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Type</Label>
                      <Select 
                        value={faucet.faucetTypeId} 
                        onValueChange={(value) => {
                          const updatedFaucets = [...currentConfig.faucets]
                          updatedFaucets[index] = { ...faucet, faucetTypeId: value }
                          updateConfig({ faucets: updatedFaucets })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {faucetTypes.map((type) => (
                            <SelectItem key={type.assemblyId} value={type.assemblyId}>
                              {type.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Placement</Label>
                      <Select 
                        value={faucet.placement} 
                        onValueChange={(value) => {
                          const updatedFaucets = [...currentConfig.faucets]
                          updatedFaucets[index] = { ...faucet, placement: value }
                          updateConfig({ faucets: updatedFaucets })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select placement" />
                        </SelectTrigger>
                        <SelectContent>
                          {getPlacementOptions(index).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}