"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, Package, CheckCircle, FileText } from "lucide-react"
import { BOMViewer } from "@/components/order/BOMViewer"
import { nextJsApiClient } from "@/lib/api"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface ProcurementTabProps {
  orderId: string
  orderStatus: string
  bomData: any
  bomLoading: boolean
  bomError: string | null
  onStatusChange: () => void
}

export function ProcurementTab({
  orderId,
  orderStatus,
  bomData,
  bomLoading,
  bomError,
  onStatusChange,
}: ProcurementTabProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [approving, setApproving] = useState(false)

  // Check if user has permission to view this tab
  const hasPermission = session?.user?.role === "ADMIN" || session?.user?.role === "PROCUREMENT_SPECIALIST"
  const canApprove = orderStatus === "ORDER_CREATED"

  const handleApproveBOM = async () => {
    setApproving(true)
    try {
      await nextJsApiClient.put(`/orders/${orderId}/status`, {
        newStatus: "READY_FOR_PRE_QC",
        notes: "BOM approved by procurement specialist",
      })
      
      toast({
        title: "BOM Approved",
        description: "Order has been approved and is ready for Pre-QC",
      })
      
      onStatusChange()
    } catch (error: any) {
      toast({
        title: "Approval Failed", 
        description: error.response?.data?.message || "Failed to approve BOM",
        variant: "destructive",
      })
    } finally {
      setApproving(false)
    }
  }

  if (!hasPermission) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to view procurement information.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Order Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                BOM Review & Approval
              </CardTitle>
              <CardDescription>
                Review the Bill of Materials and approve for production
              </CardDescription>
            </div>
            <Badge className={
              orderStatus === "ORDER_CREATED" ? "bg-blue-100 text-blue-700" :
              orderStatus === "READY_FOR_PRE_QC" ? "bg-green-100 text-green-700" :
              "bg-gray-100 text-gray-700"
            }>
              {orderStatus === "ORDER_CREATED" ? "Awaiting Approval" :
               orderStatus === "READY_FOR_PRE_QC" ? "Approved" : 
               orderStatus.replace("_", " ")}
            </Badge>
          </div>
        </CardHeader>
        {canApprove && (
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h4 className="font-medium">Ready for Approval</h4>
                <p className="text-sm text-gray-600">
                  Review the BOM below and approve to proceed to Pre-QC
                </p>
              </div>
              <Button
                onClick={handleApproveBOM}
                disabled={approving}
                className="bg-green-600 hover:bg-green-700"
              >
                {approving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve BOM
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* BOM Display */}
      {bomLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mr-2" />
            <span>Loading BOM data...</span>
          </CardContent>
        </Card>
      ) : bomError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{bomError}</AlertDescription>
        </Alert>
      ) : bomData ? (
        <Card>
          <CardHeader>
            <CardTitle>Bill of Materials</CardTitle>
            <CardDescription>
              Complete list of parts and assemblies for this order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BOMViewer bomData={bomData} />
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No BOM data available. Please generate the BOM first.
          </AlertDescription>
        </Alert>
      )}

      {/* Approval History */}
      {!canApprove && (
        <Card>
          <CardHeader>
            <CardTitle>Approval Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                This order has been approved and is proceeding through production.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  )
}