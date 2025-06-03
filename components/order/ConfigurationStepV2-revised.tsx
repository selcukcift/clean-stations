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

  // Load basin size options when basins change
  useEffect(() => {
    if (currentConfig.basins?.length > 0) {
      loadBasinSizeOptions()
    }
  }, [currentConfig.basins])

  const loadBasinSizeOptions = async () => {
    try {
      const response = await nextJsApiClient.get('/configurator/basin-size-options')
      setBasinSizeOptions(response.data.data || {})
    } catch (error) {
      console.error('Error loading basin size options:', error)
    }
  }

  // Update pegboard options when dimensions change
  useEffect(() => {
    if (currentConfig.width && currentConfig.length) {
      updatePegboardOptions()
    }
  }, [currentConfig.width, currentConfig.length])

  const updatePegboardOptions = async () => {
    if (!currentConfig.width || !currentConfig.length) return
    
    setPegboardLoading(true)
    try {
      const response = await nextJsApiClient.get('/configurator/pegboard-options', {
        params: {
          sinkWidth: currentConfig.width,
          sinkLength: currentConfig.length
        }
      })
      setPegboardOptions(response.data.data || {})
    } catch (error) {
      console.error('Error updating pegboard options:', error)
    } finally {
      setPegboardLoading(false)
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
    
    // Always include CENTER as an option
    options.push({ value: 'CENTER', label: 'Center' })
    
    // Add between-basin options based on basin count
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
    
    // Optionally add LEFT and RIGHT if not occupied
    if (!occupiedPlacements.includes('LEFT')) {
      options.push({ value: 'LEFT', label: 'Left Side' })
    }
    if (!occupiedPlacements.includes('RIGHT')) {
      options.push({ value: 'RIGHT', label: 'Right Side' })
    }
    
    return options
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
              const Icon = section.icon
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
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

      {/* Main Content Area - Shows only active section */}
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

                  {currentConfig.width && currentConfig.length && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Sink dimensions: {currentConfig.width}" × {currentConfig.length}"
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Basins Section */}
            {activeSection === 'basins' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Basin Configuration</CardTitle>
                  <CardDescription>
                    Configure up to {getMaxBasins()} basins for this sink
                  </CardDescription>
                </CardHeader>
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

                    {(!currentConfig.basins || currentConfig.basins.length === 0) ? (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          No basins configured. Click "Add Basin" to add your first basin.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      currentConfig.basins.map((basin: any, index: number) => (
                        <Card key={basin.id} className="border-slate-200">
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
                              <div className="space-y-2">
                                <Label>Type *</Label>
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
                              
                              <div className="space-y-2">
                                <Label>Size *</Label>
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
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Faucets Section */}
            {activeSection === 'faucets' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Faucet Configuration</CardTitle>
                  <CardDescription>
                    Configure faucets for your sink (Maximum: {getMaxBasins()} faucets)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
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

                    {(!currentConfig.faucets || currentConfig.faucets.length === 0) ? (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          No faucets configured. Click "Add Faucet" to add a faucet configuration.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      currentConfig.faucets.map((faucet: any, index: number) => (
                        <Card key={faucet.id} className="border-slate-200">
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
                              <div className="space-y-2">
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
                              
                              <div className="space-y-2">
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
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sprayers Section */}
            {activeSection === 'sprayers' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Sprayer Configuration</CardTitle>
                  <CardDescription>
                    Configure sprayers for your sink (Maximum: 2 sprayers)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Sprayers</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const currentSprayers = currentConfig.sprayers || []
                          if (currentSprayers.length < 2) {
                            updateConfig({ 
                              sprayers: [...currentSprayers, {
                                id: `sprayer-${Date.now()}`,
                                sprayerTypeId: '',
                                location: ''
                              }]
                            })
                          }
                        }}
                        disabled={currentConfig.sprayers && currentConfig.sprayers.length >= 2}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Sprayer
                      </Button>
                    </div>

                    {(!currentConfig.sprayers || currentConfig.sprayers.length === 0) ? (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          No sprayers configured. Sprayers are optional.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      currentConfig.sprayers.map((sprayer: any, index: number) => (
                        <Card key={sprayer.id} className="border-slate-200">
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-medium">Sprayer {index + 1}</h4>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const updatedSprayers = currentConfig.sprayers.filter((_: any, i: number) => i !== index)
                                  updateConfig({ sprayers: updatedSprayers })
                                }}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label>Type</Label>
                                <Select 
                                  value={sprayer.sprayerTypeId} 
                                  onValueChange={(value) => {
                                    const updatedSprayers = [...currentConfig.sprayers]
                                    updatedSprayers[index] = { ...sprayer, sprayerTypeId: value }
                                    updateConfig({ sprayers: updatedSprayers })
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {sprayerTypes.map((type) => (
                                      <SelectItem key={type.assemblyId} value={type.assemblyId}>
                                        {type.displayName}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-2">
                                <Label>Location</Label>
                                <Select 
                                  value={sprayer.location} 
                                  onValueChange={(value) => {
                                    const updatedSprayers = [...currentConfig.sprayers]
                                    updatedSprayers[index] = { ...sprayer, location: value }
                                    updateConfig({ sprayers: updatedSprayers })
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select location" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="LEFT_SIDE">Left Side</SelectItem>
                                    <SelectItem value="RIGHT_SIDE">Right Side</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pegboard Section */}
            {activeSection === 'pegboard' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Pegboard Configuration</CardTitle>
                  <CardDescription>
                    Optional pegboard add-on for your sink
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pegboard-switch" className="text-base">Enable Pegboard</Label>
                    <Switch
                      id="pegboard-switch"
                      checked={currentConfig.pegboard || false}
                      onCheckedChange={(checked) => updateConfig({ pegboard: checked })}
                    />
                  </div>

                  {currentConfig.pegboard && (
                    <>
                      <div className="space-y-2">
                        <Label>Pegboard Type</Label>
                        <Select
                          value={currentConfig.pegboardTypeId}
                          onValueChange={(value) => updateConfig({ pegboardTypeId: value })}
                          disabled={pegboardLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select pegboard type" />
                          </SelectTrigger>
                          <SelectContent>
                            {pegboardOptions.types?.map((type: any) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {currentConfig.pegboardTypeId && (
                        <div className="space-y-2">
                          <Label>Pegboard Size</Label>
                          <Select
                            value={currentConfig.pegboardSizePartNumber}
                            onValueChange={(value) => updateConfig({ pegboardSizePartNumber: value })}
                            disabled={pegboardLoading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select pegboard size" />
                            </SelectTrigger>
                            <SelectContent>
                              {pegboardOptions.sizes?.map((size: any) => (
                                <SelectItem key={size.partNumber} value={size.partNumber}>
                                  {size.dimensions}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

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
                      {(currentConfig.faucets?.length > 0 || currentConfig.sprayers?.length > 0) && (
                        <div className="flex justify-center gap-6 mt-4 pt-4 border-t">
                          {currentConfig.faucets?.length > 0 && (
                            <div className="flex items-center gap-2">
                              <ShowerHead className="w-5 h-5 text-slate-600" />
                              <span className="text-sm">{currentConfig.faucets.length} Faucet(s)</span>
                            </div>
                          )}
                          {currentConfig.sprayers?.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Waves className="w-5 h-5 text-slate-600" />
                              <span className="text-sm">{currentConfig.sprayers.length} Sprayer(s)</span>
                            </div>
                          )}
                        </div>
                      )}
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