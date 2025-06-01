"use client"

import { useState, useEffect } from "react"
import { useOrderCreateStore } from "@/stores/orderCreateStore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Minus, ShoppingCart, Package, Search } from "lucide-react"
import { nextJsApiClient } from '@/lib/api'

interface Accessory {
  id: string
  name: string
  category: string
  subcategory?: string
  partNumber?: string
  description?: string
  photoURL?: string
  type: 'ACCESSORY' | 'KIT' | 'SERVICE_PART'
}

interface SelectedAccessory {
  assemblyId: string
  accessoryId: string
  name: string
  partNumber?: string
  quantity: number
  buildNumbers: string[]  // Which build numbers this accessory applies to
}

export function AccessoriesStep() {
  const { sinkSelection, accessories, updateAccessories } = useOrderCreateStore()
  const [availableAccessories, setAvailableAccessories] = useState<Accessory[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<{ value: string, label: string }[]>([])

  const buildNumbers = sinkSelection.buildNumbers || []

  useEffect(() => {
    setLoading(true)
    // Fetch categories
    nextJsApiClient.get('/accessories?type=categories')
      .then(res => {
        const apiCategories = res.data.data.map((cat: any) => ({
          value: cat.code,
          label: cat.name || cat.code
        }))
        setCategories([{ value: 'ALL', label: 'All Categories' }, ...apiCategories])
      })
      .catch(() => setCategories([{ value: 'ALL', label: 'All Categories' }]))

    // Fetch all accessories
    nextJsApiClient.get('/accessories?type=all')
      .then(res => setAvailableAccessories(res.data.data))
      .finally(() => setLoading(false))
  }, [])

  const filteredAccessories = availableAccessories.filter(accessory => {
    const matchesSearch = accessory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         accessory.partNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'ALL' || accessory.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getAccessoryQuantity = (accessoryId: string, buildNumber: string): number => {
    const buildAccessories = accessories[buildNumber] || []
    const accessory = buildAccessories.find(acc => acc.accessoryId === accessoryId)
    return accessory?.quantity || 0
  }

  const updateAccessoryQuantity = (
    accessoryId: string,
    accessoryName: string,
    partNumber: string | undefined,
    buildNumber: string,
    quantity: number
  ) => {
    const currentAccessories = accessories[buildNumber] || []
    let updatedAccessories: import('@/stores/orderCreateStore').SelectedAccessory[]

    if (quantity === 0) {
      // Remove accessory
      updatedAccessories = currentAccessories.filter(acc => acc.accessoryId !== accessoryId)
    } else {
      // Update or add accessory
      const existingIndex = currentAccessories.findIndex(acc => acc.accessoryId === accessoryId)
      if (existingIndex >= 0) {
        updatedAccessories = [...currentAccessories]
        updatedAccessories[existingIndex] = {
          ...updatedAccessories[existingIndex],
          quantity
        }
      } else {
        updatedAccessories = [
          ...currentAccessories,
          {
            assemblyId: `${accessoryId}-${buildNumber}`,
            accessoryId,
            name: accessoryName,
            partNumber,
            quantity,
            buildNumbers: [buildNumber]
          }
        ]
      }
    }
    updateAccessories(buildNumber, updatedAccessories)
  }

  const getTotalAccessoriesForBuild = (buildNumber: string): number => {
    const buildAccessories = accessories[buildNumber] || []
    return buildAccessories.reduce((total, acc) => total + acc.quantity, 0)
  }

  const getTotalAccessoriesCount = (): number => {
    return buildNumbers.reduce((total, buildNumber) => 
      total + getTotalAccessoriesForBuild(buildNumber), 0
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Add-on Accessories</h2>
          <p className="text-slate-600">
            Select optional accessories for your CleanStation sinks.
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <ShoppingCart className="w-5 h-5 text-slate-600" />
          <Badge variant="outline" className="px-3 py-1">
            {getTotalAccessoriesCount()} items selected
          </Badge>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search accessories by name or part number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-64">
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full">
                  {categories.map((cat) => (
                    <TabsTrigger key={cat.value} value={cat.value}>{cat.label}</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accessories Catalog */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Available Accessories</CardTitle>
              <CardDescription>
                Browse and select accessories for your order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {filteredAccessories.map((accessory) => (
                    <div key={accessory.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-slate-900">{accessory.name}</h4>
                            <Badge variant="outline">
                              {accessory.type}
                            </Badge>
                          </div>
                          
                          {accessory.partNumber && (
                            <p className="text-sm text-slate-600 mb-1">
                              Part #: {accessory.partNumber}
                            </p>
                          )}
                          
                          {accessory.description && (
                            <p className="text-sm text-slate-600 mb-3">
                              {accessory.description}
                            </p>
                          )}

                          <Badge variant="secondary" className="text-xs">
                            {accessory.category.replace('_', ' ')}
                          </Badge>
                        </div>

                        <div className="ml-4">
                          <Package className="w-8 h-8 text-slate-400" />
                        </div>
                      </div>

                      {/* Quantity Controls for Each Build Number */}
                      <div className="mt-4 space-y-2">
                        {buildNumbers.map((buildNumber) => {
                          const quantity = getAccessoryQuantity(accessory.id, buildNumber)
                          return (
                            <div key={buildNumber} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                              <span className="text-sm font-medium">
                                Build: {buildNumber}
                              </span>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateAccessoryQuantity(
                                    accessory.id, 
                                    accessory.name, 
                                    accessory.partNumber,
                                    buildNumber, 
                                    Math.max(0, quantity - 1)
                                  )}
                                  disabled={quantity === 0}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-8 text-center text-sm">{quantity}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateAccessoryQuantity(
                                    accessory.id, 
                                    accessory.name, 
                                    accessory.partNumber,
                                    buildNumber, 
                                    quantity + 1
                                  )}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}

                  {filteredAccessories.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600">No accessories found matching your search.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Selected Accessories Summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Selected Accessories</CardTitle>
              <CardDescription>
                Summary of accessories for each build
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {buildNumbers.map((buildNumber) => {
                    const buildAccessories = accessories[buildNumber] || []
                    const totalItems = getTotalAccessoriesForBuild(buildNumber)

                    return (
                      <div key={buildNumber} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-slate-900">
                            Build: {buildNumber}
                          </h4>
                          <Badge variant="outline">
                            {totalItems} items
                          </Badge>
                        </div>

                        {buildAccessories.length > 0 ? (
                          <div className="space-y-2">
                            {buildAccessories.map((accessory, index) => (
                              <div key={index} className="text-sm">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="font-medium text-slate-900">
                                      {accessory.name}
                                    </p>
                                    {accessory.partNumber && (
                                      <p className="text-xs text-slate-600">
                                        {accessory.partNumber}
                                      </p>
                                    )}
                                  </div>
                                  <div className="ml-2 text-right">
                                    <p className="font-medium">×{accessory.quantity}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">
                            No accessories selected
                          </p>
                        )}
                      </div>
                    )
                  })}

                  {buildNumbers.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-slate-600">
                        Complete previous steps to select accessories.
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Step Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
              <span className="text-xs font-medium text-blue-600">4</span>
            </div>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Step 4 Summary:</p>
              <ul className="text-xs space-y-1">
                <li>• Total accessories selected: {getTotalAccessoriesCount()}</li>
                <li>• Build numbers configured: {buildNumbers.length}</li>
                <li>• Accessories are optional and can be modified later</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
