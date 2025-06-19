"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { nextJsApiClient } from "@/lib/api"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Folder,
  FileIcon,
  Layers,
  FileText,
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
  assemblyId?: string
  partNumber?: string
  partIdOrAssemblyId?: string
  quantity: number
  itemType?: "PART" | "ASSEMBLY"
  type?: string
  category?: string
  isCustom?: boolean
  children?: BOMItem[]
  subItems?: BOMItem[]
  components?: BOMItem[]
  description?: string
  hasChildren?: boolean
  isAssembly?: boolean
  isPart?: boolean
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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [pdfExporting, setPdfExporting] = useState<Set<string>>(new Set())
  const [notifyAllUsers, setNotifyAllUsers] = useState(false)

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
          (order: Order) => ["PARTS_SENT_WAITING_ARRIVAL", "READY_FOR_PRE_QC", "READY_FOR_PRODUCTION", "TESTING_COMPLETE", 
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

  // Helper function to reconstruct hierarchy from flat BOM items
  const reconstructBomHierarchy = (flatItems: any[]): BOMItem[] => {
    if (!flatItems || flatItems.length === 0) return []
    
    // Create a map for quick lookup
    const itemMap = new Map<string, BOMItem>()
    const rootItems: BOMItem[] = []
    
    // First pass: Create all items
    flatItems.forEach(item => {
      const bomItem: BOMItem = {
        id: item.id,
        name: item.name,
        assemblyId: item.partIdOrAssemblyId,
        partNumber: item.partIdOrAssemblyId,
        quantity: item.quantity,
        itemType: item.itemType,
        type: item.itemType,
        category: item.category,
        isCustom: item.isCustom,
        children: [],
        components: [],
        subItems: []
      }
      itemMap.set(item.id, bomItem)
    })
    
    // Second pass: Build hierarchy
    flatItems.forEach(item => {
      const bomItem = itemMap.get(item.id)
      if (!bomItem) return
      
      if (item.parentId) {
        // This is a child item
        const parent = itemMap.get(item.parentId)
        if (parent) {
          parent.children = parent.children || []
          parent.components = parent.components || []
          parent.subItems = parent.subItems || []
          
          parent.children.push(bomItem)
          parent.components.push(bomItem)
          parent.subItems.push(bomItem)
        }
      } else {
        // This is a root item
        rootItems.push(bomItem)
      }
    })
    
    return rootItems
  }

  const fetchBOMData = async (orderId: string, forceRegenerate: boolean = false) => {
    // Skip if already loaded and not forcing regenerate
    if (bomData[orderId] && !forceRegenerate) return

    setLoadingBom(prev => new Set(prev).add(orderId))
    try {
      let flatBomItems: any[] = []
      
      if (forceRegenerate) {
        // First generate/regenerate the BOM
        await nextJsApiClient.post(`/orders/${orderId}/generate-bom`)
        
        // Then fetch the order data to get the BOM
        const orderResponse = await nextJsApiClient.get(`/orders/${orderId}`)
        if (orderResponse.data.success && orderResponse.data.data.generatedBoms?.length > 0) {
          flatBomItems = orderResponse.data.data.generatedBoms[0].bomItems || []
        }
      } else {
        // Just fetch existing BOM data from the order
        const orderResponse = await nextJsApiClient.get(`/orders/${orderId}`)
        if (orderResponse.data.success && orderResponse.data.data.generatedBoms?.length > 0) {
          flatBomItems = orderResponse.data.data.generatedBoms[0].bomItems || []
        } else {
          // No existing BOM, generate it
          await nextJsApiClient.post(`/orders/${orderId}/generate-bom`)
          const newOrderResponse = await nextJsApiClient.get(`/orders/${orderId}`)
          if (newOrderResponse.data.success && newOrderResponse.data.data.generatedBoms?.length > 0) {
            flatBomItems = newOrderResponse.data.data.generatedBoms[0].bomItems || []
          }
        }
      }
      
      // Reconstruct hierarchy from flat database items
      const hierarchicalBom = reconstructBomHierarchy(flatBomItems)
      
      console.log("BOM Data:", { 
        orderId, 
        flatItemsLength: flatBomItems.length, 
        hierarchicalItemsLength: hierarchicalBom.length,
        hierarchicalBom 
      })
      
      setBomData(prev => ({ ...prev, [orderId]: hierarchicalBom }))
      
      // Auto-expand key assemblies when BOM loads
      if (hierarchicalBom.length > 0) {
        autoExpandBOM(hierarchicalBom)
      }
      
      // Show success toast
      if (hierarchicalBom.length > 0) {
        toast({
          title: "BOM Loaded",
          description: `CleanStation production BOM loaded with ${hierarchicalBom.length} top-level items`,
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
          newStatus: "PARTS_SENT_WAITING_ARRIVAL",
          notes: "BOM approved by procurement specialist - parts ordered",
          notifyAll: notifyAllUsers
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
        newStatus: "PARTS_SENT_WAITING_ARRIVAL",
        notes: "BOM approved by procurement specialist - parts ordered",
        notifyAll: notifyAllUsers
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

  // Toggle expand/collapse for BOM items
  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const expandAll = (items: BOMItem[]) => {
    const allItemIds = new Set<string>()
    const collectIds = (items: BOMItem[]) => {
      if (!items) return
      items.forEach(item => {
        const itemId = item.id || item.assemblyId || item.partNumber || item.name
        const childItems = item.children || item.subItems || item.components || []
        if (childItems.length > 0) {
          allItemIds.add(itemId)
          collectIds(childItems)
        }
      })
    }
    collectIds(items)
    setExpandedItems(allItemIds)
  }

  const collapseAll = () => {
    setExpandedItems(new Set())
  }

  // Handle PDF export for specific order
  const handlePDFExport = async (orderId: string, poNumber: string) => {
    setPdfExporting(prev => new Set(prev).add(orderId))
    try {
      const response = await nextJsApiClient.get(
        `/orders/${orderId}/export-pdf-simple`,
        { 
          responseType: 'blob',
          timeout: 60000 // 60 second timeout for PDF generation
        }
      )

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      
      // Generate filename
      const filename = `order-${poNumber}-summary.pdf`
      link.download = filename
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "PDF Generated",
        description: `Professional order summary PDF for ${poNumber} has been downloaded.`,
      })
    } catch (error: any) {
      console.error('PDF export error:', error)
      toast({
        title: "Export Failed",
        description: error.response?.data?.message || "Failed to generate PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setPdfExporting(prev => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })
    }
  }

  // Auto-expand key assemblies when BOM loads
  const autoExpandBOM = (items: BOMItem[]) => {
    const itemsToExpand = new Set<string>()
    
    const findExpandableItems = (items: BOMItem[], depth: number = 0) => {
      items.forEach(item => {
        const itemId = item.id || item.assemblyId || item.partNumber || item.name
        const childItems = item.children || item.subItems || item.components || []
        
        // Auto-expand top-level assemblies and key assembly types
        if (itemId && (
          depth === 0 || // Top level
          itemId.includes('T2-BODY-') || // Sink bodies
          itemId.includes('T2-BSN-') || // Basin kits
          itemId.includes('T2-VALVE-') || // Valve assemblies
          itemId.includes('T2-DRAIN-') || // Drain assemblies
          itemId.includes('-KIT') || // Kit assemblies
          (childItems.length > 0 && depth < 2) // Any assembly with children (up to 2 levels deep)
        )) {
          itemsToExpand.add(itemId)
        }
        
        // Recursively check children
        if (childItems.length > 0) {
          findExpandableItems(childItems, depth + 1)
        }
      })
    }
    
    findExpandableItems(items)
    setExpandedItems(itemsToExpand)
  }

  // Render BOM item with BOMViewer-style hierarchy (following single source of truth)
  const renderBOMItem = (item: BOMItem, level: number = 0, index: number = 0): JSX.Element => {
    const childItems = item.children || item.subItems || item.components || []
    const hasChildren = childItems.length > 0
    const itemId = item.id || item.assemblyId || item.partNumber || `${item.name}-${index}`
    const isExpanded = expandedItems.has(itemId)
    
    // Get display part number
    const getDisplayPartNumber = () => {
      if (item.assemblyId && item.assemblyId !== item.name) return item.assemblyId
      if (item.partNumber && item.partNumber !== item.name) return item.partNumber
      if (item.partIdOrAssemblyId && item.partIdOrAssemblyId !== item.name) return item.partIdOrAssemblyId
      if (item.id && item.id !== item.name && !item.id.includes(item.name || '')) return item.id
      return null
    }
    const displayPartNumber = getDisplayPartNumber()
    
    // Enhanced type detection
    const isAssembly = item.isAssembly || item.type === 'ASSEMBLY' || item.type === 'COMPLEX' || 
                      item.type === 'KIT' || item.type === 'SUB_ASSEMBLY' || item.type === 'SIMPLE' ||
                      hasChildren
    const displayQuantity = item.quantity
    
    // Generate unique key
    const uniqueKey = `${itemId}-${level}-${index}-${item.name?.replace(/[^a-zA-Z0-9]/g, '')}-${displayQuantity}`

    // Item styling based on level and type
    const getItemStyle = () => {
      if (level === 0) return 'bg-blue-50 border-l-4 border-blue-600 font-semibold'
      if (isAssembly) return 'bg-gray-50 border-l-4 border-gray-400'
      return ''
    }

    // Icon color based on type
    const getIconColor = () => {
      if (level === 0) return 'text-blue-600'
      if (item.type === 'KIT') return 'text-purple-600'
      if (item.type === 'SUB_ASSEMBLY') return 'text-indigo-600'
      if (isAssembly) return 'text-blue-500'
      return 'text-gray-400'
    }

    return (
      <div>
        <div 
          className={`flex items-center justify-between py-2 px-3 hover:bg-slate-50 rounded-md transition-all duration-200 ${getItemStyle()}`}
          style={{ marginLeft: `${level * 20}px` }}
        >
          <div className="flex items-center space-x-2 flex-1">
            {hasChildren && (
              <button
                onClick={() => toggleItem(itemId)}
                className="p-0.5 hover:bg-gray-200 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-5" />}
            
            {/* Icon based on item type */}
            {isAssembly ? (
              isExpanded ? (
                <FolderOpen className={`w-4 h-4 ${getIconColor()}`} />
              ) : (
                <Folder className={`w-4 h-4 ${getIconColor()}`} />
              )
            ) : (
              <FileIcon className="w-4 h-4 text-gray-400" />
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`${level === 0 ? "font-semibold text-gray-900" : level === 1 ? "font-medium text-gray-800" : "text-sm text-gray-700"} truncate`}>
                  {item.name}
                </span>
                {item.isCustom && (
                  <Badge variant="outline" className="text-xs shrink-0">Custom</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                {displayPartNumber && (
                  <span className="font-mono truncate">{displayPartNumber}</span>
                )}
                {item.description && (
                  <span className="text-gray-400 truncate max-w-[300px]" title={item.description}>
                    • {item.description}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 shrink-0">
            {hasChildren && (
              <Badge variant="outline" className="text-xs">
                <Layers className="w-3 h-3 mr-1" />
                {childItems.length} {childItems.length === 1 ? 'component' : 'components'}
              </Badge>
            )}
            <span className="font-medium text-sm min-w-[80px] text-right bg-gray-100 px-2 py-1 rounded">
              Qty: {displayQuantity}
            </span>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="ml-4 mt-1">
            <div className="border-l-2 border-gray-300 pl-2">
              {childItems.map((child, childIndex) => {
                const childKey = child.id || child.assemblyId || child.partNumber || `${child.name}-${level}-${childIndex}`
                return (
                  <div key={childKey}>
                    {renderBOMItem(child, level + 1, childIndex)}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Calculate hierarchical statistics without flattening to avoid duplication
  const calculateOrderStats = (items: BOMItem[]): { totalItems: number; leafItems: number; leafQuantity: number } => {
    const calculateStats = (items: BOMItem[]): { totalItems: number, leafItems: number, leafQuantity: number } => {
      if (!items || items.length === 0) return { totalItems: 0, leafItems: 0, leafQuantity: 0 }
      
      let totalItems = 0
      let leafItems = 0
      let leafQuantity = 0
      
      items.forEach(item => {
        totalItems += 1
        const itemQty = item.quantity || 0
        
        const childItems = item.children || item.subItems || item.components || []
        if (childItems.length === 0) {
          // This is a leaf item (actual part)
          leafItems += 1
          leafQuantity += itemQty
        } else {
          // This is an assembly, recursively calculate children stats
          const childStats = calculateStats(childItems)
          totalItems += childStats.totalItems
          leafItems += childStats.leafItems
          leafQuantity += childStats.leafQuantity
        }
      })
      
      return { totalItems, leafItems, leafQuantity }
    }
    
    return calculateStats(items)
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
      "PARTS_SENT_WAITING_ARRIVAL": "bg-amber-100 text-amber-700",
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-2xl">CleanStation Production BOM</DialogTitle>
            <DialogDescription className="flex items-center gap-4 mt-2">
              <span className="font-semibold">{order?.poNumber || "N/A"}</span>
              <span className="text-gray-400">•</span>
              <span>{order?.customerName || "Customer"}</span>
              {order?.wantDate && (
                <>
                  <span className="text-gray-400">•</span>
                  <span>Due: {format(new Date(order.wantDate), "MMM dd, yyyy")}</span>
                </>
              )}
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
                {/* Controls and Summary */}
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => expandAll(orderBOM)}>
                      Expand All
                    </Button>
                    <Button variant="outline" size="sm" onClick={collapseAll}>
                      Collapse All
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => order && handlePDFExport(order.id, order.poNumber)}
                      disabled={!order || pdfExporting.has(order?.id || '')}
                    >
                      {pdfExporting.has(order?.id || '') ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4 mr-1" />
                      )}
                      {pdfExporting.has(order?.id || '') ? 'Generating...' : 'Export PDF'}
                    </Button>
                  </div>
                  {stats && (
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium">{stats.leafItems} parts</span>
                      <span className="text-gray-400">•</span>
                      <span className="font-medium">{stats.totalItems} total items</span>
                    </div>
                  )}
                </div>

                {/* Hierarchical BOM Display */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                    <h3 className="font-semibold text-lg text-gray-900">Bill of Materials</h3>
                    <p className="text-sm text-gray-600">Hierarchical component structure</p>
                  </div>
                  <div className="p-4">
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-1">
                        {orderBOM.map((item, idx) => {
                          const itemKey = item.id || item.assemblyId || item.partNumber || `${item.name}-root-${idx}`
                          return (
                            <div key={itemKey}>
                              {renderBOMItem(item, 0, idx)}
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
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
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedOrders.size === pendingOrders.length && pendingOrders.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm">Select all ({selectedOrders.size})</span>
                  </div>
                  <div className="flex items-center gap-2 border-l pl-4">
                    <Checkbox
                      id="notify-all"
                      checked={notifyAllUsers}
                      onCheckedChange={(checked) => setNotifyAllUsers(checked as boolean)}
                    />
                    <label htmlFor="notify-all" className="text-sm cursor-pointer">
                      Notify all users
                    </label>
                  </div>
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
                              variant="outline" 
                              size="sm" 
                              onClick={() => handlePDFExport(order.id, order.poNumber)}
                              disabled={pdfExporting.has(order.id)}
                            >
                              {pdfExporting.has(order.id) ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <FileText className="w-4 h-4 mr-2" />
                              )}
                              {pdfExporting.has(order.id) ? 'Generating...' : 'Export PDF'}
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
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handlePDFExport(order.id, order.poNumber)}
                            disabled={pdfExporting.has(order.id)}
                          >
                            {pdfExporting.has(order.id) ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <FileText className="w-4 h-4 mr-2" />
                            )}
                            {pdfExporting.has(order.id) ? 'PDF...' : 'PDF'}
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
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedOrders.size === allOrders.filter(order => order.orderStatus === "ORDER_CREATED").length && allOrders.filter(order => order.orderStatus === "ORDER_CREATED").length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm">Select all pending ({selectedOrders.size})</span>
                </div>
                <div className="flex items-center gap-2 border-l pl-4">
                  <Checkbox
                    id="notify-all-all-tab"
                    checked={notifyAllUsers}
                    onCheckedChange={(checked) => setNotifyAllUsers(checked as boolean)}
                  />
                  <label htmlFor="notify-all-all-tab" className="text-sm cursor-pointer">
                    Notify all users
                  </label>
                </div>
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
      {Array.from(new Map(allOrders.map(order => [order.id, order])).values()).map((order) => (
        <div key={order.id}>
          {renderBOMDialog(order.id)}
        </div>
      ))}
    </div>
  )
}