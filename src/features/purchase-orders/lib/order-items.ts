import { getQuantityInBaseUnit } from '@/lib/units'
import type { CreatePOItemInput, PurchaseOrderCategory } from '../types'

export interface PurchaseOrderItemDraft {
  inputUnit?: string
  packageSize?: number
  stockId: string
  stockName: string
  quantity: string
  baseUnit: string
  totalPrice?: string
}

export function buildPurchaseOrderItems(items: PurchaseOrderItemDraft[], category: PurchaseOrderCategory): CreatePOItemInput[] {
  if (items.length === 0) throw new Error('Tambahkan minimal 1 item bahan baku')
  return items.map((item) => {
    if (!item.stockId || !item.stockName) throw new Error('Ada item bahan baku yang belum dipilih')
    const convertedQuantity = getQuantityInBaseUnit(Number(item.quantity), item.inputUnit, item.baseUnit, item.packageSize)
    const quantity = Math.round(convertedQuantity * 10000) / 10000
    if (!Number.isFinite(convertedQuantity) || quantity <= 0 || Math.abs(convertedQuantity - quantity) > 1e-9) {
      throw new Error(`Kuantitas untuk "${item.stockName}" harus positif, isi kemasan valid, dan maksimal 4 desimal satuan dasar`)
    }
    if (category === 'DIRECT_ORDER') {
      const total = Number(item.totalPrice)
      if (!Number.isFinite(total) || total <= 0 || Math.abs(total - Math.round(total * 10000) / 10000) > 1e-9 || Number((total / quantity).toFixed(4)) <= 0) {
        throw new Error(`Total harga faktur untuk "${item.stockName}" wajib positif, maksimal 4 desimal, dan menghasilkan harga satuan positif.`)
      }
      return { stock_id: item.stockId, quantity, total_price: total }
    }
    return { stock_id: item.stockId, quantity }
  })
}
