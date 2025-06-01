"use client"

import { useState } from "react"
import { useOrderCreateStore, SelectedAccessory } from "@/stores/orderCreateStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

export function ReviewStep() {
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
  const handleSubmitOrder = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const orderData = {
        customerInfo,
        sinkSelection,
        configurations,
        accessories
      }

      const response = await nextJsApiClient.post('/orders', orderData)

      const result: OrderSubmitResponse = response.data
      
      if (result.success) {
        setSubmitSuccess(result)
        // Reset form after successful submission
        setTimeout(() => {
          resetForm()
        }, 3000)
      } else {
        setSubmitError(result.message || 'Order submission failed')
      }
    } catch (error: any) {
      console.error('Error submitting order:', error)
      if (error.response?.data?.message) {
        setSubmitError(error.response.data.message)
      } else {
        setSubmitError('Failed to submit order. Please try again.')
      }
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
            <h2 className="text-2xl font-bold text-green-700">Order Submitted Successfully!</h2>
            <p className="text-muted-foreground">
              Your order has been created and assigned ID: <Badge variant="secondary">{submitSuccess.orderId}</Badge>
            </p>
            {submitSuccess.bomId && (
              <p className="text-muted-foreground">
                BOM generated with ID: <Badge variant="outline">{submitSuccess.bomId}</Badge>
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Redirecting to order dashboard in 3 seconds...
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
                      Submitting...
                    </>
                  ) : (
                    'Submit Order'
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
