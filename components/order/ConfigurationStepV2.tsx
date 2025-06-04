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
  Waves
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface ConfigurationStepProps {
  buildNumbers: string[]
}

// Section configuration
const SECTIONS = [
  { id: 'sink-body', label: 'Sink Body', icon: Package, required: true },
  { id: 'basins', label: 'Basins', icon: Droplets, required: true },
  { id: 'faucets', label: 'Faucets', icon: ShowerHead, required: false },
  { id: 'sprayers', label: 'Sprayers', icon: Waves, required: false },
  { id: 'pegboard', label: 'Pegboard', icon: Grid3x3, required: false },
]

export default function ConfigurationStepV2({ buildNumbers }: ConfigurationStepProps) {
  const { configurations, updateSinkConfiguration } = useOrderCreateStore()
  const [currentBuildIndex, setCurrentBuildIndex] = useState(0)
  const [activeSection, setActiveSection] = useState('sink-body')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['sink-body']))
  
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
  const [pegboardLoading, setPegboardLoading] = useState(false)
  const [controlBoxLoading, setControlBoxLoading] = useState(false)

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

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
    setActiveSection(sectionId)
  }

  const getSectionStatus = (sectionId: string) => {
    switch (sectionId) {
      case 'sink-body':
        return currentConfig.sinkModelId && currentConfig.width && currentConfig.length ? 'complete' : 'incomplete'
      case 'basins':
        return currentConfig.basins?.length > 0 && 
               currentConfig.basins.every((b: any) => b.basinType && b.basinSizePartNumber) ? 'complete' : 'incomplete'
      case 'faucets':
        return currentConfig.faucets?.length > 0 ? 'complete' : 'optional'
      case 'sprayers':
        return currentConfig.sprayers?.length > 0 ? 'complete' : 'optional'
      case 'pegboard':
        return currentConfig.pegboard ? 'complete' : 'optional'
      default:
        return 'incomplete'
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
    <div className="h-[calc(100vh-16rem)] flex gap-4">
      {/* Sidebar */}
      <div className="w-80 border-r bg-slate-50/50">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-lg">Configure {currentBuildNumber}</h3>
          <p className="text-sm text-slate-600 mt-1">
            {currentBuildIndex + 1} of {buildNumbers.length} sinks
          </p>
        </div>
        
        <ScrollArea className="h-[calc(100%-5rem)]">
          <div className="p-4 space-y-2">
            {SECTIONS.map((section) => {
              const status = getSectionStatus(section.id)
              const isExpanded = expandedSections.has(section.id)
              const Icon = section.icon
              
              return (
                <button
                  key={section.id}
                  onClick={() => toggleSection(section.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg transition-colors",
                    activeSection === section.id 
                      ? "bg-white shadow-sm border" 
                      : "hover:bg-slate-100",
                    status === 'incomplete' && section.required && "border-red-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-slate-600" />
                    <div className="text-left">
                      <div className="font-medium text-sm">{section.label}</div>
                      {status === 'incomplete' && section.required && (
                        <div className="text-xs text-red-600">Required</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {status === 'complete' && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-transform",
                      isExpanded && "rotate-90"
                    )} />
                  </div>
                </button>
              )
            })}
          </div>
        </ScrollArea>

        {/* Navigation */}
        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentBuildIndex(Math.max(0, currentBuildIndex - 1))}
              disabled={currentBuildIndex === 0}
            >
              Previous
            </Button>
            <Button
              size="sm"
              onClick={() => setCurrentBuildIndex(Math.min(buildNumbers.length - 1, currentBuildIndex + 1))}
              disabled={currentBuildIndex === buildNumbers.length - 1}
              className="flex-1"
            >
              Next Sink
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 max-w-4xl mx-auto">
            {/* Sink Body Section */}
            {activeSection === 'sink-body' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Sink Body Configuration</CardTitle>
                  <CardDescription>Configure the sink model, dimensions, legs and feet</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Sink Model */}
                      <div className="space-y-2">
                        <Label>Sink Model *</Label>
                        <Select 
                          value={currentConfig.sinkModelId} 
                          onValueChange={(value) => updateConfig({ sinkModelId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select model" />
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

                      {/* Workflow Direction */}
                      <div className="space-y-2">
                        <Label>Workflow Direction</Label>
                        <Select 
                          value={currentConfig.workflowDirection || 'LEFT_TO_RIGHT'} 
                          onValueChange={(value) => updateConfig({ workflowDirection: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LEFT_TO_RIGHT">Left to Right</SelectItem>
                            <SelectItem value="RIGHT_TO_LEFT">Right to Left</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Dimensions */}
                      <div className="space-y-2">
                        <Label>Width (inches) *</Label>
                        <Input
                          type="number"
                          value={currentConfig.width || ''}
                          onChange={(e) => updateConfig({ width: parseInt(e.target.value) || null })}
                          placeholder="e.g., 48"
                          min="24"
                          max="120"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Length (inches) *</Label>
                        <Input
                          type="number"
                          value={currentConfig.length || ''}
                          onChange={(e) => updateConfig({ length: parseInt(e.target.value) || null })}
                          placeholder="e.g., 60"
                          min="48"
                          max="120"
                        />
                      </div>

                      {/* Legs */}
                      <div className="space-y-2">
                        <Label>Leg Type *</Label>
                        <Select 
                          value={currentConfig.legsTypeId} 
                          onValueChange={(value) => updateConfig({ legsTypeId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select legs" />
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

                      {/* Feet */}
                      <div className="space-y-2">
                        <Label>Feet Type *</Label>
                        <Select 
                          value={currentConfig.feetTypeId} 
                          onValueChange={(value) => updateConfig({ feetTypeId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select feet" />
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
            )}

            {/* Basins Section */}
            {activeSection === 'basins' && (
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Basin Configuration</CardTitle>
                        <CardDescription>
                          {currentConfig.basins?.length || 0} of {getMaxBasins()} basins configured
                        </CardDescription>
                      </div>
                      <ChevronRight className={cn(
                        "w-5 h-5 transition-transform",
                        expandedSections.has('basins') && "rotate-90"
                      )} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="space-y-4">
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
                        <div key={basin.id} className="p-4 border rounded-lg space-y-3">
                          <div className="flex justify-between items-center">
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
                              <Label className="text-sm">Type</Label>
                              <Select 
                                value={basin.basinType} 
                                onValueChange={(value) => {
                                  const updatedBasins = [...currentConfig.basins]
                                  updatedBasins[index] = { ...basin, basinType: value }
                                  updateConfig({ basins: updatedBasins })
                                }}
                              >
                                <SelectTrigger className="h-9">
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
                              <Label className="text-sm">Size</Label>
                              <Select 
                                value={basin.basinSizePartNumber || ''} 
                                onValueChange={(value) => {
                                  const updatedBasins = [...currentConfig.basins]
                                  updatedBasins[index] = { ...basin, basinSizePartNumber: value }
                                  updateConfig({ basins: updatedBasins })
                                }}
                              >
                                <SelectTrigger className="h-9">
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
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Quick Actions for other sections */}
            <div className="grid grid-cols-3 gap-4">
              {/* Faucets Quick Card */}
              <Card 
                className={cn(
                  "cursor-pointer hover:shadow-md transition-shadow",
                  activeSection === 'faucets' && "ring-2 ring-indigo-500"
                )}
                onClick={() => toggleSection('faucets')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <ShowerHead className="w-5 h-5 text-slate-600" />
                    {getSectionStatus('faucets') === 'complete' && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <h4 className="font-medium text-sm">Faucets</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    {currentConfig.faucets?.length || 0} configured
                  </p>
                </CardContent>
              </Card>

              {/* Sprayers Quick Card */}
              <Card 
                className={cn(
                  "cursor-pointer hover:shadow-md transition-shadow",
                  activeSection === 'sprayers' && "ring-2 ring-indigo-500"
                )}
                onClick={() => toggleSection('sprayers')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Waves className="w-5 h-5 text-slate-600" />
                    {getSectionStatus('sprayers') === 'complete' && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <h4 className="font-medium text-sm">Sprayers</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    {currentConfig.sprayers?.length || 0} configured
                  </p>
                </CardContent>
              </Card>

              {/* Pegboard Quick Card */}
              <Card 
                className={cn(
                  "cursor-pointer hover:shadow-md transition-shadow",
                  activeSection === 'pegboard' && "ring-2 ring-indigo-500"
                )}
                onClick={() => toggleSection('pegboard')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Grid3x3 className="w-5 h-5 text-slate-600" />
                    {getSectionStatus('pegboard') === 'complete' && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <h4 className="font-medium text-sm">Pegboard</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    {currentConfig.pegboard ? 'Enabled' : 'Disabled'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Visual Preview */}
            {currentConfig.sinkModelId && currentConfig.width && currentConfig.length && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Configuration Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-100 rounded-lg p-6">
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-semibold">
                        {currentConfig.width}" × {currentConfig.length}"
                      </div>
                      <div className="text-slate-600">
                        {getSelectedModel()?.name}
                      </div>
                      <div className="flex justify-center gap-4 mt-4">
                        {currentConfig.basins?.map((basin: any, i: number) => (
                          <div key={i} className="bg-white rounded p-2 shadow-sm">
                            <Droplets className="w-6 h-6 text-blue-500 mx-auto" />
                            <div className="text-xs mt-1">{basin.basinType}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}