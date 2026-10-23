import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PurchaseOrderKanban } from '@/features/purchase-orders/components/purchase-order-kanban'
import type { PurchaseOrder } from '@/features/purchase-orders/types'

const mockOrders: PurchaseOrder[] = [
  {
    id: 'po-1',
    poNumber: 'PO-001',
    category: 'PURCHASE_ORDER',
    supplierName: 'PT Sumber Pangan',
    orderDate: '2026-10-20T00:00:00Z',
    status: 'PURCHASE_REQUEST',
    receiptStatus: 'NOT_RECEIVED',
    paymentStatus: 'UNPAID',
    items: [{ id: 'item-1', stockId: 's1', stockName: 'Tepung Terigu', quantity: 10, baseUnit: 'kg', unitPrice: 12000, totalPrice: 120000 }],
    totalAmount: 120000,
    attachments: [],
    completionAttachments: [],
    createdAt: '2026-10-20T00:00:00Z',
  },
  {
    id: 'po-2',
    poNumber: 'PO-002',
    category: 'PURCHASE_ORDER',
    supplierName: 'CV Makmur Sejahtera',
    orderDate: '2026-10-21T00:00:00Z',
    status: 'PURCHASE_ORDER',
    receiptStatus: 'NOT_RECEIVED',
    paymentStatus: 'UNPAID',
    items: [{ id: 'item-2', stockId: 's2', stockName: 'Gula Pasir', quantity: 5, baseUnit: 'kg', unitPrice: 15000, totalPrice: 75000 }],
    totalAmount: 75000,
    attachments: [],
    completionAttachments: [],
    createdAt: '2026-10-21T00:00:00Z',
  },
  {
    id: 'po-3',
    poNumber: 'PO-003',
    category: 'PURCHASE_ORDER',
    supplierName: 'UD Rukun',
    orderDate: '2026-10-22T00:00:00Z',
    status: 'PURCHASE_ORDER',
    receiptStatus: 'RECEIVED',
    paymentStatus: 'UNPAID',
    paymentDueDate: '2026-10-20T00:00:00Z', // past due
    items: [{ id: 'item-3', stockId: 's3', stockName: 'Mentega', quantity: 2, baseUnit: 'kg', unitPrice: 30000, totalPrice: 60000 }],
    totalAmount: 60000,
    attachments: [],
    completionAttachments: [],
    createdAt: '2026-10-22T00:00:00Z',
  },
  {
    id: 'po-4',
    poNumber: 'PO-004',
    category: 'PURCHASE_ORDER',
    supplierName: 'PT Sukses Mandiri',
    orderDate: '2026-10-22T00:00:00Z',
    status: 'COMPLETED',
    receiptStatus: 'RECEIVED',
    paymentStatus: 'PAID',
    items: [{ id: 'item-4', stockId: 's4', stockName: 'Ragi', quantity: 1, baseUnit: 'box', unitPrice: 50000, totalPrice: 50000 }],
    totalAmount: 50000,
    attachments: [],
    completionAttachments: [],
    createdAt: '2026-10-22T00:00:00Z',
  },
]

describe('PurchaseOrderKanban', () => {
  it('renders all 4 columns and distributes orders correctly', () => {
    render(
      <MemoryRouter>
        <PurchaseOrderKanban orders={mockOrders} canProcess={true} />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: 'Purchase Request' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Purchase Order' })).toBeInTheDocument()
    expect(screen.getByText('Barang Diterima')).toBeInTheDocument()
    expect(screen.getByText('Selesai')).toBeInTheDocument()

    expect(screen.getByText('PO-001')).toBeInTheDocument()
    expect(screen.getByText('PO-002')).toBeInTheDocument()
    expect(screen.getByText('PO-003')).toBeInTheDocument()
    expect(screen.getByText('PO-004')).toBeInTheDocument()

    expect(screen.getByText('Tempo Lewat')).toBeInTheDocument()
  })

  it('triggers action callbacks when clicking buttons', async () => {
    const user = userEvent.setup()
    const onApprove = vi.fn()
    const onReceive = vi.fn()
    const onPay = vi.fn()

    render(
      <MemoryRouter>
        <PurchaseOrderKanban
          orders={mockOrders}
          canProcess={true}
          onApprove={onApprove}
          onReceive={onReceive}
          onPay={onPay}
        />
      </MemoryRouter>
    )

    const approveBtn = screen.getByRole('button', { name: /setujui/i })
    await user.click(approveBtn)
    expect(onApprove).toHaveBeenCalledWith(mockOrders[0])

    const receiveBtn = screen.getByRole('button', { name: /terima barang/i })
    await user.click(receiveBtn)
    expect(onReceive).toHaveBeenCalledWith(mockOrders[1])

    const payBtn = screen.getByRole('button', { name: /tandai lunas/i })
    await user.click(payBtn)
    expect(onPay).toHaveBeenCalledWith(mockOrders[2])
  })
})
