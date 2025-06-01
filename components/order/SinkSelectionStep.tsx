"use client"

import { useState, useEffect } from "react"
import { useOrderCreateStore } from "@/stores/orderCreateStore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, AlertTriangle, Construction } from "lucide-react"
import { nextJsApiClient } from '@/lib/api'

interface BuildNumberEntry {
  id: string
  buildNumber: string
  isValid: boolean
}

export function SinkSelectionStep() {
  const { sinkSelection, updateSinkSelection } = useOrderCreateStore()
  const [buildNumbers, setBuildNumbers] = useState<BuildNumberEntry[]>([
    { id: '1', buildNumber: '', isValid: false }
  ])
  const [sinkFamilies, setSinkFamilies] = useState<{ value: string, label: string, available: boolean }[]>([])

  useEffect(() => {
    nextJsApiClient.get('/configurator?type=sink-families')
      .then(res => {
        const families = res.data.data.map((fam: any) => ({
          value: fam.code,
          label: fam.name || fam.code,
          available: fam.available !== false // default to true if not specified
        }))
        setSinkFamilies(families)
      })
      .catch(() => {
        setSinkFamilies([
          { value: 'MDRD', label: 'MDRD CleanStation', available: true }
        ])      })  }, [])

  // Sync local build numbers state with store
  useEffect(() => {
    if (sinkSelection.quantity > 0 && sinkSelection.buildNumbers.length > 0) {
      const syncedBuildNumbers = sinkSelection.buildNumbers.map((buildNumber, index) => ({
        id: (index + 1).toString(),
        buildNumber: buildNumber,
        isValid: buildNumber.length >= 3 && !sinkSelection.buildNumbers.filter((bn, i) => i !== index).includes(buildNumber)
      }))
      
      // Only update if different to avoid infinite loops
      if (JSON.stringify(syncedBuildNumbers) !== JSON.stringify(buildNumbers)) {
        setBuildNumbers(syncedBuildNumbers)
      }
    } else if (sinkSelection.quantity > 0) {
      // Initialize empty build numbers if quantity is set but no build numbers exist
      const emptyBuildNumbers = Array.from({ length: sinkSelection.quantity }, (_, i) => ({
        id: (i + 1).toString(),
        buildNumber: '',
        isValid: false
      }))
      setBuildNumbers(emptyBuildNumbers)
    }
  }, [sinkSelection.quantity, sinkSelection.buildNumbers])

  const handleFamilyChange = (family: string) => {
    if (family === 'ENDOSCOPE' || family === 'INSTROSINK') {
      // Show construction modal or redirect - for now just alert
      alert('This sink family is under construction. Please select MDRD CleanStation.')
      return
    }
    updateSinkSelection({ sinkFamily: family })
  }
  const handleQuantityChange = (quantity: number) => {
    updateSinkSelection({ quantity })
    
    // Adjust build number entries based on quantity
    const newBuildNumbers = [...buildNumbers]
    
    if (quantity > buildNumbers.length) {
      // Add more build number entries
      for (let i = buildNumbers.length; i < quantity; i++) {
        newBuildNumbers.push({
          id: (i + 1).toString(),
          buildNumber: '',
          isValid: false
        })
      }
    } else if (quantity < buildNumbers.length) {
      // Remove excess build number entries
      newBuildNumbers.splice(quantity)
    }
    
    setBuildNumbers(newBuildNumbers)
    // Update store with current build numbers (even if empty)
    const allBuildNumbers = newBuildNumbers.map(bn => bn.buildNumber)
    updateSinkSelection({ buildNumbers: allBuildNumbers })
  }
  const handleBuildNumberChange = (index: number, value: string) => {
    const newBuildNumbers = [...buildNumbers]
    newBuildNumbers[index] = {
      ...newBuildNumbers[index],
      buildNumber: value,
      isValid: value.length >= 3 && !isDuplicateBuildNumber(value, index)
    }
    setBuildNumbers(newBuildNumbers)
    
    // Update store with all build numbers (not just valid ones)
    const allBuildNumbers = newBuildNumbers.map(bn => bn.buildNumber)
    updateSinkSelection({ buildNumbers: allBuildNumbers })
  }

  const isDuplicateBuildNumber = (buildNumber: string, currentIndex: number): boolean => {
    return buildNumbers.some((bn, index) => 
      index !== currentIndex && bn.buildNumber === buildNumber
    )
  }

  const getAllBuildNumbersValid = (): boolean => {
    return buildNumbers.every(bn => bn.isValid) && buildNumbers.length === sinkSelection.quantity
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Sink Selection & Quantities</h2>
        <p className="text-slate-600">
          Choose the sink family, specify quantities, and assign unique build numbers for each sink unit.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sink Family Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Sink Family</CardTitle>
            <CardDescription>
              Select the CleanStation family for this order
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sinkFamily">CleanStation Family *</Label>
              <Select value={sinkSelection.sinkFamily} onValueChange={handleFamilyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a sink family" />
                </SelectTrigger>
                <SelectContent>
                  {sinkFamilies.map((family) => (
                    <SelectItem 
                      key={family.value} 
                      value={family.value}
                      disabled={!family.available}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{family.label}</span>
                        {!family.available && (
                          <Badge variant="secondary" className="ml-2">
                            <Construction className="w-3 h-3 mr-1" />
                            Under Construction
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {sinkSelection.sinkFamily && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                    <span className="text-xs font-medium text-blue-600">i</span>
                  </div>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">MDRD CleanStation Selected</p>
                    <p className="text-xs">
                      Medical Device Reprocessing Department CleanStations for healthcare facilities.
                      Available in 1, 2, or 3 basin configurations.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quantity Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Order Quantity</CardTitle>
            <CardDescription>
              Specify how many sinks for this order
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Number of Sinks *</Label>
              <Select 
                value={sinkSelection.quantity?.toString()} 
                onValueChange={(value: string) => handleQuantityChange(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select quantity" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? 'Sink' : 'Sinks'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {sinkSelection.quantity && sinkSelection.quantity > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm text-green-800">
                  <p className="font-medium">
                    {sinkSelection.quantity} sink{sinkSelection.quantity > 1 ? 's' : ''} selected
                  </p>
                  <p className="text-xs mt-1">
                    Each sink will need individual configuration and a unique build number.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Build Numbers Section */}
      {sinkSelection.quantity && sinkSelection.quantity > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Build Numbers</CardTitle>
            <CardDescription>
              Assign unique build numbers for each sink. These will be used throughout the configuration and production process.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {buildNumbers.map((buildNumber, index) => (
                <div key={buildNumber.id} className="space-y-2">
                  <Label htmlFor={`buildNumber-${index}`}>
                    Sink {index + 1} Build Number *
                  </Label>
                  <div className="relative">
                    <Input
                      id={`buildNumber-${index}`}
                      value={buildNumber.buildNumber}
                      onChange={(e) => handleBuildNumberChange(index, e.target.value)}
                      placeholder={`Enter unique build number for sink ${index + 1}`}
                      className={`w-full ${
                        buildNumber.buildNumber && !buildNumber.isValid 
                          ? 'border-red-300 focus:border-red-500' 
                          : buildNumber.isValid 
                          ? 'border-green-300 focus:border-green-500' 
                          : ''
                      }`}
                    />
                    {buildNumber.buildNumber && !buildNumber.isValid && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      </div>
                    )}
                  </div>
                  {buildNumber.buildNumber && !buildNumber.isValid && (
                    <p className="text-xs text-red-600">
                      {isDuplicateBuildNumber(buildNumber.buildNumber, index)
                        ? 'Build number must be unique'
                        : 'Build number must be at least 3 characters'
                      }
                    </p>
                  )}
                </div>
              ))}
            </div>

            {getAllBuildNumbersValid() && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <span className="text-xs font-medium text-green-600">✓</span>
                  </div>
                  <div className="text-sm text-green-800">
                    <p className="font-medium mb-1">All build numbers are valid</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {buildNumbers.map((bn, index) => (
                        <Badge key={index} variant="outline" className="text-green-700 border-green-300">
                          Sink {index + 1}: {bn.buildNumber}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Progress Summary */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center mt-0.5">
              <span className="text-xs font-medium text-slate-600">2</span>
            </div>
            <div className="text-sm text-slate-800">
              <p className="font-medium mb-1">Step 2 Requirements:</p>
              <ul className="text-xs space-y-1">
                <li className={sinkSelection.sinkFamily ? "text-green-600" : ""}>
                  • {sinkSelection.sinkFamily ? "✓" : "○"} Select sink family (MDRD available)
                </li>
                <li className={sinkSelection.quantity && sinkSelection.quantity > 0 ? "text-green-600" : ""}>
                  • {sinkSelection.quantity && sinkSelection.quantity > 0 ? "✓" : "○"} Choose quantity
                </li>
                <li className={getAllBuildNumbersValid() ? "text-green-600" : ""}>
                  • {getAllBuildNumbersValid() ? "✓" : "○"} Assign unique build numbers
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
