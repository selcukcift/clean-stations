"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Download, 
  FileText, 
  Package, 
  ChevronRight, 
  Loader2,
  Info,
  Search,
  Filter
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { nextJsApiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface BOMItem {
  id: string
  partIdOrAssemblyId: string
  name: string
  quantity: number
  itemType: string
  category?: string
  level?: number
  isCustom?: boolean
  children?: BOMItem[]
}

interface BOMDisplayProps {
  orderId: string
  poNumber: string
  bomItems: BOMItem[]
  onExport?: (format: 'csv' | 'pdf') => void
}

export function BOMDisplay({ orderId, poNumber, bomItems, onExport }: BOMDisplayProps) {
  const { toast } = useToast()
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("ALL")
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null)

  // Group items by category
  const groupedItems = bomItems.reduce((acc: Record<string, BOMItem[]>, item) => {
    const category = item.category || 'MISCELLANEOUS'
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {})

  // Get unique categories for filter
  const categories = ['ALL', ...Object.keys(groupedItems)]

  // Filter items based on search and category
  const filteredGroups = Object.entries(groupedItems).reduce((acc, [category, items]) => {
    if (filterCategory !== 'ALL' && category !== filterCategory) return acc
    
    const filteredItems = items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.partIdOrAssemblyId.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    if (filteredItems.length > 0) {
      acc[category] = filteredItems
    }
    return acc
  }, {} as Record<string, BOMItem[]>)

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (onExport) {
      onExport(format)
      return
    }

    try {
      setExporting(format)
      const response = await nextJsApiClient.get(
        `/orders/${orderId}/bom/export?format=${format}`,
        { 
          responseType: 'blob',
          timeout: 30000
        }
      )

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      
      // Extract filename from response headers or generate one
      const contentDisposition = response.headers['content-disposition']
      let filename = `bom_${poNumber}_${new Date().toISOString().split('T')[0]}.${format}`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '')
        }
      }
      
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: `BOM exported as ${format.toUpperCase()} successfully`
      })
    } catch (error: any) {
      console.error('BOM export error:', error)
      toast({
        title: "Export Failed",
        description: error.response?.data?.error || `Failed to export BOM as ${format.toUpperCase()}`,
        variant: "destructive"
      })
    } finally {
      setExporting(null)
    }
  }

  const getTotalQuantity = () => {
    return bomItems.reduce((sum, item) => sum + item.quantity, 0)
  }

  const renderBOMItem = (item: BOMItem, level: number = 0) => (
    <div key={item.id} style={{ marginLeft: `${level * 20}px` }}>
      <div className="flex items-center justify-between py-2 px-3 hover:bg-slate-50 rounded-md transition-colors">
        <div className="flex items-center space-x-3 flex-1">
          <Package className="w-4 h-4 text-slate-400" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={level === 0 ? "font-medium" : "text-sm"}>
                {item.name}
              </span>
              {item.isCustom && (
                <Badge variant="outline" className="text-xs">Custom</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500">{item.partIdOrAssemblyId}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="text-xs">
            {item.itemType}
          </Badge>
          <span className="font-medium text-sm min-w-[60px] text-right">
            Qty: {item.quantity}
          </span>
        </div>
      </div>
      {item.children && item.children.length > 0 && (
        <div className="ml-4 border-l-2 border-slate-100">
          {item.children.map(child => renderBOMItem(child, level + 1))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header with Export Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bill of Materials</CardTitle>
              <CardDescription>
                Complete list of parts and assemblies for PO: {poNumber}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleExport('csv')}
                variant="outline"
                size="sm"
                disabled={exporting === 'csv'}
                className="flex items-center gap-2"
              >
                {exporting === 'csv' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export CSV
              </Button>
              <Button
                onClick={() => handleExport('pdf')}
                variant="outline"
                size="sm"
                disabled={true} // PDF not implemented yet
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by part name or number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-64">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'ALL' ? 'All Categories' : category.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BOM Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Total Items</span>
              <span className="text-2xl font-bold">{bomItems.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Total Quantity</span>
              <span className="text-2xl font-bold">{getTotalQuantity()}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Categories</span>
              <span className="text-2xl font-bold">{Object.keys(groupedItems).length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BOM Items by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Items by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            {Object.keys(filteredGroups).length === 0 ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  No items found matching your search criteria.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {Object.entries(filteredGroups).map(([category, items]) => (
                  <div key={category} className="border rounded-lg">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronRight 
                          className={`w-4 h-4 transition-transform ${
                            expandedCategories.has(category) ? 'rotate-90' : ''
                          }`}
                        />
                        <span className="font-medium">{category.replace(/_/g, ' ')}</span>
                        <Badge variant="secondary" className="ml-2">
                          {items.length} items
                        </Badge>
                      </div>
                      <span className="text-sm text-slate-600">
                        Total Qty: {items.reduce((sum, item) => sum + item.quantity, 0)}
                      </span>
                    </button>
                    
                    {expandedCategories.has(category) && (
                      <>
                        <Separator />
                        <div className="p-2">
                          {items.map(item => renderBOMItem(item))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}