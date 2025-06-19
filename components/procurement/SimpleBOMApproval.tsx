"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { nextJsApiClient } from "@/lib/api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"

interface Order {
  id: string
  poNumber: string
  customerName: string
  orderStatus: string
  wantDate: string
  createdAt: string
  totalItems?: number
  estimatedCost?: number
}

interface ServiceOrder {
  id: string
  requestedBy?: { fullName: string }
  requestTimestamp: string
  priority: string
  status: string
  items?: any[]
  estimatedCost?: number
}

interface BOMItem {
  id: string
  name: string
  partIdOrAssemblyId?: string
  quantity: number
  itemType: "PART" | "ASSEMBLY"
  category?: string
  isCustom?: boolean
  children?: BOMItem[]
}

interface SimpleBOMApprovalProps {
  onOrderUpdate?: () => void
}

export function SimpleBOMApproval({ onOrderUpdate }: SimpleBOMApprovalProps) {
  const { toast } = useToast()
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [approvedOrders, setApprovedOrders] = useState<Order[]>([])
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([])
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [bomData, setBomData] = useState<Record<string, BOMItem[]>>({})
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [loadingBom, setLoadingBom] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "all">("pending")
  const [bomDialogOpen, setBomDialogOpen] = useState<string | null>(null)

  useEffect(() => {
    fetchAllOrders()
  }, [])

  const fetchAllOrders = async () => {
    setLoading(true)
    try {
      // Fetch production orders
      const ordersResponse = await nextJsApiClient.get("/orders?limit=50")
      // Fetch service orders
      const serviceResponse = await nextJsApiClient.get("/service-orders?limit=50")
      
      if (ordersResponse.data.success) {
        const allOrders = ordersResponse.data.data
        
        // Separate pending and approved orders
        const pending = allOrders.filter(
          (order: Order) => order.orderStatus === "ORDER_CREATED"
        )
        const approved = allOrders.filter(
          (order: Order) => ["READY_FOR_PRE_QC", "READY_FOR_PRODUCTION", "TESTING_COMPLETE", 
                            "PACKAGING_COMPLETE", "READY_FOR_FINAL_QC", "READY_FOR_SHIP", "SHIPPED"].includes(order.orderStatus)
        )
        
        setPendingOrders(pending)
        setApprovedOrders(approved)
        setAllOrders(allOrders)
      }

      if (serviceResponse.data.success) {
        // Get approved service orders for the approved tab
        const allServiceOrders = serviceResponse.data.data.serviceOrders || []
        const approvedServiceOrders = allServiceOrders.filter(
          (serviceOrder: ServiceOrder) => serviceOrder.status === "APPROVED"
        )
        setServiceOrders(approvedServiceOrders)
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchBOMData = async (orderId: string, forceRegenerate: boolean = false) => {
    // Skip if already loaded and not forcing regenerate
    if (bomData[orderId] && !forceRegenerate) return

    setLoadingBom(prev => new Set(prev).add(orderId))
    try {
      let bom: BOMItem[] = []
      
      if (forceRegenerate) {
        // First generate/regenerate the BOM
        await nextJsApiClient.post(`/orders/${orderId}/generate-bom`)
        
        // Then fetch the order data to get the BOM
        const orderResponse = await nextJsApiClient.get(`/orders/${orderId}`)
        if (orderResponse.data.success && orderResponse.data.data.generatedBoms?.length > 0) {
          bom = orderResponse.data.data.generatedBoms[0].bomItems || []
        }
      } else {
        // Just fetch existing BOM data from the order
        const orderResponse = await nextJsApiClient.get(`/orders/${orderId}`)
        if (orderResponse.data.success && orderResponse.data.data.generatedBoms?.length > 0) {
          bom = orderResponse.data.data.generatedBoms[0].bomItems || []
        } else {
          // No existing BOM, generate it
          await nextJsApiClient.post(`/orders/${orderId}/generate-bom`)
          const newOrderResponse = await nextJsApiClient.get(`/orders/${orderId}`)
          if (newOrderResponse.data.success && newOrderResponse.data.data.generatedBoms?.length > 0) {
            bom = newOrderResponse.data.data.generatedBoms[0].bomItems || []
          }
        }
      }
      
      console.log("BOM Data:", { orderId, bomLength: bom.length, bom })
      
      setBomData(prev => ({ ...prev, [orderId]: bom }))
      
      // Show success toast
      if (bom.length > 0) {
        toast({
          title: "BOM Loaded",
          description: `CleanStation production BOM loaded with ${bom.length} items`,
        })
      } else {
        toast({
          title: "BOM Generated",
          description: "CleanStation production BOM generated - please refresh to see items",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching BOM:", error)
      toast({
        title: "BOM Loading Failed",
        description: "Failed to load CleanStation production BOM",
        variant: "destructive",
      })
    } finally {
      setLoadingBom(prev => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })
    }
  }

  const handleBOMDialogOpen = async (orderId: string) => {
    setBomDialogOpen(orderId)
    await fetchBOMData(orderId, true) // Force regenerate BOM when opening dialog
  }

  const handleOrderSelection = (orderId: string) => {
    const newSelection = new Set(selectedOrders)
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId)
    } else {
      newSelection.add(orderId)
    }
    setSelectedOrders(newSelection)
  }

  const handleSelectAll = () => {
    const currentOrders = activeTab === "pending" ? pendingOrders : activeTab === "approved" ? approvedOrders : allOrders
    if (selectedOrders.size === currentOrders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(currentOrders.map(order => order.id)))
    }
  }

  const handleApproveSelected = async () => {
    if (selectedOrders.size === 0) {
      toast({
        title: "No orders selected",
        description: "Please select orders to approve",
        variant: "destructive",
      })
      return
    }

    setActionLoading("bulk")
    try {
      const approvalPromises = Array.from(selectedOrders).map(orderId =>
        nextJsApiClient.put(`/orders/${orderId}/status`, {
          newStatus: "READY_FOR_PRE_QC",
          notes: "BOM approved by procurement specialist",
        })
      )

      await Promise.all(approvalPromises)

      toast({
        title: "Orders Approved",
        description: `${selectedOrders.size} orders have been approved for production`,
      })

      setSelectedOrders(new Set())
      fetchAllOrders()
      onOrderUpdate?.()
    } catch (error: any) {
      toast({
        title: "Approval Failed",
        description: "Some orders could not be approved",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleApproveSingle = async (orderId: string) => {
    setActionLoading(orderId)
    try {
      await nextJsApiClient.put(`/orders/${orderId}/status`, {
        newStatus: "READY_FOR_PRE_QC",
        notes: "BOM approved by procurement specialist",
      })

      toast({
        title: "Order Approved",
        description: "Order has been approved for production",
      })

      fetchAllOrders()
      onOrderUpdate?.()
    } catch (error: any) {
      toast({
        title: "Approval Failed",
        description: "Failed to approve order",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const renderBOMItems = (items: BOMItem[], level = 0) => {
    return items.map((item, index) => {
      // Check if this is a sink body part (721.709 series or similar)
      const isSinkBodyPart = item.partIdOrAssemblyId?.includes('721.709') || 
                              item.name?.toLowerCase().includes('sink body') ||
                              item.name?.toLowerCase().includes('frame')
      
      // Check for basin parts (722 series)
      const isBasinPart = item.partIdOrAssemblyId?.includes('722.') ||
                          item.name?.toLowerCase().includes('basin') ||
                          item.name?.toLowerCase().includes('e-sink') ||
                          item.name?.toLowerCase().includes('e-drain')
      
      return (
        <div key={`${item.id}-${index}`} className={`ml-${level * 4}`}>
          <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${item.itemType === "ASSEMBLY" ? "bg-blue-500" : "bg-green-500"}`} />
              <span className="font-mono text-sm">{item.partIdOrAssemblyId || item.id}</span>
              <span className="text-sm text-gray-600">{item.name}</span>
              <Badge variant="outline" className="text-xs">
                {item.itemType === "ASSEMBLY" ? "Assembly" : "Part"}
              </Badge>
              {item.category && (
                <Badge variant="secondary" className="text-xs">
                  {item.category}
                </Badge>
              )}
              {isSinkBodyPart && (
                <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200">
                  Sink Body Mfg
                </Badge>
              )}
              {isBasinPart && (
                <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                  Basin System
                </Badge>
              )}
            </div>
            <div className="text-sm font-medium">
              Qty: {item.quantity}
            </div>
          </div>
          {item.children && item.children.length > 0 && renderBOMItems(item.children, level + 1)}
        </div>
      )
    })
  }

  const calculateOrderStats = (items: BOMItem[]): { totalParts: number; totalAssemblies: number } => {
    let totalParts = 0
    let totalAssemblies = 0

    const countItems = (items: BOMItem[]) => {
      items.forEach(item => {
        if (item.itemType === "PART") {
          totalParts += item.quantity
        } else {
          totalAssemblies += item.quantity
        }
        if (item.children) {
          countItems(item.children)
        }
      })
    }

    countItems(items)
    return { totalParts, totalAssemblies }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mr-2" />
        <span>Loading orders...</span>
      </div>
    )
  }

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      "READY_FOR_PRE_QC": "bg-blue-100 text-blue-700",
      "READY_FOR_PRODUCTION": "bg-green-100 text-green-700", 
      "TESTING_COMPLETE": "bg-yellow-100 text-yellow-700",
      "PACKAGING_COMPLETE": "bg-purple-100 text-purple-700",
      "READY_FOR_FINAL_QC": "bg-orange-100 text-orange-700",
      "READY_FOR_SHIP": "bg-teal-100 text-teal-700",
      "SHIPPED": "bg-gray-100 text-gray-700"
    }
    return colors[status] || "bg-gray-100 text-gray-700"
  }

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
  }

  const renderBOMDialog = (orderId: string) => {
    const orderBOM = bomData[orderId] || []
    const isLoadingBOM = loadingBom.has(orderId)
    const stats = orderBOM.length > 0 ? calculateOrderStats(orderBOM) : null
    const order = [...pendingOrders, ...approvedOrders, ...allOrders].find(o => o.id === orderId)

    return (
      <Dialog open={bomDialogOpen === orderId} onOpenChange={(open) => !open && setBomDialogOpen(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>CleanStation Production BOM</DialogTitle>
            <DialogDescription>
              {order ? `${order.poNumber} - ${order.customerName}` : "Order BOM Details"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {isLoadingBOM ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                <span>Generating BOM...</span>
              </div>
            ) : orderBOM.length > 0 ? (
              <div className="space-y-4">
                {/* BOM Summary */}
                {stats && (
                  <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.totalParts}</div>
                      <div className="text-sm text-gray-600">Parts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.totalAssemblies}</div>
                      <div className="text-sm text-gray-600">Assemblies</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{stats.totalParts + stats.totalAssemblies}</div>
                      <div className="text-sm text-gray-600">Total Items</div>
                    </div>
                  </div>
                )}

                {/* BOM Items */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b">
                    <h4 className="font-medium">CleanStation Production BOM</h4>
                  </div>
                  <div className="p-4">
                    {renderBOMItems(orderBOM)}
                  </div>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No production BOM data available. Please generate sink configuration BOM first.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">CleanStation Production BOM Approval</h2>
          <p className="text-gray-600">
            Review and approve CleanStation MDRD sink BOMs for production
          </p>
        </div>
      </div>

      {/* Tabs for Pending vs Approved vs All Orders */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "pending" | "approved" | "all")}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending BOM Approval ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Approved Orders ({approvedOrders.length + serviceOrders.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            All Orders ({allOrders.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Orders Tab */}
        <TabsContent value="pending" className="space-y-4">
          {pendingOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                <p className="text-gray-600 text-center">
                  No CleanStation sink orders are pending BOM approval at this time.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Bulk Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedOrders.size === pendingOrders.length && pendingOrders.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm">Select all ({selectedOrders.size})</span>
                </div>
                <Button
                  onClick={handleApproveSelected}
                  disabled={selectedOrders.size === 0 || actionLoading === "bulk"}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {actionLoading === "bulk" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Selected ({selectedOrders.size})
                    </>
                  )}
                </Button>
              </div>

              {/* Pending Orders Grid */}
              <div className="grid gap-4">
                {pendingOrders.map((order) => {
                  const isSelected = selectedOrders.has(order.id)

                  const wantDate = order.wantDate ? new Date(order.wantDate) : null
                  const daysUntilDue = wantDate
                    ? Math.ceil((wantDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    : null
                  const isUrgent = daysUntilDue !== null && daysUntilDue <= 7

                  return (
                    <Card
                      key={order.id}
                      className={`transition-all duration-200 ${
                        isSelected ? "ring-2 ring-blue-500 bg-blue-50" : "hover:shadow-md"
                      } ${isUrgent ? "border-l-4 border-l-orange-500" : ""}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleOrderSelection(order.id)}
                            />
                            <div>
                              <CardTitle className="text-lg">{order.poNumber}</CardTitle>
                              <p className="text-sm text-gray-600">{order.customerName}</p>
                            </div>
                            {isUrgent && (
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                Due in {daysUntilDue} days
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleBOMDialogOpen(order.id)}
                              disabled={loadingBom.has(order.id)}
                            >
                              {loadingBom.has(order.id) ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Eye className="w-4 h-4 mr-2" />
                              )}
                              Generate & View BOM
                            </Button>
                            <Button
                              onClick={() => handleApproveSingle(order.id)}
                              disabled={actionLoading === order.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {actionLoading === order.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                    </Card>
                  )
                })}
              </div>
            </>
          )}
        </TabsContent>

        {/* Approved Orders Tab */}
        <TabsContent value="approved" className="space-y-4">
          {approvedOrders.length === 0 && serviceOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No approved orders</h3>
                <p className="text-gray-600 text-center">
                  Approved orders and service orders will appear here as they progress through production.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {approvedOrders.map((order) => {

                const wantDate = order.wantDate ? new Date(order.wantDate) : null
                const daysUntilDue = wantDate
                  ? Math.ceil((wantDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  : null

                return (
                  <Card key={order.id} className="transition-all duration-200 hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <CardTitle className="text-lg">{order.poNumber}</CardTitle>
                            <p className="text-sm text-gray-600">{order.customerName}</p>
                          </div>
                          <Badge className={getStatusBadgeColor(order.orderStatus)}>
                            {formatStatus(order.orderStatus)}
                          </Badge>
                          {wantDate && (
                            <div className="text-sm text-gray-500">
                              Due: {format(wantDate, "MMM dd")}
                              {daysUntilDue !== null && (
                                <span className={daysUntilDue < 0 ? "text-red-600 ml-1" : "ml-1"}>
                                  ({daysUntilDue < 0 ? `${Math.abs(daysUntilDue)}d overdue` : `${daysUntilDue}d left`})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleBOMDialogOpen(order.id)}
                            disabled={loadingBom.has(order.id)}
                          >
                            {loadingBom.has(order.id) ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Eye className="w-4 h-4 mr-2" />
                            )}
                            Generate & View BOM
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/orders/${order.id}`} target="_blank" rel="noopener noreferrer">
                              <Eye className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                  </Card>
                )
              })}
              
              {/* Service Orders */}
              {serviceOrders.map((serviceOrder) => {
                const requestDate = serviceOrder.requestTimestamp ? new Date(serviceOrder.requestTimestamp) : null

                return (
                  <Card key={`service-${serviceOrder.id}`} className="transition-all duration-200 hover:shadow-md border-l-4 border-l-green-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <CardTitle className="text-lg">Service Order #{serviceOrder.id.slice(-8)}</CardTitle>
                            <p className="text-sm text-gray-600">{serviceOrder.requestedBy?.fullName || "Service Department"}</p>
                          </div>
                          <Badge className="bg-green-100 text-green-700">
                            Service Approved
                          </Badge>
                          <Badge className={
                            serviceOrder.priority === "URGENT" 
                              ? "bg-red-100 text-red-700" 
                              : serviceOrder.priority === "HIGH"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-blue-100 text-blue-700"
                          }>
                            {serviceOrder.priority || "MEDIUM"}
                          </Badge>
                          {requestDate && (
                            <div className="text-sm text-gray-500">
                              Requested: {format(requestDate, "MMM dd")}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-sm font-medium">{serviceOrder.items?.length || 0} items</div>
                            <div className="text-xs text-gray-500">${serviceOrder.estimatedCost?.toFixed(2) || "TBD"}</div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* All Orders Tab */}
        <TabsContent value="all" className="space-y-4">
          {/* Bulk Actions for All Orders Tab */}
          {allOrders.some(order => order.orderStatus === "ORDER_CREATED") && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedOrders.size === allOrders.filter(order => order.orderStatus === "ORDER_CREATED").length && allOrders.filter(order => order.orderStatus === "ORDER_CREATED").length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm">Select all pending ({selectedOrders.size})</span>
              </div>
              <Button
                onClick={handleApproveSelected}
                disabled={selectedOrders.size === 0 || actionLoading === "bulk"}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading === "bulk" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Selected ({selectedOrders.size})
                  </>
                )}
              </Button>
            </div>
          )}

          {allOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                <p className="text-gray-600 text-center">
                  No orders are currently in the system.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {allOrders.map((order) => {
                const orderBOM = bomData[order.id] || []
                const isLoadingBOM = loadingBom.has(order.id)
                const stats = orderBOM.length > 0 ? calculateOrderStats(orderBOM) : null

                const wantDate = order.wantDate ? new Date(order.wantDate) : null
                const daysUntilDue = wantDate
                  ? Math.ceil((wantDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  : null
                const isUrgent = daysUntilDue !== null && daysUntilDue <= 7
                const isPending = order.orderStatus === "ORDER_CREATED"

                return (
                  <Card key={order.id} className="transition-all duration-200 hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isPending && (
                            <Checkbox
                              checked={selectedOrders.has(order.id)}
                              onCheckedChange={() => handleOrderSelection(order.id)}
                            />
                          )}
                          <div>
                            <CardTitle className="text-lg">{order.poNumber}</CardTitle>
                            <p className="text-sm text-gray-600">{order.customerName}</p>
                          </div>
                          <Badge className={getStatusBadgeColor(order.orderStatus)}>
                            {formatStatus(order.orderStatus)}
                          </Badge>
                          {isUrgent && (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                              Due in {daysUntilDue} days
                            </Badge>
                          )}
                          {wantDate && (
                            <div className="text-sm text-gray-500">
                              Due: {format(wantDate, "MMM dd")}
                              {daysUntilDue !== null && (
                                <span className={daysUntilDue < 0 ? "text-red-600 ml-1" : "ml-1"}>
                                  ({daysUntilDue < 0 ? `${Math.abs(daysUntilDue)}d overdue` : `${daysUntilDue}d left`})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleBOMDialogOpen(order.id)}
                            disabled={loadingBom.has(order.id)}
                          >
                            {loadingBom.has(order.id) ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Eye className="w-4 h-4 mr-2" />
                            )}
                            Generate & View BOM
                          </Button>
                          {isPending ? (
                            <Button
                              onClick={() => handleApproveSingle(order.id)}
                              disabled={actionLoading === order.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {actionLoading === order.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" asChild>
                              <a href={`/orders/${order.id}`} target="_blank" rel="noopener noreferrer">
                                <Eye className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* BOM Dialogs */}
      {[...pendingOrders, ...approvedOrders, ...allOrders].map((order) => 
        renderBOMDialog(order.id)
      )}
    </div>
  )
}