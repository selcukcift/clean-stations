"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { 
  ClipboardCheck,
  FileText,
  Package,
  Search,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle,
  Download,
  Eye,
  Image,
  Loader2
} from "lucide-react"
import { nextJsApiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Order {
  id: string
  poNumber: string
  customerName: string
  orderStatus: string
  buildNumbers: string[]
  createdAt: string
  targetShipDate?: string
  configurations?: any
  associatedDocuments?: any[]
}

export function QCCockpit() {
  const { toast } = useToast()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('pre-qc')

  useEffect(() => {
    fetchOrders()
  }, [activeTab])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const statusFilter = activeTab === 'pre-qc' ? 'READY_FOR_PRE_QC' : 'READY_FOR_FINAL_QC'
      
      const response = await nextJsApiClient.get('/orders', {
        params: {
          status: statusFilter,
          includeDocuments: true
        }
      })

      if (response.data.success) {
        setOrders(response.data.orders || [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStartQC = (order: Order) => {
    router.push(`/orders/${order.id}/qc`)
  }

  const handleViewDocument = (doc: any) => {
    window.open(doc.docURL, '_blank')
  }

  const handleDownloadDocument = async (doc: any) => {
    try {
      const response = await fetch(doc.docURL)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.docName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download document",
        variant: "destructive"
      })
    }
  }

  const filteredOrders = orders.filter(order => 
    order.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.buildNumbers.some(bn => bn.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'READY_FOR_PRE_QC':
        return 'bg-yellow-100 text-yellow-800'
      case 'READY_FOR_FINAL_QC':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSinkDrawings = (order: Order) => {
    return order.associatedDocuments?.filter(doc => 
      doc.docType === 'SINK_DRAWING' || 
      doc.docName.toLowerCase().includes('drawing') ||
      doc.docName.toLowerCase().includes('.dwg') ||
      doc.docName.toLowerCase().includes('.dxf')
    ) || []
  }

  const getPODocuments = (order: Order) => {
    return order.associatedDocuments?.filter(doc => 
      doc.docType === 'PO_DOCUMENT' || 
      doc.docName.toLowerCase().includes('po')
    ) || []
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardCheck className="w-8 h-8" />
          QC Cockpit
        </h1>
        <p className="text-gray-600">
          Manage quality control inspections and access related documents
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search by PO number, customer, or build number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs for different QC phases */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pre-qc">Pre-Production QC</TabsTrigger>
          <TabsTrigger value="final-qc">Final QC</TabsTrigger>
        </TabsList>

        <TabsContent value="pre-qc" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders list */}
            <Card>
              <CardHeader>
                <CardTitle>Orders Awaiting Pre-QC</CardTitle>
                <CardDescription>
                  {filteredOrders.length} orders ready for pre-production inspection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {filteredOrders.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        No orders awaiting Pre-QC
                      </p>
                    ) : (
                      filteredOrders.map((order) => (
                        <Card
                          key={order.id}
                          className={`cursor-pointer transition-colors ${
                            selectedOrder?.id === order.id ? 'border-primary' : ''
                          }`}
                          onClick={() => setSelectedOrder(order)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{order.poNumber}</h4>
                                <p className="text-sm text-gray-600">{order.customerName}</p>
                                <div className="flex gap-2 mt-2">
                                  {order.buildNumbers.map(bn => (
                                    <Badge key={bn} variant="secondary" className="text-xs">
                                      {bn}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="mt-3 flex justify-between items-center">
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Clock className="w-4 h-4" />
                                {new Date(order.createdAt).toLocaleDateString()}
                              </div>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStartQC(order)
                                }}
                              >
                                Start Pre-QC
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Order details and documents */}
            <div className="space-y-4">
              {selectedOrder ? (
                <>
                  {/* Order info */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="font-medium">PO Number:</span> {selectedOrder.poNumber}
                      </div>
                      <div>
                        <span className="font-medium">Customer:</span> {selectedOrder.customerName}
                      </div>
                      <div>
                        <span className="font-medium">Build Numbers:</span>{' '}
                        {selectedOrder.buildNumbers.join(', ')}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>{' '}
                        <Badge className={getStatusColor(selectedOrder.orderStatus)}>
                          {selectedOrder.orderStatus.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      {selectedOrder.targetShipDate && (
                        <div>
                          <span className="font-medium">Target Ship Date:</span>{' '}
                          {new Date(selectedOrder.targetShipDate).toLocaleDateString()}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Sink drawings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Image className="w-5 h-5" />
                        Sink Drawings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {getSinkDrawings(selectedOrder).length === 0 ? (
                        <p className="text-gray-500 text-sm">No sink drawings uploaded</p>
                      ) : (
                        <div className="space-y-2">
                          {getSinkDrawings(selectedOrder).map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-2 border rounded"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-500" />
                                <span className="text-sm truncate max-w-[200px]">
                                  {doc.docName}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleViewDocument(doc)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDownloadDocument(doc)}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* PO documents */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        PO Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {getPODocuments(selectedOrder).length === 0 ? (
                        <p className="text-gray-500 text-sm">No PO documents uploaded</p>
                      ) : (
                        <div className="space-y-2">
                          {getPODocuments(selectedOrder).map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-2 border rounded"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-500" />
                                <span className="text-sm truncate max-w-[200px]">
                                  {doc.docName}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleViewDocument(doc)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDownloadDocument(doc)}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Action button */}
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => handleStartQC(selectedOrder)}
                  >
                    <ClipboardCheck className="w-5 h-5 mr-2" />
                    Start Pre-Production QC Inspection
                  </Button>
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Select an order from the list to view details and documents
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="final-qc">
          {/* Similar structure for Final QC */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Final QC section follows the same structure as Pre-QC
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  )
}