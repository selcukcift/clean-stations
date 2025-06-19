import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import { SimpleBOMApproval } from '@/components/procurement/SimpleBOMApproval'
import { nextJsApiClient } from '@/lib/api'

// Mock the API client
const mockGet = jest.fn()
const mockPost = jest.fn()
const mockPut = jest.fn()

jest.mock('@/lib/api', () => ({
  nextJsApiClient: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
  }
}))

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}))

const mockOrders = [
  {
    id: 'order-1',
    poNumber: 'PO-2024-001',
    customerName: 'Test Customer',
    orderStatus: 'ORDER_CREATED',
    wantDate: '2024-12-25T00:00:00Z',
    createdAt: '2024-12-01T00:00:00Z'
  },
  {
    id: 'order-2', 
    poNumber: 'PO-2024-002',
    customerName: 'Another Customer',
    orderStatus: 'ORDER_CREATED',
    wantDate: '2024-12-30T00:00:00Z',
    createdAt: '2024-12-02T00:00:00Z'
  }
]

const mockBOMData = [
  {
    id: 'assembly-1',
    name: 'Test Assembly',
    partNumber: 'ASM-001',
    quantity: 1,
    type: 'ASSEMBLY',
    children: [
      {
        id: 'part-1',
        name: 'Test Part',
        partNumber: 'PART-001', 
        quantity: 2,
        type: 'PART'
      }
    ]
  }
]

describe('SimpleBOMApproval', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock successful orders fetch
    mockGet.mockResolvedValue({
      data: {
        success: true,
        data: mockOrders
      }
    })
  })

  it('renders the component with pending orders', async () => {
    render(<SimpleBOMApproval />)
    
    expect(screen.getByText('Loading orders...')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('BOM Management')).toBeInTheDocument()
      expect(screen.getByText('Pending Approval (2)')).toBeInTheDocument()
    })
  })

  it('displays order cards with correct information', async () => {
    render(<SimpleBOMApproval />)
    
    await waitFor(() => {
      expect(screen.getByText('PO-2024-001')).toBeInTheDocument()
      expect(screen.getByText('Test Customer')).toBeInTheDocument()
      expect(screen.getByText('PO-2024-002')).toBeInTheDocument()
      expect(screen.getByText('Another Customer')).toBeInTheDocument()
    })
  })

  it('allows selecting individual orders', async () => {
    render(<SimpleBOMApproval />)
    
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes).toHaveLength(3) // 2 order checkboxes + 1 select all
    })
    
    const orderCheckbox = screen.getAllByRole('checkbox')[1] // First order checkbox
    fireEvent.click(orderCheckbox)
    
    expect(screen.getByText('Approve Selected (1)')).toBeInTheDocument()
  })

  it('expands order to show BOM when View BOM is clicked', async () => {
    // Mock BOM generation
    mockPost.mockResolvedValue({
      data: {
        success: true,
        data: {
          bom: {
            hierarchical: mockBOMData
          }
        }
      }
    })
    
    render(<SimpleBOMApproval />)
    
    await waitFor(() => {
      const viewBOMButtons = screen.getAllByText('View BOM')
      fireEvent.click(viewBOMButtons[0])
    })
    
    await waitFor(() => {
      expect(screen.getByText('Bill of Materials')).toBeInTheDocument()
      expect(screen.getByText('Test Assembly')).toBeInTheDocument()
    })
  })

  it('approves a single order when approve button is clicked', async () => {
    mockPut.mockResolvedValue({
      data: {
        success: true
      }
    })
    
    render(<SimpleBOMApproval />)
    
    await waitFor(() => {
      const approveButtons = screen.getAllByRole('button', { name: /approve/i })
      const singleApproveButton = approveButtons.find(button => 
        !button.textContent?.includes('Selected')
      )
      if (singleApproveButton) {
        fireEvent.click(singleApproveButton)
      }
    })
    
    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith(
        '/orders/order-1/status',
        {
          newStatus: 'READY_FOR_PRE_QC',
          notes: 'BOM approved by procurement specialist'
        }
      )
    })
  })

  it('handles bulk approval of selected orders', async () => {
    mockPut.mockResolvedValue({
      data: {
        success: true
      }
    })
    
    render(<SimpleBOMApproval />)
    
    await waitFor(() => {
      // Select all orders
      const selectAllCheckbox = screen.getAllByRole('checkbox')[0]
      fireEvent.click(selectAllCheckbox)
    })
    
    await waitFor(() => {
      const bulkApproveButton = screen.getByText('Approve Selected (2)')
      fireEvent.click(bulkApproveButton)
    })
    
    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledTimes(2)
      expect(mockPut).toHaveBeenCalledWith(
        '/orders/order-1/status',
        {
          newStatus: 'READY_FOR_PRE_QC', 
          notes: 'BOM approved by procurement specialist'
        }
      )
      expect(mockPut).toHaveBeenCalledWith(
        '/orders/order-2/status',
        {
          newStatus: 'READY_FOR_PRE_QC',
          notes: 'BOM approved by procurement specialist'
        }
      )
    })
  })

  it('shows empty state when no orders are pending', async () => {
    mockGet.mockResolvedValue({
      data: {
        success: true,
        data: []
      }
    })
    
    render(<SimpleBOMApproval />)
    
    await waitFor(() => {
      expect(screen.getByText('All caught up!')).toBeInTheDocument()
      expect(screen.getByText('No orders are pending BOM approval at this time.')).toBeInTheDocument()
    })
  })

  it('shows all orders tab with complete order pool', async () => {
    const mixedOrders = [
      ...mockOrders,
      {
        id: 'order-3',
        poNumber: 'PO-2024-003',
        customerName: 'Approved Customer',
        orderStatus: 'READY_FOR_PRE_QC',
        wantDate: '2024-12-28T00:00:00Z',
        createdAt: '2024-12-03T00:00:00Z'
      }
    ]

    mockGet.mockResolvedValue({
      data: {
        success: true,
        data: mixedOrders
      }
    })

    render(<SimpleBOMApproval />)
    
    await waitFor(() => {
      // Click on "All Orders" tab
      const allOrdersTab = screen.getByText('All Orders (3)')
      fireEvent.click(allOrdersTab)
    })

    await waitFor(() => {
      // Should show all orders including approved ones
      expect(screen.getByText('PO-2024-001')).toBeInTheDocument()
      expect(screen.getByText('PO-2024-002')).toBeInTheDocument()
      expect(screen.getByText('PO-2024-003')).toBeInTheDocument()
      expect(screen.getByText('Approved Customer')).toBeInTheDocument()
    })
  })
})