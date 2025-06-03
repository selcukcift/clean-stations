"use client"

import { useState } from "react"
import { useOrderCreateStore, SelectedAccessory } from "@/stores/orderCreateStore"
import { DetailedReviewSection } from "./DetailedReviewSection"
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
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Wrench,
  Box
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

// Recursive component to display BOM items with their children
function BOMItemDisplay({ item, level = 0 }: { item: any; level: number }) {
  const [isExpanded, setIsExpanded] = useState(level < 2) // Auto-expand first 2 levels
  const hasChildren = item.components && item.components.length > 0
  const indent = level * 24 // 24px indent per level

  return (
    <div>
      <div 
        className={`flex items-center justify-between p-2 rounded text-sm hover:bg-slate-100 transition-colors ${
          level === 0 ? 'bg-slate-50 border border-slate-200' : 'bg-white'
        }`}
        style={{ marginLeft: `${indent}px` }}
      >
        <div className="flex items-center flex-1 gap-2">
          {hasChildren && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-0.5 hover:bg-slate-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-600" />
              )}
            </button>
          )}
          {!hasChildren && level > 0 && (
            <div className="w-5" /> // Spacer for alignment
          )}
          
          <div className="flex items-center gap-2">
            {level === 0 ? (
              <Package className="w-4 h-4 text-slate-600" />
            ) : item.type === 'PART' ? (
              <Wrench className="w-4 h-4 text-slate-500" />
            ) : (
              <Box className="w-4 h-4 text-slate-500" />
            )}
            <div>
              <div className="font-medium">{item.name}</div>
              <div className="text-xs text-muted-foreground">
                ID: {item.id} | Type: {item.type || item.category}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={level === 0 ? "secondary" : "outline"} className="text-xs">
            ×{item.quantity}
          </Badge>
          {item.isCustom && (
            <Badge variant="outline" className="text-xs">Custom</Badge>
          )}
          {item.isPlaceholder && (
            <Badge variant="destructive" className="text-xs">Missing</Badge>
          )}
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {item.components.map((child: any, index: number) => (
            <BOMItemDisplay 
              key={`${child.id}-${index}`} 
              item={child} 
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  )
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
      <ScrollArea className="h-[700px] pr-4">
        <div className="space-y-6">
          {/* Use the new detailed review section */}
          <DetailedReviewSection 
            customerInfo={customerInfo}
            sinkSelection={sinkSelection}
            configurations={configurations}
            accessories={accessories}
          />

          {/* BOM Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Bill of Materials Preview
              </CardTitle>
              <CardDescription>
                Review the complete BOM before submitting your order
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
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating BOM...
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4 mr-2" />
                      Generate BOM Preview
                    </>
                  )}
                </Button>

                {showBomPreview && bomPreview && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">BOM Items ({bomPreview.totalItems || 0})</h4>
                      <div className="text-sm text-slate-600">
                        {bomPreview.summary?.systemComponents || 0} System + {' '}
                        {bomPreview.summary?.structuralComponents || 0} Structural + {' '}
                        {bomPreview.summary?.basinComponents || 0} Basin + {' '}
                        {bomPreview.summary?.accessoryComponents || 0} Accessories
                      </div>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto border rounded-lg">
                      {bomPreview.bom?.map((item: any, index: number) => (
                        <BOMItemDisplay key={index} item={item} level={0} />
                      ))}
                    </div>
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
