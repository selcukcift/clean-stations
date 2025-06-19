"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  FileText,
  Image,
  Download,
  Eye,
  ExternalLink,
  AlertTriangle,
  Loader2
} from "lucide-react"
import { nextJsApiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface DocumentsReferenceSectionProps {
  orderId: string
  orderData: {
    poNumber: string
    customerName: string
    productFamily: string
    buildNumbers: string[]
    configurations?: any
  }
}

interface OrderDocument {
  id: string
  fileName: string
  filePath: string
  fileType: string
  documentType: string
  uploadedAt: string
  size?: number | null
  description?: string | null
  uploadedBy?: string
}

export function DocumentsReferenceSection({ orderId, orderData }: DocumentsReferenceSectionProps) {
  const { toast } = useToast()
  const [documents, setDocuments] = useState<OrderDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrderDocuments()
  }, [orderId])

  const fetchOrderDocuments = async () => {
    try {
      setLoading(true)
      const response = await nextJsApiClient.get(`/orders/${orderId}/documents`)
      setDocuments(response.data.documents || [])
      setError(null)
    } catch (error) {
      console.error('Error fetching order documents:', error)
      setError('Failed to load order documents')
      toast({
        title: "Error loading documents",
        description: "Unable to fetch order documents",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getDocumentIcon = (fileType: string, documentType: string) => {
    if (documentType?.toLowerCase().includes('drawing') || documentType?.toLowerCase().includes('blueprint')) {
      return <Image className="w-5 h-5 text-blue-600" />
    }
    if (fileType?.toLowerCase().includes('pdf') || documentType?.toLowerCase().includes('po')) {
      return <FileText className="w-5 h-5 text-red-600" />
    }
    return <FileText className="w-5 h-5 text-gray-600" />
  }

  const handleViewDocument = async (document: OrderDocument) => {
    try {
      // If document has a direct URL, open it directly
      if (document.filePath && document.filePath.startsWith('http')) {
        window.open(document.filePath, '_blank')
        return
      }
      
      // Otherwise, try to use file view API
      const response = await nextJsApiClient.get(`/files/${document.id}/view`, {
        responseType: 'blob'
      })
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (error) {
      console.error('Error viewing document:', error)
      toast({
        title: "Error viewing document",
        description: "Unable to open document. It may be stored as an external URL.",
        variant: "destructive"
      })
    }
  }

  const handleDownloadDocument = async (document: OrderDocument) => {
    try {
      // If document has a direct URL, try to download it
      if (document.filePath && document.filePath.startsWith('http')) {
        const link = window.document.createElement('a')
        link.href = document.filePath
        link.download = document.fileName
        link.target = '_blank'
        link.click()
        return
      }
      
      // Otherwise, try to use file download API
      const response = await nextJsApiClient.get(`/files/${document.id}/download`, {
        responseType: 'blob'
      })
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = document.fileName
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading document:', error)
      toast({
        title: "Error downloading document",
        description: "Unable to download document. It may be stored as an external URL.",
        variant: "destructive"
      })
    }
  }

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return 'Size unknown'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getDocumentTypeColor = (documentType: string) => {
    if (documentType?.toLowerCase().includes('drawing')) return 'bg-blue-100 text-blue-800'
    if (documentType?.toLowerCase().includes('po')) return 'bg-green-100 text-green-800'
    if (documentType?.toLowerCase().includes('bom')) return 'bg-purple-100 text-purple-800'
    return 'bg-gray-100 text-gray-800'
  }

  // Group documents by type
  const groupedDocuments = documents.reduce((acc, doc) => {
    const type = doc.documentType || 'Other'
    if (!acc[type]) acc[type] = []
    acc[type].push(doc)
    return acc
  }, {} as Record<string, OrderDocument[]>)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documents & References
          </CardTitle>
          <CardDescription>
            Access sink drawings, PO documents, and other references needed for Pre-QC inspection
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading documents...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documents & References
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={fetchOrderDocuments}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documents & References
          </CardTitle>
          <CardDescription>
            Access sink drawings, PO documents, and other references needed for Pre-QC inspection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="font-medium text-sm text-gray-600 mb-1">Order Information</h4>
              <div className="space-y-1 text-sm">
                <div>PO: <span className="font-medium">{orderData.poNumber}</span></div>
                <div>Customer: <span className="font-medium">{orderData.customerName}</span></div>
                <div>Product: <span className="font-medium">{orderData.productFamily}</span></div>
                {orderData.buildNumbers?.length > 0 && (
                  <div>Build Numbers: <span className="font-medium">{orderData.buildNumbers.join(', ')}</span></div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-600 mb-1">Document Summary</h4>
              <div className="text-sm">
                Total Documents: <span className="font-medium">{documents.length}</span>
              </div>
            </div>
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No documents found for this order</p>
              <p className="text-sm">Documents will appear here once uploaded</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {Object.entries(groupedDocuments).map(([documentType, docs]) => (
                  <div key={documentType}>
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-sm">{documentType}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {docs.length} file{docs.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {docs.map((document) => (
                        <Card key={document.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {getDocumentIcon(document.fileType, document.documentType)}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">
                                    {document.fileName}
                                  </div>
                                  <div className="text-xs text-gray-500 flex items-center gap-2">
                                    <Badge 
                                      variant="secondary" 
                                      className={`text-xs ${getDocumentTypeColor(document.documentType)}`}
                                    >
                                      {document.documentType}
                                    </Badge>
                                    <span>{formatFileSize(document.size)}</span>
                                    <span>•</span>
                                    <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDocument(document)}
                                  title="View document"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownloadDocument(document)}
                                  title="Download document"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {Object.keys(groupedDocuments).indexOf(documentType) < Object.keys(groupedDocuments).length - 1 && (
                      <Separator className="mt-3" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}