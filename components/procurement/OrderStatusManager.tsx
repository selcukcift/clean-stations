"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { nextJsApiClient } from "@/lib/api"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Package,
  TruckIcon,
  CheckCircle,
  Clock,
  Loader2,
  FileText,
  AlertCircle,
  ShipIcon
} from "lucide-react"
import { format } from "date-fns"

interface Order {
  id: string
  poNumber: string
  customerName: string
  orderStatus: string
  wantDate: string
  createdAt: string
  projectName?: string
  buildNumbers: string[]
}

interface OrderStatusManagerProps {
  orders: Order[]
  onOrderUpdate: () => void
}

// Status display configuration
const statusConfig = {
  'ORDER_CREATED': {
    label: 'Order Created',
    color: 'bg-blue-100 text-blue-700',
    icon: FileText,
    nextActions: ['PARTS_SENT_WAITING_ARRIVAL']
  },
  'PARTS_SENT_WAITING_ARRIVAL': {
    label: 'Parts Shipped',
    color: 'bg-purple-100 text-purple-700',
    icon: TruckIcon,
    nextActions: ['READY_FOR_PRE_QC']
  },
  'READY_FOR_PRE_QC': {
    label: 'Ready for Pre-QC',
    color: 'bg-yellow-100 text-yellow-700',
    icon: CheckCircle,
    nextActions: []
  },
  'READY_FOR_PRODUCTION': {
    label: 'Ready for Production',
    color: 'bg-green-100 text-green-700',
    icon: Package,
    nextActions: []
  }
}

// Action configuration for procurement
const actionConfig = {
  'ORDER_CREATED': {
    action: 'PARTS_SENT_WAITING_ARRIVAL',
    label: 'Mark Parts Shipped',
    icon: TruckIcon,
    description: 'Confirm that parts have been ordered and shipped',
    color: 'bg-purple-600 hover:bg-purple-700'
  },
  'PARTS_SENT_WAITING_ARRIVAL': {
    action: 'READY_FOR_PRE_QC',
    label: 'Parts Arrived - Ready for QC',
    icon: CheckCircle,
    description: 'Confirm that parts have arrived and sink is ready for Pre-QC inspection',
    color: 'bg-green-600 hover:bg-green-700'
  }
}

export function OrderStatusManager({ orders, onOrderUpdate }: OrderStatusManagerProps) {
  const { toast } = useToast()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [notifyAll, setNotifyAll] = useState(false)

  // Filter orders that procurement can act on
  const actionableOrders = orders.filter(order => 
    order.orderStatus === 'ORDER_CREATED' || 
    order.orderStatus === 'PARTS_SENT_WAITING_ARRIVAL'
  )

  const handleStatusUpdate = async (orderId: string, newStatus: string, actionNotes: string) => {
    setActionLoading(orderId)
    try {
      await nextJsApiClient.put(`/orders/${orderId}/status`, {
        newStatus,
        notes: actionNotes,
        notifyAll
      })

      const statusNames = {
        'PARTS_SENT_WAITING_ARRIVAL': 'Parts Shipped',
        'READY_FOR_PRE_QC': 'Ready for Pre-QC'
      }

      toast({
        title: "Status Updated",
        description: `Order status updated to ${statusNames[newStatus as keyof typeof statusNames] || newStatus}`,
      })

      setDialogOpen(null)
      setNotes('')
      setNotifyAll(false)
      onOrderUpdate()
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.response?.data?.message || "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const openActionDialog = (orderId: string) => {
    setDialogOpen(orderId)
    setNotes('')
    setNotifyAll(false)
  }

  const renderActionDialog = (order: Order) => {
    const action = actionConfig[order.orderStatus as keyof typeof actionConfig]
    if (!action) return null

    const ActionIcon = action.icon

    return (
      <Dialog open={dialogOpen === order.id} onOpenChange={(open) => !open && setDialogOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ActionIcon className="w-5 h-5 text-blue-600" />
              {action.label}
            </DialogTitle>
            <DialogDescription>
              {action.description}
            </DialogDescription>
            <div className="space-y-2">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium">Order: {order.poNumber}</div>
                <div className="text-sm text-gray-600">{order.customerName}</div>
                {order.projectName && (
                  <div className="text-sm text-gray-600">Project: {order.projectName}</div>
                )}
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Notes (optional)
              </label>
              <Textarea
                placeholder="Add any notes about the status update..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id={`notify-${order.id}`}
                checked={notifyAll}
                onCheckedChange={(checked) => setNotifyAll(checked as boolean)}
              />
              <label 
                htmlFor={`notify-${order.id}`} 
                className="text-sm cursor-pointer"
              >
                Notify all relevant users
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleStatusUpdate(order.id, action.action, notes)}
              disabled={actionLoading === order.id}
              className={action.color}
            >
              {actionLoading === order.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <ActionIcon className="w-4 h-4 mr-2" />
                  {action.label}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  if (actionableOrders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">All orders up to date</h3>
          <p className="text-gray-600 text-center">
            No orders require procurement status updates at this time.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Order Status Management</h3>
        <p className="text-sm text-gray-600">
          Update order status as parts are shipped and arrive
        </p>
      </div>

      <div className="grid gap-4">
        {actionableOrders.map((order) => {
          const currentStatus = statusConfig[order.orderStatus as keyof typeof statusConfig]
          const action = actionConfig[order.orderStatus as keyof typeof actionConfig]
          
          if (!currentStatus || !action) return null

          const StatusIcon = currentStatus.icon
          const ActionIcon = action.icon
          
          const wantDate = order.wantDate ? new Date(order.wantDate) : null
          const daysUntilDue = wantDate
            ? Math.ceil((wantDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : null
          const isUrgent = daysUntilDue !== null && daysUntilDue <= 7

          return (
            <Card key={order.id} className={`transition-all duration-200 hover:shadow-md ${isUrgent ? 'border-l-4 border-l-orange-500' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusIcon className="w-5 h-5 text-gray-600" />
                    <div>
                      <CardTitle className="text-lg">{order.poNumber}</CardTitle>
                      <p className="text-sm text-gray-600">{order.customerName}</p>
                      {order.projectName && (
                        <p className="text-xs text-gray-500">{order.projectName}</p>
                      )}
                    </div>
                    <Badge className={currentStatus.color}>
                      {currentStatus.label}
                    </Badge>
                    {isUrgent && (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Due in {daysUntilDue} days
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {wantDate && (
                      <div className="text-right text-sm text-gray-500">
                        <div>Due: {format(wantDate, "MMM dd, yyyy")}</div>
                        <div className="text-xs">
                          Build Numbers: {order.buildNumbers.join(', ')}
                        </div>
                      </div>
                    )}
                    <Button
                      onClick={() => openActionDialog(order.id)}
                      disabled={actionLoading === order.id}
                      className={action.color}
                    >
                      {actionLoading === order.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <ActionIcon className="w-4 h-4 mr-2" />
                      )}
                      {action.label}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {renderActionDialog(order)}
            </Card>
          )
        })}
      </div>
    </div>
  )
}