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
import { ChevronLeft, ChevronRight, Settings, Wrench } from "lucide-react"
import { nextJsApiClient } from '@/lib/api'

export function ConfigurationStep() {
  const { sinkSelection, configurations, updateSinkConfiguration } = useOrderCreateStore()
  const [currentBuildIndex, setCurrentBuildIndex] = useState(0)

  const [sinkModels, setSinkModels] = useState<any[]>([])
  const [legsTypes, setLegsTypes] = useState<any[]>([])
  const [feetOptions, setFeetOptions] = useState<any[]>([])
  const [pegboardTypes, setPegboardTypes] = useState<any[]>([])
  const [basinTypes, setBasinTypes] = useState<any[]>([])
  const [basinSizes, setBasinSizes] = useState<any[]>([])
  const [faucetTypes, setFaucetTypes] = useState<any[]>([])
  const [sprayerTypes, setSprayerTypes] = useState<any[]>([])

  useEffect(() => {
    async function fetchConfigOptions() {
      try {
        const [sinkModelsRes, legsTypesRes, feetTypesRes, pegboardTypesRes, basinTypesRes, basinSizesRes, faucetTypesRes, sprayerTypesRes] = await Promise.all([
          nextJsApiClient.get('/configurator?type=sink-models'),
          nextJsApiClient.get('/configurator?type=legs-types'),
          nextJsApiClient.get('/configurator?type=feet-types'),
          nextJsApiClient.get('/configurator?type=pegboard-types'),
          nextJsApiClient.get('/configurator?type=basin-types'),
          nextJsApiClient.get('/configurator?type=basin-sizes'),
          nextJsApiClient.get('/configurator?type=faucet-types'),
          nextJsApiClient.get('/configurator?type=sprayer-types'),
        ])
        setSinkModels(sinkModelsRes.data.data || [])
        setLegsTypes(legsTypesRes.data.data || [])
        setFeetOptions(feetTypesRes.data.data || [])
        setPegboardTypes(pegboardTypesRes.data.data || [])
        setBasinTypes(basinTypesRes.data.data || [])
        setBasinSizes(basinSizesRes.data.data?.standardSizes || [])
        setFaucetTypes(faucetTypesRes.data.data || [])
        setSprayerTypes(sprayerTypesRes.data.data || [])
      } catch (err) {
        // Handle error (show toast, etc.)
      }
    }
    fetchConfigOptions()
  }, [])

  const buildNumbers = sinkSelection.buildNumbers || []
  const currentBuildNumber = buildNumbers[currentBuildIndex]
  const currentConfig = configurations[currentBuildNumber] || {}

  const updateConfig = (updates: any) => {
    updateSinkConfiguration(currentBuildNumber, updates)
  }

  const getSelectedModel = () => {
    return sinkModels.find(model => model.assemblyId === currentConfig.sinkModelId)
  }

  const getMaxFaucets = () => {
    const model = getSelectedModel()
    return model ? Math.min(model.basins + 1, 3) : 2
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

  if (!currentBuildNumber) {
    return (
      <div className="text-center py-8">
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
        
        {buildNumbers.length > 1 && (
          <div className="flex items-center space-x-2">
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
          </div>
        )}
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

      <Tabs defaultValue="sink-body" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sink-body">Sink Body</TabsTrigger>
          <TabsTrigger value="basins">Basins</TabsTrigger>
          <TabsTrigger value="faucets">Faucets</TabsTrigger>
          <TabsTrigger value="addons">Add-ons</TabsTrigger>
        </TabsList>

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
                  <Select value={currentConfig.sinkModelId} onValueChange={(value: any) => updateConfig({ sinkModelId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sink model" />
                    </SelectTrigger>
                    <SelectContent>
                      {sinkModels.map((model) => (
                        <SelectItem key={model.assemblyId} value={model.assemblyId}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      onChange={(e) => updateConfig({ width: parseInt(e.target.value) })}
                      placeholder="e.g., 48"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="length">Length (inches) *</Label>
                    <Input
                      id="length"
                      type="number"
                      value={currentConfig.length || ''}
                      onChange={(e) => updateConfig({ length: parseInt(e.target.value) })}
                      placeholder="e.g., 54"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Legs Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Legs Configuration</CardTitle>
                <CardDescription>Choose leg type and specific kit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Leg Type *</Label>
                  <RadioGroup
                    value={currentConfig.legsType}
                    onValueChange={(value) => updateConfig({ legsType: value, legsKitId: '' })}
                  >
                    {legsTypes.map((type) => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={type.value} />
                        <Label>{type.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/*
                <div className="space-y-2">
                  <Label>Kit Selection *</Label>
                  <Select value={currentConfig.legsKitId} onValueChange={(value: any) => updateConfig({ legsKitId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select kit" />
                    </SelectTrigger>
                    <SelectContent>
                      {(currentConfig.legsType === 'HEIGHT_ADJUSTABLE' ? heightAdjustableOptions : fixedHeightOptions).map((option: any) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                */}
              </CardContent>
            </Card>

            {/* Feet Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Feet Configuration</CardTitle>
                <CardDescription>Choose the feet type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Feet Type *</Label>
                  <RadioGroup
                    value={currentConfig.feetType}
                    onValueChange={(value) => updateConfig({ feetType: value })}
                  >
                    {feetOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} />
                        <Label>{option.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pegboard Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Pegboard Configuration</CardTitle>
              <CardDescription>Optional pegboard setup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pegboard"
                  checked={currentConfig.pegboard || false}
                  onCheckedChange={(checked: any) => updateConfig({ pegboard: !!checked })}
                />
                <Label htmlFor="pegboard">Include Pegboard</Label>
              </div>

              {currentConfig.pegboard && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label>Pegboard Type *</Label>
                    <Select value={currentConfig.pegboardType} onValueChange={(value: any) => updateConfig({ pegboardType: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {pegboardTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* {currentConfig.pegboardType === 'COLORSAFE' && (
                    <div className="space-y-2">
                      <Label>Color *</Label>
                      <Select value={currentConfig.pegboardColor} onValueChange={(value: any) => updateConfig({ pegboardColor: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                        <SelectContent>
                          {pegboardColors.map((color: any) => (
                            <SelectItem key={color} value={color}>
                              {color}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )} */}

                  <div className="space-y-2">
                    <Label>Size Option *</Label>
                    <RadioGroup
                      value={currentConfig.pegboardSizeType}
                      onValueChange={(value) => updateConfig({ pegboardSizeType: value })}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="SAME_AS_SINK" />
                        <Label>Same as Sink Length</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="CUSTOM" />
                        <Label>Custom Size</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {currentConfig.pegboardSizeType === 'CUSTOM' && (
                    <div className="grid grid-cols-2 gap-4 col-span-full">
                      <div className="space-y-2">
                        <Label>Width (inches)</Label>
                        <Input
                          type="number"
                          value={currentConfig.pegboardWidth || ''}
                          onChange={(e) => updateConfig({ pegboardWidth: parseInt(e.target.value) })}
                          placeholder="Width"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Length (inches)</Label>
                        <Input
                          type="number"
                          value={currentConfig.pegboardLength || ''}
                          onChange={(e) => updateConfig({ pegboardLength: parseInt(e.target.value) })}
                          placeholder="Length"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Basin Configuration */}
        <TabsContent value="basins" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basin Configuration</CardTitle>
              <CardDescription>
                Configure basin types and sizes for {getSelectedModel()?.name || 'selected model'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!currentConfig.sinkModelId ? (
                <p className="text-slate-600">Please select a sink model first.</p>
              ) : (
                <div className="space-y-6">
                  {Array.from({ length: getSelectedModel()?.basins || 1 }, (_, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-4">
                      <h4 className="font-medium">Basin {index + 1}</h4>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Basin Type *</Label>
                          <Select 
                            value={currentConfig.basins?.[index]?.basinType} 
                            onValueChange={(value) => {
                              const basins = [...(currentConfig.basins || [])]
                              basins[index] = { ...basins[index], basinType: value }
                              updateConfig({ basins })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select basin type" />
                            </SelectTrigger>
                            <SelectContent>
                              {basinTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Basin Size *</Label>
                          <Select 
                            value={currentConfig.basins?.[index]?.basinSize} 
                            onValueChange={(value) => {
                              const basins = [...(currentConfig.basins || [])]
                              basins[index] = { ...basins[index], basinSize: value }
                              updateConfig({ basins })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select basin size" />
                            </SelectTrigger>
                            <SelectContent>
                              {basinSizes.map((size) => (
                                <SelectItem key={size.value} value={size.value}>
                                  {size.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {currentConfig.basins?.[index]?.basinSize === 'CUSTOM' && (
                          <div className="col-span-2">
                            <Label>Custom Dimensions (W × L × D inches)</Label>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              <Input placeholder="Width" type="number" />
                              <Input placeholder="Length" type="number" />
                              <Input placeholder="Depth" type="number" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Basin Add-ons */}
                      <div className="space-y-2">
                        <Label>Basin Add-ons</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox id={`ptrap-${index}`} />
                            <Label htmlFor={`ptrap-${index}`}>P-Trap Disinfection Drain Unit</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id={`light-${index}`} />
                            <Label htmlFor={`light-${index}`}>Basin Light</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Faucet Configuration */}
        <TabsContent value="faucets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Faucet Configuration</CardTitle>
              <CardDescription>Configure faucet types, quantities, and sprayers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Faucet Type *</Label>
                  <Select value={currentConfig.faucetType} onValueChange={(value) => updateConfig({ faucetType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select faucet type" />
                    </SelectTrigger>
                    <SelectContent>
                      {faucetTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Faucet Quantity *</Label>
                  <Select 
                    value={currentConfig.faucetQuantity?.toString()} 
                    onValueChange={(value) => updateConfig({ faucetQuantity: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select quantity" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: getMaxFaucets() }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sprayer Configuration */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sprayer"
                    checked={currentConfig.sprayer || false}
                    onCheckedChange={(checked: any) => updateConfig({ sprayer: !!checked })}
                  />
                  <Label htmlFor="sprayer">Include Sprayer</Label>
                </div>

                {currentConfig.sprayer && (
                  <div className="p-4 border rounded-lg space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Sprayer Type *</Label>
                        <Select value={currentConfig.sprayerType} onValueChange={(value) => updateConfig({ sprayerType: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sprayer type" />
                          </SelectTrigger>
                          <SelectContent>
                            {sprayerTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Sprayer Quantity *</Label>
                        <Select 
                          value={currentConfig.sprayerQuantity?.toString()} 
                          onValueChange={(value) => updateConfig({ sprayerQuantity: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select quantity" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Sprayer Location *</Label>
                        <Select value={currentConfig.sprayerLocation} onValueChange={(value) => updateConfig({ sprayerLocation: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LEFT">Left Side</SelectItem>
                            <SelectItem value="RIGHT">Right Side</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add-ons Tab */}
        <TabsContent value="addons" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Additional Add-ons</CardTitle>
              <CardDescription>Select optional add-on components</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Additional add-on options will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation for Multiple Sinks */}
      {buildNumbers.length > 1 && (
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Configuration progress: {currentBuildIndex + 1} of {buildNumbers.length} sinks
              </div>
              <div className="flex space-x-2">
                {buildNumbers.map((buildNum, index) => (
                  <Button
                    key={buildNum}
                    variant={index === currentBuildIndex ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentBuildIndex(index)}
                  >
                    {buildNum}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
