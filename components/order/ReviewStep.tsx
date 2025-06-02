"use client"

import { useState } from "react"
import { useOrderCreateStore, SelectedAccessory } from "@/stores/orderCreateStore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle, 
  Package, 
  Calendar, 
  User, 
  FileText, 
  Settings, 
  ShoppingCart,
  Loader2,
  AlertCircle
} from "lucide-react"
import { nextJsApiClient } from '@/lib/api'

interface OrderSubmitResponse {
  success: boolean
  orderId?: string
  message?: string
  bomId?: string
}

interface ReviewStepProps {
  isEditMode?: boolean
  orderId?: string
}

export function ReviewStep({ isEditMode = false, orderId }: ReviewStepProps) {
  const { 
    customerInfo, 
    sinkSelection, 
    configurations, 
    accessories, 
    resetForm 
  } = useOrderCreateStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<OrderSubmitResponse | null>(null)
  const [bomPreview, setBomPreview] = useState<any>(null)
  const [bomLoading, setBomLoading] = useState(false)
  const [showBomPreview, setShowBomPreview] = useState(false)

  const generateBomPreview = async () => {
    setBomLoading(true)
    setBomPreview(null)

    try {
      const orderData = {
        customerInfo: {
          ...customerInfo,
          wantDate: customerInfo.wantDate?.toISOString() || new Date().toISOString()
        },
        sinkSelection,
        configurations,
        accessories
      }

      const response = await nextJsApiClient.post('/orders/preview-bom', orderData)
      
      if (response.data.success) {
        setBomPreview(response.data.data)
        setShowBomPreview(true)
      } else {
        console.error('BOM preview failed:', response.data.message)
      }
    } catch (error: any) {
      console.error('Error generating BOM preview:', error)
    } finally {
      setBomLoading(false)
    }
  }

  const handleSubmitOrder = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const orderData = {
        customerInfo: {
          ...customerInfo,
          wantDate: customerInfo.wantDate?.toISOString() || new Date().toISOString()
        },
        sinkSelection,
        configurations,
        accessories
      }
      
      console.log('Submitting order data:', JSON.stringify(orderData, null, 2))

      let response
      if (isEditMode && orderId) {
        // Update existing order
        response = await nextJsApiClient.put(`/orders/${orderId}`, orderData)
      } else {
        // Create new order
        response = await nextJsApiClient.post('/orders', orderData)
      }

      const result: OrderSubmitResponse = response.data
      
      if (result.success) {
        setSubmitSuccess(result)
        // Reset form after successful submission (only for new orders)
        if (!isEditMode) {
          setTimeout(() => {
            resetForm()
          }, 3000)
        }
      } else {
        setSubmitError(result.message || `Order ${isEditMode ? 'update' : 'submission'} failed`)
      }
    } catch (error: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'submitting'} order:`, error)
      console.error('Error response:', error.response?.data)
      
      let errorMessage = `Failed to ${isEditMode ? 'update' : 'submit'} order. Please try again.`
      
      if (error.response?.data?.errors) {
        // Handle Zod validation errors
        const validationErrors = error.response.data.errors
        errorMessage = `Validation errors: ${validationErrors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      setSubmitError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'Not specified'
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const getAccessoryCount = () => {
    return Object.values(accessories).reduce((total, buildAccessories) => {
      return total + buildAccessories.reduce((sum, acc) => sum + acc.quantity, 0)
    }, 0)
  }

  const getTotalSinkCount = () => {
    return sinkSelection.buildNumbers.length
  }

  if (submitSuccess) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-green-700">
              Order {isEditMode ? 'Updated' : 'Submitted'} Successfully!
            </h2>
            <p className="text-muted-foreground">
              {isEditMode 
                ? `Order ${orderId} has been updated successfully.`
                : `Your order has been created and assigned ID: ${submitSuccess.orderId}`
              }
              {!isEditMode && <Badge variant="secondary" className="ml-2">{submitSuccess.orderId}</Badge>}
            </p>
            {submitSuccess.bomId && (
              <p className="text-muted-foreground">
                BOM {isEditMode ? 'regenerated' : 'generated'} with ID: <Badge variant="outline">{submitSuccess.bomId}</Badge>
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {isEditMode 
                ? 'Redirecting to order details...'
                : 'Redirecting to order dashboard in 3 seconds...'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Review Your Order</h2>
        <p className="text-muted-foreground">
          Please review all details before submitting your order
        </p>
      </div>

      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">PO Number</span>
                  <p className="font-medium">{customerInfo.poNumber}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Sales Person</span>
                  <p className="font-medium">{customerInfo.salesPerson}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Customer Name</span>
                  <p className="font-medium">{customerInfo.customerName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Delivery Date</span>
                  <p className="font-medium">{formatDate(customerInfo.wantDate)}</p>
                </div>
              </div>
              {customerInfo.projectName && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Project Name</span>
                  <p className="font-medium">{customerInfo.projectName}</p>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-muted-foreground">Language</span>
                <p className="font-medium">{customerInfo.language}</p>
              </div>
              {customerInfo.notes && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Notes</span>
                  <p className="font-medium">{customerInfo.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{getTotalSinkCount()}</p>
                  <p className="text-sm text-muted-foreground">Total Sinks</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{sinkSelection.sinkModelId || 'MDRD'}</p>
                  <p className="text-sm text-muted-foreground">Sink Model</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{getAccessoryCount()}</p>
                  <p className="text-sm text-muted-foreground">Accessories</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Build Numbers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Build Numbers & Configurations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sinkSelection.buildNumbers.map((buildNumber, index) => {
                const config = configurations[buildNumber]
                const buildAccessories = accessories[buildNumber] || []
                
                return (
                  <div key={buildNumber} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Build #{buildNumber}</h4>
                      <Badge variant="outline">Sink {index + 1}</Badge>
                    </div>
                    
                    {config && (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Model:</span>
                          <span className="ml-2 font-medium">{config.sinkModelId}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Workflow:</span>
                          <span className="ml-2 font-medium">{config.workFlowDirection}</span>
                        </div>
                        {config.sinkWidth && (
                          <div>
                            <span className="text-muted-foreground">Width:</span>
                            <span className="ml-2 font-medium">{config.sinkWidth}"</span>
                          </div>
                        )}
                        {config.sinkLength && (
                          <div>
                            <span className="text-muted-foreground">Length:</span>
                            <span className="ml-2 font-medium">{config.sinkLength}"</span>
                          </div>
                        )}
                        {config.basins.length > 0 && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Basins:</span>
                            <span className="ml-2 font-medium">{config.basins.length} configured</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {buildAccessories.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Accessories:</p>
                        <div className="flex flex-wrap gap-1">
                          {buildAccessories.map((accessory, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {accessory.assemblyId} (×{accessory.quantity})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* BOM Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>Bill of Materials (BOM)</span>
              </CardTitle>
              <CardDescription>
                Preview the complete parts list for this order before submitting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={generateBomPreview}
                  disabled={bomLoading}
                  variant="outline"
                  className="w-full"
                >
                  {bomLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating BOM Preview...
                    </>
                  ) : (
                    <>
                      <Package className="mr-2 h-4 w-4" />
                      Generate BOM Preview
                    </>
                  )}
                </Button>

                {bomPreview && showBomPreview && (
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">BOM Summary</h4>
                      <Badge variant="outline">
                        {bomPreview.totalItems} total items
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="font-medium text-blue-700">
                          {bomPreview.summary?.systemComponents || 0}
                        </div>
                        <div className="text-blue-600 text-xs">System</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="font-medium text-green-700">
                          {bomPreview.summary?.structuralComponents || 0}
                        </div>
                        <div className="text-green-600 text-xs">Structural</div>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <div className="font-medium text-purple-700">
                          {bomPreview.summary?.basinComponents || 0}
                        </div>
                        <div className="text-purple-600 text-xs">Basin</div>
                      </div>
                      <div className="text-center p-2 bg-orange-50 rounded">
                        <div className="font-medium text-orange-700">
                          {bomPreview.summary?.accessoryComponents || 0}
                        </div>
                        <div className="text-orange-600 text-xs">Accessories</div>
                      </div>
                    </div>

                    <ScrollArea className="h-64 w-full border rounded">
                      <div className="p-4 space-y-2">
                        {bomPreview.bom?.map((item: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm">
                            <div className="flex-1">
                              <div className="font-medium">{item.name}</div>
                              <div className="text-xs text-muted-foreground">
                                ID: {item.id} | Category: {item.category}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary">×{item.quantity}</Badge>
                              {item.isCustom && (
                                <Badge variant="outline" className="ml-1 text-xs">Custom</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Actions */}
          <Card>
            <CardContent className="pt-6">
              {submitError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}
              
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                  size="lg"
                  className="min-w-[150px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditMode ? 'Updating...' : 'Submitting...'}
                    </>
                  ) : (
                    isEditMode ? 'Update Order' : 'Submit Order'
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center mt-4">
                By submitting this order, you confirm that all information is accurate and complete.
              </p>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}
