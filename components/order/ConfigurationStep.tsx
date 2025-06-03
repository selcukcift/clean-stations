"use client"

import { useState, useEffect } from "react"
import { useOrderCreateStore } from "@/stores/orderCreateStore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Wrench, 
  Loader2, 
  Package, 
  AlertCircle,
  Info,
  CheckCircle,
  Plus,
  Minus
} from "lucide-react"
import { nextJsApiClient } from '@/lib/api'
import { useToast } from "@/hooks/use-toast"

interface SinkModel {
  id: string
  name: string
  basinCount: number
}

interface LegType {
  assemblyId: string
  name: string
  type: string
  legType: string
  exists: boolean
}

interface FeetType {
  assemblyId: string
  name: string
  type: string
  exists: boolean
}

interface PegboardOptions {
  types: Array<{id: string, name: string}>
  standardSizes: Array<{assemblyId: string, name: string, width: number, length: number, covers: string}>
  colorOptions: Array<{assemblyId: string, name: string, colors: string[]}>
  recommendedPegboard: any
  needsCustom: boolean
  customPartNumberRule: string
}

interface BasinType {
  id: string
  name: string
  kitAssemblyId: string
  kitName: string
}

interface BasinSizeOptions {
  standardSizes: Array<{assemblyId: string, name: string, dimensions: string}>
  customPartNumberRule: string
}

export function ConfigurationStep() {
  const { sinkSelection, configurations, updateSinkConfiguration } = useOrderCreateStore()
  const { toast } = useToast()
  
  // Navigation state
  const [currentBuildIndex, setCurrentBuildIndex] = useState(0)
  const [currentTab, setCurrentTab] = useState('sink-body')
  
  // Configuration options state
  const [sinkModels, setSinkModels] = useState<SinkModel[]>([])
  const [legTypes, setLegTypes] = useState<LegType[]>([])
  const [feetTypes, setFeetTypes] = useState<FeetType[]>([])
  const [pegboardOptions, setPegboardOptions] = useState<PegboardOptions | null>(null)
  const [basinTypes, setBasinTypes] = useState<BasinType[]>([])
  const [basinSizeOptions, setBasinSizeOptions] = useState<BasinSizeOptions | null>(null)
  const [faucetTypes, setFaucetTypes] = useState<any[]>([])
  const [sprayerTypes, setSprayerTypes] = useState<any[]>([])
  const [controlBox, setControlBox] = useState<any>(null)
  
  // Loading states
  const [loading, setLoading] = useState(true)
  const [controlBoxLoading, setControlBoxLoading] = useState(false)
  const [pegboardLoading, setPegboardLoading] = useState(false)

  // Get current configuration
  const buildNumbers = sinkSelection.buildNumbers || []
  const currentBuildNumber = buildNumbers[currentBuildIndex]
  const currentConfig = configurations[currentBuildNumber] || {}

  // Update configuration helper
  const updateConfig = (updates: any) => {
    updateSinkConfiguration(currentBuildNumber, updates)
  }

  // Load initial configuration options
  useEffect(() => {
    loadConfigurationOptions()
  }, [])

  // Update control box when basin configuration changes
  useEffect(() => {
    if (currentConfig.basins && currentConfig.basins.length > 0) {
      updateControlBox(currentConfig.basins)
    }
  }, [currentConfig.basins])

  // Update pegboard options when sink dimensions change
  useEffect(() => {
    if (currentConfig.width && currentConfig.length) {
      updatePegboardOptions(currentConfig.width, currentConfig.length)
    }
  }, [currentConfig.width, currentConfig.length])

  // Auto-select faucet for E-Sink DI basins
  useEffect(() => {
    if (currentConfig.basins) {
      autoSelectFaucets()
    }
  }, [currentConfig.basins])

  // Auto-populate basins when sink model changes
  useEffect(() => {
    if (currentConfig.sinkModelId && (!currentConfig.basins || currentConfig.basins.length === 0)) {
      const selectedModel = getSelectedModel()
      if (selectedModel) {
        const initialBasins = Array.from({ length: selectedModel.basinCount }, (_, index) => ({
          id: `basin-${Date.now()}-${index}`,
          basinType: '',
          basinSize: '',
          addons: []
        }))
        updateConfig({ basins: initialBasins })
      }
    }
  }, [currentConfig.sinkModelId])

  const loadConfigurationOptions = async () => {
    try {
      setLoading(true)
      
      // Load all basic configuration options
      const [
        sinkModelsRes,
        legTypesRes,
        feetTypesRes,
        basinTypesRes,
        basinSizesRes,
        faucetTypesRes,
        sprayerTypesRes
      ] = await Promise.all([
        nextJsApiClient.get('/configurator?queryType=sinkModels&family=MDRD'),
        nextJsApiClient.get('/configurator?queryType=legTypes'),
        nextJsApiClient.get('/configurator?queryType=feetTypes'),
        nextJsApiClient.get('/configurator?queryType=basinTypes'),
        nextJsApiClient.get('/configurator?queryType=basinSizes'),
        nextJsApiClient.get('/configurator?queryType=faucetTypes'),
        nextJsApiClient.get('/configurator?queryType=sprayerTypes')
      ])

      setSinkModels(sinkModelsRes.data.data || [])
      setLegTypes(legTypesRes.data.data || [])
      setFeetTypes(feetTypesRes.data.data || [])
      setBasinTypes(basinTypesRes.data.data || [])
      setBasinSizeOptions(basinSizesRes.data.data || null)
      setFaucetTypes(faucetTypesRes.data.data?.options || [])
      setSprayerTypes(sprayerTypesRes.data.data || [])

    } catch (error) {
      console.error('Error loading configuration options:', error)
      toast({
        title: "Error",
        description: "Failed to load configuration options",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const updatePegboardOptions = async (width: number, length: number) => {
    try {
      setPegboardLoading(true)
      const response = await nextJsApiClient.get(
        `/configurator?queryType=pegboardOptions&width=${width}&length=${length}`
      )
      setPegboardOptions(response.data.data)
    } catch (error) {
      console.error('Error updating pegboard options:', error)
    } finally {
      setPegboardLoading(false)
    }
  }

  const updateControlBox = async (basins: any[]) => {
    if (!basins || basins.length === 0 || !basins.some(basin => basin?.basinType)) {
      setControlBox(null)
      updateConfig({ controlBoxId: null })
      return
    }

    setControlBoxLoading(true)
    try {
      const validBasins = basins.filter(basin => basin?.basinType)
      const response = await nextJsApiClient.post('/configurator/control-box', {
        basinConfigurations: validBasins
      })
      
      if (response.data.success && response.data.data) {
        setControlBox(response.data.data)
        updateConfig({ controlBoxId: response.data.data.assemblyId })
      } else {
        setControlBox(null)
        updateConfig({ controlBoxId: null })
      }
    } catch (error) {
      console.error('Error fetching control box:', error)
      setControlBox(null)
      updateConfig({ controlBoxId: null })
    } finally {
      setControlBoxLoading(false)
    }
  }

  const autoSelectFaucets = async () => {
    if (!currentConfig.basins) return

    // Check if any basin is E-Sink DI
    const hasDIBasin = currentConfig.basins.some(basin => basin.basinType === 'E_SINK_DI')
    
    if (hasDIBasin && faucetTypes.length > 0) {
      // Auto-select Gooseneck faucet for DI basins
      const gooseneckFaucet = faucetTypes.find(faucet => faucet.type === 'GOOSENECK_DI')
      
      // Check if using new faucets array system
      if (gooseneckFaucet) {
        if (!currentConfig.faucets || currentConfig.faucets.length === 0) {
          // Create initial faucet configuration with Gooseneck
          updateConfig({ 
            faucets: [{
              id: `faucet-${Date.now()}`,
              faucetTypeId: gooseneckFaucet.assemblyId,
              placement: 'CENTER'
            }],
            autoSelectedFaucet: true
          })
          
          toast({
            title: "Auto-Selection",
            description: "Gooseneck faucet automatically selected for E-Sink DI basin",
            duration: 3000
          })
        } else if (currentConfig.faucets && currentConfig.faucets.length > 0) {
          // Update existing faucets to Gooseneck if DI basin is selected
          const updatedFaucets = currentConfig.faucets.map(faucet => ({
            ...faucet,
            faucetTypeId: gooseneckFaucet.assemblyId
          }))
          updateConfig({ 
            faucets: updatedFaucets,
            autoSelectedFaucet: true
          })
        }
        
        // Also support legacy single faucet field
        if (!currentConfig.faucetTypeId && !currentConfig.faucets?.length) {
          updateConfig({ 
            faucetTypeId: gooseneckFaucet.assemblyId,
            autoSelectedFaucet: true
          })
        }
      }
    }
  }

  const getSelectedModel = () => {
    return sinkModels.find(model => model.id === currentConfig.sinkModelId)
  }

  const getMaxBasins = () => {
    const model = getSelectedModel()
    return model ? model.basinCount : 1
  }

  const nextSink = () => {
    if (currentBuildIndex < buildNumbers.length - 1) {
      setCurrentBuildIndex(currentBuildIndex + 1)
    }
  }

  const previousSink = () => {
    if (currentBuildIndex > 0) {
      setCurrentBuildIndex(currentBuildIndex - 1)
    }
  }

  const addBasin = () => {
    const currentBasins = currentConfig.basins || []
    const maxBasins = getMaxBasins()
    
    if (currentBasins.length < maxBasins) {
      const newBasin = {
        id: `basin-${Date.now()}`,
        basinType: '',
        basinSize: '',
        addons: []
      }
      updateConfig({ basins: [...currentBasins, newBasin] })
    }
  }

  const removeBasin = (index: number) => {
    const currentBasins = currentConfig.basins || []
    const updatedBasins = currentBasins.filter((_, i) => i !== index)
    updateConfig({ basins: updatedBasins })
  }

  const updateBasin = (index: number, updates: any) => {
    const currentBasins = [...(currentConfig.basins || [])]
    currentBasins[index] = { ...currentBasins[index], ...updates }
    updateConfig({ basins: currentBasins })
  }

  // Auto-fill function for testing
  const autoFillConfiguration = () => {
    if (!sinkModels.length || !legTypes.length || !feetTypes.length || !basinTypes.length) {
      toast({
        title: "Please wait",
        description: "Configuration options are still loading",
        variant: "destructive"
      })
      return
    }

    // Random selections
    const randomSinkModel = sinkModels[Math.floor(Math.random() * sinkModels.length)]
    const randomLegType = legTypes.filter(l => l.exists)[Math.floor(Math.random() * legTypes.filter(l => l.exists).length)]
    const randomFeetType = feetTypes.filter(f => f.exists)[Math.floor(Math.random() * feetTypes.filter(f => f.exists).length)]
    const randomBasinType = basinTypes[Math.floor(Math.random() * basinTypes.length)]
    
    // Random dimensions
    const randomWidth = 48 + Math.floor(Math.random() * 25) // 48-72
    const randomLength = 48 + Math.floor(Math.random() * 73) // 48-120
    
    // Create random basins
    const maxBasins = randomSinkModel.basinCount
    const randomBasins = Array.from({ length: maxBasins }, (_, index) => ({
      id: `basin-${Date.now()}-${index}`,
      basinType: basinTypes[Math.floor(Math.random() * basinTypes.length)].id,
      basinTypeId: basinTypes[Math.floor(Math.random() * basinTypes.length)].kitAssemblyId,
      basinSize: basinSizeOptions?.standardSizes[Math.floor(Math.random() * basinSizeOptions.standardSizes.length)]?.assemblyId || '',
      basinSizePartNumber: basinSizeOptions?.standardSizes[Math.floor(Math.random() * basinSizeOptions.standardSizes.length)]?.assemblyId || '',
      addons: Math.random() > 0.5 ? ['P_TRAP'] : [],
      addonIds: Math.random() > 0.5 ? ['T2-OA-MS-1026'] : []
    }))

    // Create random faucets
    const randomFaucets = faucetTypes.length > 0 ? [{
      id: `faucet-${Date.now()}`,
      faucetTypeId: faucetTypes[Math.floor(Math.random() * faucetTypes.length)].assemblyId,
      placement: ['CENTER', 'LEFT', 'RIGHT'][Math.floor(Math.random() * 3)]
    }] : []

    // Create random sprayers (optional)
    const randomSprayers = sprayerTypes.length > 0 && Math.random() > 0.5 ? [{
      id: `sprayer-${Date.now()}`,
      sprayerTypeId: sprayerTypes[Math.floor(Math.random() * sprayerTypes.length)].assemblyId,
      location: ['LEFT_SIDE', 'RIGHT_SIDE'][Math.floor(Math.random() * 2)]
    }] : []

    // Apply all random settings
    updateConfig({
      sinkModelId: randomSinkModel.id,
      width: randomWidth,
      length: randomLength,
      legTypeId: randomLegType.assemblyId,
      feetTypeId: randomFeetType.assemblyId,
      workflowDirection: ['LEFT_TO_RIGHT', 'RIGHT_TO_LEFT'][Math.floor(Math.random() * 2)],
      basins: randomBasins,
      faucets: randomFaucets,
      sprayers: randomSprayers,
      hasPegboard: Math.random() > 0.5,
      pegboardType: Math.random() > 0.5 ? 'STANDARD' : 'COLORSAFE_PLUS'
    })

    toast({
      title: "Auto-filled!",
      description: `Configuration auto-filled for ${currentBuildNumber}`,
      duration: 2000
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading configuration options...</span>
      </div>
    )
  }

  if (!currentBuildNumber) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
        <p className="text-slate-600">No build numbers available. Please complete Step 2 first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Build Number Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Sink Configuration</h2>
          <p className="text-slate-600">
            Configure specifications for each sink build number.
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Auto-fill button for testing */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={autoFillConfiguration}
            className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
          >
            🎲 Auto-Fill for Testing
          </Button>
          
          {buildNumbers.length > 1 && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={previousSink}
                disabled={currentBuildIndex === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Badge variant="outline" className="px-3 py-1">
                {currentBuildIndex + 1} of {buildNumbers.length}
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={nextSink}
                disabled={currentBuildIndex === buildNumbers.length - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Current Build Number */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-blue-900">
                Configuring Build Number: {currentBuildNumber}
              </p>
              <p className="text-sm text-blue-700">
                Sink {currentBuildIndex + 1} of {buildNumbers.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sink-body" className="flex items-center gap-2">
            {(currentConfig.sinkModelId && currentConfig.width && currentConfig.length && currentConfig.legTypeId && currentConfig.feetTypeId) ? 
              <span className="text-green-600">✓</span> : <span className="text-slate-400">1</span>
            }
            Sink Body
          </TabsTrigger>
          <TabsTrigger value="basins" disabled={!currentConfig.sinkModelId} className="flex items-center gap-2">
            {(currentConfig.basins && currentConfig.basins.length > 0 && currentConfig.basins.every((b: any) => b.basinType && b.basinSize)) ? 
              <span className="text-green-600">✓</span> : <span className="text-slate-400">2</span>
            }
            Basins
          </TabsTrigger>
          <TabsTrigger value="faucets" disabled={!currentConfig.basins || currentConfig.basins.length === 0} className="flex items-center gap-2">
            {(currentConfig.faucets && currentConfig.faucets.length > 0) ? 
              <span className="text-green-600">✓</span> : <span className="text-slate-400">3</span>
            }
            Faucets & Sprayers
          </TabsTrigger>
          <TabsTrigger value="pegboard" disabled={!currentConfig.width || !currentConfig.length} className="flex items-center gap-2">
            <span className="text-slate-400">4</span>
            Pegboard
          </TabsTrigger>
        </TabsList>

        {/* Enhanced Tab Navigation Helper */}
        <div className="mt-4 flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const tabs = ['sink-body', 'basins', 'faucets', 'pegboard']
              const currentIndex = tabs.indexOf(currentTab)
              if (currentIndex > 0) setCurrentTab(tabs[currentIndex - 1])
            }}
            disabled={currentTab === 'sink-body'}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            <div className="text-sm text-slate-600">
              Step {['sink-body', 'basins', 'faucets', 'pegboard'].indexOf(currentTab) + 1} of 4
            </div>
            <div className="flex gap-1">
              {['sink-body', 'basins', 'faucets', 'pegboard'].map((tab, index) => (
                <div
                  key={tab}
                  className={`w-2 h-2 rounded-full ${
                    tab === currentTab ? 'bg-blue-600' : 
                    ['sink-body', 'basins', 'faucets', 'pegboard'].indexOf(currentTab) > index ? 'bg-green-500' : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const tabs = ['sink-body', 'basins', 'faucets', 'pegboard']
              const currentIndex = tabs.indexOf(currentTab)
              if (currentIndex < tabs.length - 1) {
                const nextTab = tabs[currentIndex + 1]
                // Check if next tab is enabled
                if (nextTab === 'basins' && currentConfig.sinkModelId) setCurrentTab(nextTab)
                else if (nextTab === 'faucets' && currentConfig.basins && currentConfig.basins.length > 0) setCurrentTab(nextTab)
                else if (nextTab === 'pegboard' && currentConfig.width && currentConfig.length) setCurrentTab(nextTab)
              }
            }}
            disabled={currentTab === 'pegboard' || 
              (currentTab === 'sink-body' && !currentConfig.sinkModelId) ||
              (currentTab === 'basins' && (!currentConfig.basins || currentConfig.basins.length === 0)) ||
              (currentTab === 'faucets' && (!currentConfig.width || !currentConfig.length))
            }
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Sink Body Configuration */}
        <TabsContent value="sink-body" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sink Model */}
            <Card>
              <CardHeader>
                <CardTitle>Sink Model</CardTitle>
                <CardDescription>Choose the basin configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Model Selection *</Label>
                  <Select 
                    value={currentConfig.sinkModelId} 
                    onValueChange={(value) => {
                      updateConfig({ sinkModelId: value })
                      // Don't auto-advance - let user control flow
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sink model" />
                    </SelectTrigger>
                    <SelectContent>
                      {sinkModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {getSelectedModel() && (
                    <p className="text-sm text-slate-600">
                      Maximum {getSelectedModel()?.basinCount} basin(s) for this model
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sink Dimensions */}
            <Card>
              <CardHeader>
                <CardTitle>Sink Dimensions</CardTitle>
                <CardDescription>Specify width and length in inches</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="width">Width (inches) *</Label>
                    <Input
                      id="width"
                      type="number"
                      value={currentConfig.width || ''}
                      onChange={(e) => {
                        const width = parseInt(e.target.value) || 0
                        updateConfig({ width })
                      }}
                      placeholder="e.g., 48"
                      min="24"
                      max="120"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="length">Length (inches) *</Label>
                    <Input
                      id="length"
                      type="number"
                      value={currentConfig.length || ''}
                      onChange={(e) => {
                        const length = parseInt(e.target.value) || 0
                        updateConfig({ length })
                        // Don't auto-advance tabs
                      }}
                      placeholder="e.g., 60"
                      min="48"
                      max="120"
                    />
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

            {/* Legs */}
            <Card>
              <CardHeader>
                <CardTitle>Legs</CardTitle>
                <CardDescription>Choose leg type and configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Leg Type *</Label>
                  <Select 
                    value={currentConfig.legTypeId} 
                    onValueChange={(value) => updateConfig({ legTypeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select leg type" />
                    </SelectTrigger>
                    <SelectContent>
                      {legTypes.filter(leg => leg.exists).map((leg) => (
                        <SelectItem key={leg.assemblyId} value={leg.assemblyId}>
                          {leg.type === 'HEIGHT_ADJUSTABLE' ? '📏 ' : '🔒 '}
                          {leg.legType} - {leg.type.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Feet */}
            <Card>
              <CardHeader>
                <CardTitle>Feet</CardTitle>
                <CardDescription>Choose feet/caster configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Feet Type *</Label>
                  <Select 
                    value={currentConfig.feetTypeId} 
                    onValueChange={(value) => updateConfig({ feetTypeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select feet type" />
                    </SelectTrigger>
                    <SelectContent>
                      {feetTypes.filter(feet => feet.exists).map((feet) => (
                        <SelectItem key={feet.assemblyId} value={feet.assemblyId}>
                          {feet.type === 'LOCK_LEVELING_CASTERS' ? '🛞 ' : '⚓ '}
                          {feet.type.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workflow Direction */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow Direction</CardTitle>
              <CardDescription>Choose the workflow direction for this sink</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={currentConfig.workflowDirection} 
                onValueChange={(value) => updateConfig({ workflowDirection: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="LEFT_TO_RIGHT" id="ltr" />
                  <Label htmlFor="ltr">Left to Right</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="RIGHT_TO_LEFT" id="rtl" />
                  <Label htmlFor="rtl">Right to Left</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Basin Configuration */}
        <TabsContent value="basins" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Basin Configuration</h3>
              <p className="text-sm text-slate-600">Configure each basin for this sink</p>
            </div>
            <Button 
              onClick={addBasin}
              disabled={!getSelectedModel() || (currentConfig.basins?.length || 0) >= getMaxBasins()}
              size="sm"
            >
              Add Basin
            </Button>
          </div>

          {!getSelectedModel() && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please select a sink model first to configure basins.
              </AlertDescription>
            </Alert>
          )}

          {currentConfig.basins?.map((basin: any, index: number) => (
            <Card key={basin.id || index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Basin {index + 1}</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => removeBasin(index)}
                  >
                    Remove
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basin Type */}
                  <div className="space-y-2">
                    <Label>Basin Type *</Label>
                    <Select 
                      value={basin.basinType} 
                      onValueChange={(value) => {
                        const selectedType = basinTypes.find(t => t.id === value)
                        updateBasin(index, { 
                          basinType: value,
                          basinTypeId: selectedType?.kitAssemblyId 
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select basin type" />
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

                  {/* Basin Size */}
                  <div className="space-y-2">
                    <Label>Basin Size *</Label>
                    <Select 
                      value={basin.basinSize} 
                      onValueChange={(value) => {
                        if (value === 'CUSTOM') {
                          updateBasin(index, { 
                            basinSize: value,
                            basinSizePartNumber: null 
                          })
                        } else {
                          updateBasin(index, { 
                            basinSize: value,
                            basinSizePartNumber: value // The value is already the assemblyId
                          })
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select basin size" />
                      </SelectTrigger>
                      <SelectContent>
                        {basinSizeOptions?.standardSizes.map((size) => (
                          <SelectItem key={size.assemblyId} value={size.assemblyId}>
                            {size.dimensions}
                          </SelectItem>
                        ))}
                        <SelectItem value="CUSTOM">Custom Size</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Custom Basin Size */}
                {basin.basinSize === 'CUSTOM' && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Width (inches)</Label>
                      <Input
                        type="number"
                        placeholder="20"
                        value={basin.customWidth || ''}
                        onChange={(e) => {
                          const width = e.target.value
                          updateBasin(index, { customWidth: width })
                          // Generate custom part number if all dimensions are filled
                          if (width && basin.customLength && basin.customDepth) {
                            const partNumber = `720.215.001 T2-ADW-BASIN-${width}x${basin.customLength}x${basin.customDepth}`
                            updateBasin(index, { basinSizePartNumber: partNumber })
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Length (inches)</Label>
                      <Input
                        type="number"
                        placeholder="20"
                        value={basin.customLength || ''}
                        onChange={(e) => {
                          const length = e.target.value
                          updateBasin(index, { customLength: length })
                          // Generate custom part number if all dimensions are filled
                          if (basin.customWidth && length && basin.customDepth) {
                            const partNumber = `720.215.001 T2-ADW-BASIN-${basin.customWidth}x${length}x${basin.customDepth}`
                            updateBasin(index, { basinSizePartNumber: partNumber })
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Depth (inches)</Label>
                      <Input
                        type="number"
                        placeholder="8"
                        value={basin.customDepth || ''}
                        onChange={(e) => {
                          const depth = e.target.value
                          updateBasin(index, { customDepth: depth })
                          // Generate custom part number if all dimensions are filled
                          if (basin.customWidth && basin.customLength && depth) {
                            const partNumber = `720.215.001 T2-ADW-BASIN-${basin.customWidth}x${basin.customLength}x${depth}`
                            updateBasin(index, { basinSizePartNumber: partNumber })
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Basin Add-ons */}
                <div className="space-y-2">
                  <Label>Add-ons (Optional)</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id={`ptrap-${index}`}
                        checked={basin.addons?.includes('P_TRAP') || false}
                        onCheckedChange={(checked) => {
                          const currentAddons = basin.addons || []
                          const addonIds = basin.addonIds || []
                          const updatedAddons = checked 
                            ? [...currentAddons, 'P_TRAP']
                            : currentAddons.filter((addon: string) => addon !== 'P_TRAP')
                          const updatedAddonIds = checked
                            ? [...addonIds, 'T2-OA-MS-1026'] // P-TRAP assembly ID
                            : addonIds.filter((id: string) => id !== 'T2-OA-MS-1026')
                          updateBasin(index, { addons: updatedAddons, addonIds: updatedAddonIds })
                        }}
                      />
                      <Label htmlFor={`ptrap-${index}`}>P-TRAP Disinfection Drain Unit</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id={`light-${index}`}
                        checked={basin.addons?.includes('BASIN_LIGHT') || false}
                        onCheckedChange={(checked) => {
                          const currentAddons = basin.addons || []
                          const addonIds = basin.addonIds || []
                          const updatedAddons = checked 
                            ? [...currentAddons, 'BASIN_LIGHT']
                            : currentAddons.filter((addon: string) => addon !== 'BASIN_LIGHT')
                          
                          // Choose basin light ID based on basin type
                          const lightId = basin.basinType === 'E_DRAIN' ? 'T2-OA-BASIN-LIGHT-EDR-KIT' : 'T2-OA-BASIN-LIGHT-ESK-KIT'
                          const updatedAddonIds = checked
                            ? [...addonIds.filter((id: string) => id !== 'T2-OA-BASIN-LIGHT-EDR-KIT' && id !== 'T2-OA-BASIN-LIGHT-ESK-KIT'), lightId]
                            : addonIds.filter((id: string) => id !== 'T2-OA-BASIN-LIGHT-EDR-KIT' && id !== 'T2-OA-BASIN-LIGHT-ESK-KIT')
                          
                          updateBasin(index, { addons: updatedAddons, addonIds: updatedAddonIds })
                        }}
                      />
                      <Label htmlFor={`light-${index}`}>Basin Light Kit</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Control Box Display */}
          {currentConfig.basins && currentConfig.basins.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Control Box
                  {controlBoxLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                </CardTitle>
                <CardDescription>
                  Automatically determined based on basin configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                {controlBox ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">{controlBox.name}</p>
                      <p className="text-sm text-slate-600">{controlBox.mappingRule}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Package className="w-5 h-5" />
                    <span>Control box will be determined based on basin types</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Faucets & Sprayers */}
        <TabsContent value="faucets" className="space-y-6">
          {/* Faucet Configuration - Multiple Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Faucet Configuration</CardTitle>
              <CardDescription>Configure faucets for your sink (Maximum: {getMaxBasins()} faucets)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base">Configured Faucets</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentFaucets = currentConfig.faucets || []
                    if (currentFaucets.length < getMaxBasins()) {
                      const newFaucet = {
                        id: `faucet-${Date.now()}`,
                        faucetTypeId: '',
                        placement: 'CENTER'
                      }
                      updateConfig({ faucets: [...currentFaucets, newFaucet] })
                    }
                  }}
                  disabled={!currentConfig.faucets || currentConfig.faucets.length >= getMaxBasins()}
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
                <div className="space-y-4">
                  {currentConfig.faucets.map((faucet: any, index: number) => (
                    <Card key={faucet.id || index} className="border-slate-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Faucet {index + 1}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updatedFaucets = currentConfig.faucets.filter((_: any, i: number) => i !== index)
                              updateConfig({ faucets: updatedFaucets })
                            }}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Faucet Type</Label>
                            <Select 
                              value={faucet.faucetTypeId} 
                              onValueChange={(value) => {
                                const updatedFaucets = [...currentConfig.faucets]
                                updatedFaucets[index] = { ...faucet, faucetTypeId: value }
                                updateConfig({ faucets: updatedFaucets })
                              }}
                              disabled={currentConfig.basins?.some((b: any) => b.basinType === 'E_SINK_DI')}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select faucet type" />
                              </SelectTrigger>
                              <SelectContent>
                                {faucetTypes.map((faucetType) => (
                                  <SelectItem key={faucetType.assemblyId} value={faucetType.assemblyId}>
                                    {faucetType.displayName}
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
                                <SelectItem value="CENTER">Center</SelectItem>
                                {getMaxBasins() > 1 && (
                                  <SelectItem value="BETWEEN_BASINS">Between Basins</SelectItem>
                                )}
                                <SelectItem value="LEFT">Left Side</SelectItem>
                                <SelectItem value="RIGHT">Right Side</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        {/* Auto-selection notice */}
                        {currentConfig.basins?.some((b: any) => b.basinType === 'E_SINK_DI') && (
                          <Alert className="mt-2">
                            <Info className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              Gooseneck faucet is automatically selected and required for E-Sink DI basins
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Legacy single faucet warning */}
              {currentConfig.faucetTypeId && !currentConfig.faucets?.length && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Legacy faucet configuration detected. Click "Add Faucet" to migrate to the new system.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Sprayer Configuration - Multiple Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Sprayer Configuration</CardTitle>
              <CardDescription>Configure sprayers for your sink (Maximum: 2 sprayers)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base">Configured Sprayers</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentSprayers = currentConfig.sprayers || []
                    if (currentSprayers.length < 2) {
                      const newSprayer = {
                        id: `sprayer-${Date.now()}`,
                        sprayerTypeId: '',
                        location: ''
                      }
                      updateConfig({ sprayers: [...currentSprayers, newSprayer] })
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
                    No sprayers configured. Sprayers are optional. Click "Add Sprayer" if you want to add sprayers.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {currentConfig.sprayers.map((sprayer: any, index: number) => (
                    <Card key={sprayer.id || index} className="border-slate-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Sprayer {index + 1}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updatedSprayers = currentConfig.sprayers.filter((_: any, i: number) => i !== index)
                              updateConfig({ sprayers: updatedSprayers })
                            }}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Sprayer Type</Label>
                            <Select 
                              value={sprayer.sprayerTypeId} 
                              onValueChange={(value) => {
                                const updatedSprayers = [...currentConfig.sprayers]
                                updatedSprayers[index] = { ...sprayer, sprayerTypeId: value }
                                updateConfig({ sprayers: updatedSprayers })
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select sprayer type" />
                              </SelectTrigger>
                              <SelectContent>
                                {sprayerTypes.map((sprayerType) => (
                                  <SelectItem key={sprayerType.assemblyId} value={sprayerType.assemblyId}>
                                    {sprayerType.displayName}
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
                  ))}
                </div>
              )}

              {/* Legacy sprayer warning */}
              {currentConfig.hasSprayer && !currentConfig.sprayers?.length && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Legacy sprayer configuration detected. Click "Add Sprayer" to migrate to the new system.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pegboard Configuration */}
        <TabsContent value="pegboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pegboard Configuration</CardTitle>
              <CardDescription>Optional pegboard add-on</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="has-pegboard"
                  checked={currentConfig.hasPegboard || false}
                  onCheckedChange={(checked) => updateConfig({ hasPegboard: checked })}
                />
                <Label htmlFor="has-pegboard">Include Pegboard</Label>
              </div>

              {currentConfig.hasPegboard && (
                <>
                  {!currentConfig.width || !currentConfig.length ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Please specify sink dimensions in the Sink Body tab first.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      {pegboardLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Loading pegboard options...</span>
                        </div>
                      ) : pegboardOptions ? (
                        <>
                          {/* Pegboard Type */}
                          <div className="space-y-2">
                            <Label>Pegboard Type</Label>
                            <RadioGroup 
                              value={currentConfig.pegboardType} 
                              onValueChange={(value) => updateConfig({ pegboardType: value })}
                            >
                              {pegboardOptions.types.map((type) => (
                                <div key={type.id} className="flex items-center space-x-2">
                                  <RadioGroupItem value={type.id} id={type.id} />
                                  <Label htmlFor={type.id}>{type.name}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>

                          {/* Pegboard Size */}
                          <div className="space-y-2">
                            <Label>Pegboard Size</Label>
                            {pegboardOptions.recommendedPegboard ? (
                              <Alert>
                                <CheckCircle className="h-4 w-4" />
                                <AlertDescription>
                                  Recommended: {pegboardOptions.recommendedPegboard.name} 
                                  ({pegboardOptions.recommendedPegboard.covers})
                                </AlertDescription>
                              </Alert>
                            ) : (
                              <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                  Custom pegboard required for {currentConfig.width}" × {currentConfig.length}" sink
                                  <br />
                                  Part Number: {pegboardOptions.customPartNumberRule.replace(/\[width\]|\[length\]/g, (match) => 
                                    match === '[width]' ? currentConfig.width : currentConfig.length
                                  )}
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>

                          {/* Color Options */}
                          {pegboardOptions.colorOptions.length > 0 && (
                            <div className="space-y-2">
                              <Label>Pegboard Color (Colorsafe+)</Label>
                              <Select 
                                value={currentConfig.pegboardColor} 
                                onValueChange={(value) => updateConfig({ pegboardColor: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select color" />
                                </SelectTrigger>
                                <SelectContent>
                                  {pegboardOptions.colorOptions[0].colors.map((color) => (
                                    <SelectItem key={color} value={color}>
                                      {color}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </>
                      ) : (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Unable to load pegboard options. Please try again.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}