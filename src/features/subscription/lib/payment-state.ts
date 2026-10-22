import { create } from 'zustand'

export type PaymentPhase = 'idle' | 'opening' | 'waiting' | 'verifying' | 'confirmed' | 'error'

interface PaymentState {
  scope: string
  invoiceId: string | null
  phase: PaymentPhase
  message: string
  pollUntil: number
  welcomeInvoiceId: string | null
  isChecking?: boolean
}

export const idlePayment: PaymentState = {
  scope: '', invoiceId: null, phase: 'idle', message: '', pollUntil: 0, welcomeInvoiceId: null, isChecking: false,
}

export const usePaymentState = create<PaymentState & {
  update: (value: Partial<PaymentState> & { scope: string }) => void
}>((set) => ({
  ...idlePayment,
  update: (value) => set((state) => ({ ...(state.scope === value.scope ? state : idlePayment), ...value })),
}))
