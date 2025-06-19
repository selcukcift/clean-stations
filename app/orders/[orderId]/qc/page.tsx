"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { nextJsApiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { QCFormInterface } from "@/components/qc/QCFormInterface"
import { QCFormWithDocuments } from "@/components/qc/QCFormWithDocuments"
import { QCFormInterfaceEnhanced } from "@/components/qc/QCFormInterfaceEnhanced"
import { PreQCChecklistForm } from "@/components/qc/PreQCChecklistForm"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, Info, ArrowLeft, ClipboardCheck } from "lucide-react"
import Link from "next/link"

export default function QCInspectionPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [orderData, setOrderData] = useState<any>(null)
  const [qcTemplate, setQcTemplate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [templateLoading, setTemplateLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrderData()
  }, [params.orderId])

  // Auto-redirect for completely invalid statuses after showing user feedback
  useEffect(() => {
    if (orderData && !loading) {
      const invalidStatuses = ['ORDER_CREATED', 'READY_FOR_SHIP', 'COMPLETED']
      if (invalidStatuses.includes(orderData.orderStatus)) {
        const timer = setTimeout(() => {
          toast({
            title: "Redirecting",
            description: "Returning to QC Cockpit to view available orders",
          })
          router.push('/qc/cockpit')
        }, 5000) // 5 second delay to let user read the message

        return () => clearTimeout(timer)
      }
    }
  }, [orderData, loading, router, toast])

  const fetchOrderData = async () => {
    try {
      setLoading(true)
      const response = await nextJsApiClient.get(`/orders/${params.orderId}`)
      
      if (response.data.success) {
        const order = response.data.data
        setOrderData(order)
        
        // Check order status and fetch appropriate QC template
        if (order.orderStatus === 'READY_FOR_PRE_QC') {
          await fetchQCTemplate('Pre-Production Check')
        } else if (order.orderStatus === 'READY_FOR_FINAL_QC') {
          await fetchQCTemplate('Final QC')
        }
      } else {
        setError("Order not found")
      }
    } catch (error: any) {
      console.error('Error fetching order data:', error)
      setError("Failed to load order data")
      toast({
        title: "Error",
        description: "Failed to load order data for QC inspection",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  const fetchQCTemplate = async (formType: string) => {
    try {
      setTemplateLoading(true)
      const response = await nextJsApiClient.get(`/orders/${params.orderId}/qc/template?formType=${encodeURIComponent(formType)}`)
      
      if (response.data.success) {
        setQcTemplate(response.data.template)
      } else {
        console.error('No QC template found for form type:', formType)
        toast({
          title: "Warning",
          description: `No ${formType} template found. Please contact admin.`,
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error('Error fetching QC template:', error)
      toast({
        title: "Error",
        description: "Failed to load QC template",
        variant: "destructive"
      })
    } finally {
      setTemplateLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error || !orderData) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-lg font-medium">{error || "Order not found"}</p>
      </div>
    )
  }

  // Determine which QC phase we're in
  const getQCPhase = () => {
    if (orderData?.orderStatus === 'READY_FOR_PRE_QC') return 'Pre-Production Check'
    if (orderData?.orderStatus === 'READY_FOR_FINAL_QC') return 'Final QC'
    return 'Unknown'
  }

  const isValidQCStatus = orderData?.orderStatus === 'READY_FOR_PRE_QC' || orderData?.orderStatus === 'READY_FOR_FINAL_QC'

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/qc/cockpit" className="hover:text-gray-900">
          <Button variant="ghost" size="sm" className="p-0 h-auto font-normal">
            <ArrowLeft className="w-4 h-4 mr-1" />
            QC Cockpit
          </Button>
        </Link>
        <span>/</span>
        <span className="font-medium">QC Inspection</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardCheck className="w-8 h-8" />
          QC Inspection
        </h1>
        <p className="text-slate-600">
          Conduct quality control inspection for PO: {orderData.poNumber}
        </p>
        <div className="mt-2">
          <span className="text-sm font-medium">Phase: </span>
          <span className="text-sm text-blue-600">{getQCPhase()}</span>
        </div>
      </div>

      {!isValidQCStatus && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>This order is not ready for QC inspection. Current status: <strong>{orderData?.orderStatus || 'Unknown'}</strong></p>
              <div className="text-sm">
                {orderData?.orderStatus === 'ORDER_CREATED' && '• Order is waiting for procurement approval'}
                {orderData?.orderStatus === 'PARTS_SENT_WAITING_ARRIVAL' && '• Waiting for parts to arrive'}
                {orderData?.orderStatus === 'READY_FOR_PRODUCTION' && '• Order is currently in production'}
                {orderData?.orderStatus === 'READY_FOR_SHIP' && '• QC is complete, order is ready for shipping'}
              </div>
              <div className="pt-2">
                <Link href="/qc/cockpit">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Return to QC Cockpit
                  </Button>
                </Link>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {templateLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading QC template...</span>
        </div>
      )}

      {isValidQCStatus && qcTemplate && (
        <>
          {qcTemplate.name === 'Pre-Production Check MDRD Sink' ? (
            <PreQCChecklistForm
              orderId={params.orderId as string}
              orderData={{
                poNumber: orderData.poNumber,
                customerName: orderData.customerName,
                productFamily: orderData.productFamily || "T2 Sink",
                buildNumbers: orderData.buildNumbers,
                configurations: orderData.configurations
              }}
              template={qcTemplate}
              onSubmit={async (formData) => {
                // Handle Pre-QC form submission
                try {
                  const response = await nextJsApiClient.post(`/orders/${params.orderId}/qc`, formData)
                  if (response.data.success) {
                    toast({
                      title: "Pre-QC Inspection Complete",
                      description: `Pre-QC inspection submitted successfully with result: ${formData.overallStatus}`
                    })
                    window.location.href = `/orders/${params.orderId}`
                  }
                } catch (error: any) {
                  console.error('Pre-QC submission error:', error)
                  toast({
                    title: "Submission Failed",
                    description: error.response?.data?.message || "Failed to submit Pre-QC inspection",
                    variant: "destructive"
                  })
                }
              }}
            />
          ) : (
            <QCFormInterfaceEnhanced
              orderId={params.orderId as string}
              orderData={{
                poNumber: orderData.poNumber,
                customerName: orderData.customerName,
                productFamily: orderData.productFamily || "T2 Sink",
                buildNumbers: orderData.buildNumbers,
                status: orderData.orderStatus,
                configurations: orderData.configurations
              }}
              template={qcTemplate}
              onSubmit={async (formData) => {
                // Handle QC form submission
                try {
                  const response = await nextJsApiClient.post(`/orders/${params.orderId}/qc`, formData)
                  if (response.data.success) {
                    toast({
                      title: "QC Inspection Complete",
                      description: `QC inspection submitted successfully with result: ${formData.overallStatus}`
                    })
                    window.location.href = `/orders/${params.orderId}`
                  }
                } catch (error: any) {
                  console.error('QC submission error:', error)
                  toast({
                    title: "Submission Failed",
                    description: error.response?.data?.message || "Failed to submit QC inspection",
                    variant: "destructive"
                  })
                }
              }}
            />
          )}
        </>
      )}

      {isValidQCStatus && !templateLoading && !qcTemplate && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No QC template available for {getQCPhase()}. Please contact system administrator.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}