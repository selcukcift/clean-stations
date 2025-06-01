"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { nextJsApiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ClipboardCheck,
  CheckCircle,
  XCircle,
  Eye,
  Play,
  MoreHorizontal,
  Loader2,
  Package,
  AlertTriangle,
  Clock
} from "lucide-react"
import { format } from "date-fns"

export function QCPersonDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    readyForPreQC: 0,
    readyForFinalQC: 0,
    qcInProgress: 0
  })

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const response = await nextJsApiClient.get("/orders?limit=50")
      
      if (response.data.success) {
        // Filter for QC-relevant statuses
        const qcOrders = response.data.data.filter((order: any) => 
          ["READY_FOR_PRE_QC", "READY_FOR_FINAL_QC"].includes(order.orderStatus)
        )
        
        setOrders(qcOrders)
        calculateStats(qcOrders)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (ordersList: any[]) => {
    const stats = {
      readyForPreQC: 0,
      readyForFinalQC: 0,
      qcInProgress: 0
    }

    ordersList.forEach(order => {
      if (order.orderStatus === "READY_FOR_PRE_QC") {
        stats.readyForPreQC++
      } else if (order.orderStatus === "READY_FOR_FINAL_QC") {
        stats.readyForFinalQC++
      }
    })

    setStats(stats)
  }

  const navigateToOrder = (orderId: string) => {
    router.push(`/orders/${orderId}`)
  }

  const handleQCAction = async (orderId: string, action: 'pass' | 'fail', currentStatus: string) => {
    try {
      let newStatus = ""
      let notes = ""

      if (currentStatus === "READY_FOR_PRE_QC") {
        if (action === 'pass') {
          newStatus = "READY_FOR_PRODUCTION"
          notes = "Pre-QC passed, ready for production"
        } else {
          newStatus = "ORDER_CREATED" // Send back for rework
          notes = "Pre-QC failed, requires rework"
        }
      } else if (currentStatus === "READY_FOR_FINAL_QC") {
        if (action === 'pass') {
          newStatus = "READY_FOR_SHIP"
          notes = "Final QC passed, ready for shipping"
        } else {
          newStatus = "READY_FOR_PRODUCTION" // Send back for rework
          notes = "Final QC failed, requires rework"
        }
      }

      const response = await nextJsApiClient.put(`/orders/${orderId}/status`, {
        newStatus,
        notes
      })
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: action === 'pass' ? "QC passed successfully" : "QC failed, sent for rework"
        })
        fetchOrders()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update QC status",
        variant: "destructive"
      })
    }
  }

  const getSinkModelFromOrder = (order: any) => {
    return order.configurations?.[order.buildNumbers[0]]?.sinkModelId || "N/A"
  }

  const getAssemblyDate = (order: any) => {
    // Find the most recent assembly-related log entry
    const assemblyLog = order.historyLogs?.find((log: any) => 
      log.newStatus === "TESTING_COMPLETE" || log.newStatus === "PACKAGING_COMPLETE"
    )
    return assemblyLog ? new Date(assemblyLog.timestamp) : null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Quality Control Dashboard</h2>
        <p className="text-slate-600">Perform quality checks and manage QC tasks</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Ready for Pre-QC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{stats.readyForPreQC}</span>
              <AlertTriangle className="w-8 h-8 text-yellow-500 opacity-20" />
            </div>
            <p className="text-xs text-slate-500 mt-1">Parts arrived, awaiting pre-QC</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Ready for Final QC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{stats.readyForFinalQC}</span>
              <ClipboardCheck className="w-8 h-8 text-indigo-500 opacity-20" />
            </div>
            <p className="text-xs text-slate-500 mt-1">Assembly complete, final check</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Pending QC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {stats.readyForPreQC + stats.readyForFinalQC}
              </span>
              <Clock className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
            <p className="text-xs text-slate-500 mt-1">All QC tasks pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders Ready for QC</CardTitle>
          <CardDescription>
            Orders requiring quality control inspection
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No orders ready for QC</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Sink Type/Model</TableHead>
                  <TableHead>Assembly Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>QC Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const assemblyDate = getAssemblyDate(order)
                  const qcType = order.orderStatus === "READY_FOR_PRE_QC" ? "Pre-QC" : "Final QC"

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.poNumber}</TableCell>
                      <TableCell>{getSinkModelFromOrder(order)}</TableCell>
                      <TableCell>
                        {assemblyDate 
                          ? format(assemblyDate, "MMM dd, yyyy")
                          : "N/A"
                        }
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          order.orderStatus === "READY_FOR_PRE_QC" 
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-indigo-100 text-indigo-700"
                        }>
                          {qcType} Pending
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{qcType}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigateToOrder(order.id)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Play className="w-4 h-4 mr-2" />
                              Start QC
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <ClipboardCheck className="w-4 h-4 mr-2" />
                              View QC Checklist
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleQCAction(order.id, 'pass', order.orderStatus)}
                              className="text-green-600"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Pass QC
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleQCAction(order.id, 'fail', order.orderStatus)}
                              className="text-red-600"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Fail QC
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* QC Checklist Template Placeholder */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">QC Checklist Templates</CardTitle>
          <CardDescription>
            Digital checklists for quality control procedures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            Digital QC checklists will be implemented in a future update. 
            Currently, please refer to the physical QC documentation.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}