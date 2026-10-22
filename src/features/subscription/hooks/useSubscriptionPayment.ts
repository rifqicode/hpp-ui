import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/use-auth-store'
import { loadMidtransSnap, payWithSnap } from '@/lib/midtrans'
import { idlePayment, usePaymentState } from '../lib/payment-state'
import { subscriptionService } from '../services/subscriptionService'
import type { MidtransConfigData, SubscriptionInvoice } from '../types/subscription'
import { useInvoices } from './useInvoices'
import { subscriptionKeys, useSubscriptionUsage } from './useSubscriptionUsage'

const syncingInvoices = new Set<string>()

export function useSubscriptionPayment() {
  const userId = useAuthStore((state) => state.user?.id)
  const storeId = useAuthStore((state) => state.activeStoreId)
  const scope = `${userId}:${storeId}`
  const state = usePaymentState((value) => value.scope === scope ? value : idlePayment)
  const update = usePaymentState((value) => value.update)
  const client = useQueryClient()
  const { data: usage } = useSubscriptionUsage()
  const { data: invoices } = useInvoices()
  const invoice = invoices?.find((item) => item.id === state.invoiceId)

  useEffect(() => {
    if (!state.pollUntil) return
    const timer = window.setTimeout(() => {
      update({ scope, phase: 'waiting', pollUntil: 0, message: 'Konfirmasi pembayaran belum diterima. Anda dapat mengecek status lagi atau melanjutkan pekerjaan; tagihan tetap tersimpan.' })
    }, Math.max(0, state.pollUntil - Date.now()))
    return () => window.clearTimeout(timer)
  }, [scope, state.pollUntil, update])

  useEffect(() => {
    if (!invoice || state.pollUntil === 0) return
    if (invoice.status === 'PAID' && usage?.tier === invoice.tier && usage.status === 'ACTIVE'
      && usage.current_period_end && new Date(usage.current_period_end) >= new Date(invoice.billing_period_end)) {
      update({ scope, phase: 'confirmed', pollUntil: 0, message: 'Pembayaran terverifikasi. Paket dan masa aktif sudah diperbarui.' })
    } else if (['FAILED', 'CANCELLED', 'EXPIRED', 'CANCEL', 'DENY'].includes(invoice.status)) {
      update({ scope, phase: 'error', pollUntil: 0, message: 'Pembayaran tidak selesai. Periksa tagihan dan pilih paket kembali jika diperlukan.' })
    }
  }, [invoice, usage, scope, state.pollUntil, update])

  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: subscriptionKeys.invoices(userId, storeId) }),
      client.invalidateQueries({ queryKey: ['subscription-usage'] }),
    ])
  }

  const watch = (id: string, phase: 'waiting' | 'verifying', message: string, transactionId?: string) => {
    update({ scope, invoiceId: id, phase, message, pollUntil: Date.now() + 60_000 })
    void refresh()
    if (transactionId) {
      void checkStatus(id, transactionId)
    }
  }

  const checkStatus = async (selectedId?: string, transactionId?: string, silent?: boolean) => {
    const id = selectedId ?? state.invoiceId
    if (!id || syncingInvoices.has(id)) return
    syncingInvoices.add(id)
    if (!silent) {
      const currentMessage = state.invoiceId === id && state.phase === 'verifying' ? state.message : 'Sedang memeriksa konfirmasi pembayaran...'
      update({ scope, invoiceId: id, phase: 'verifying', isChecking: true, message: currentMessage, pollUntil: Date.now() + 60_000 })
    }
    try {
      const res = await subscriptionService.syncStatus(id, transactionId)
      const session = useAuthStore.getState()
      if (`${session.user?.id}:${session.activeStoreId}` !== scope) return

      if (res.invoice.status === 'PAID') {
        await refresh()
        update({
          scope,
          invoiceId: id,
          phase: 'confirmed',
          pollUntil: 0,
          message: 'Pembayaran terverifikasi. Paket dan masa aktif sudah diperbarui.',
        })
      } else if (!silent) {
        if (res.provider_status === 'not_found') {
          await refresh()
          update({
            scope,
            invoiceId: id,
            phase: 'waiting',
            pollUntil: 0,
            message: 'Transaksi belum ditemukan. Lanjutkan pembayaran atau coba cek kembali.',
          })
        } else if (res.invoice.status === 'PENDING' || res.provider_status === 'pending') {
          await refresh()
          update({
            scope,
            invoiceId: id,
            phase: 'waiting',
            pollUntil: 0,
            message: 'Pembayaran belum diterima. Selesaikan pembayaran lalu cek kembali.',
          })
        } else if (['FAILED', 'CANCELLED', 'EXPIRED', 'CANCEL', 'DENY'].includes(res.invoice.status)) {
          await refresh()
          update({
            scope,
            invoiceId: id,
            phase: 'error',
            pollUntil: 0,
            message: 'Pembayaran tidak selesai. Periksa tagihan dan pilih paket kembali jika diperlukan.',
          })
        } else {
          await refresh()
          update({
            scope,
            invoiceId: id,
            phase: 'waiting',
            pollUntil: 0,
            message: 'Status pembayaran diperbarui. Lanjutkan pembayaran atau coba cek kembali.',
          })
        }
      } else if (['FAILED', 'CANCELLED', 'EXPIRED', 'CANCEL', 'DENY'].includes(res.invoice.status)) {
        await refresh()
        update({
          scope,
          invoiceId: id,
          phase: 'error',
          pollUntil: 0,
          message: 'Pembayaran tidak selesai. Periksa tagihan dan pilih paket kembali jika diperlukan.',
        })
      }
    } catch (error: any) {
      if (!silent) {
        const session = useAuthStore.getState()
        if (`${session.user?.id}:${session.activeStoreId}` !== scope) return
        const msg = error?.response?.data?.message || (error instanceof Error ? error.message : 'Gagal memeriksa status pembayaran. Silakan coba lagi.')
        update({
          scope,
          invoiceId: id,
          phase: 'error',
          pollUntil: 0,
          message: msg,
        })
        void refresh()
      }
    } finally {
      syncingInvoices.delete(id)
      if (!silent) {
        update({ scope, isChecking: false })
      }
    }
  }

  const openInvoice = async (selected: SubscriptionInvoice, config?: MidtransConfigData) => {
    update({ scope, invoiceId: selected.id, phase: 'opening', message: 'Membuka pembayaran…', pollUntil: 0 })
    try {
      if (!selected.snap_token) throw new Error('Sesi pembayaran tidak tersedia. Gunakan tautan pembayaran di bawah jika tersedia.')
      const settings = config ?? await subscriptionService.getMidtransConfig()
      await loadMidtransSnap(settings.client_key, settings.is_production)
      const session = useAuthStore.getState()
      if (`${session.user?.id}:${session.activeStoreId}` !== scope) return
      update({ scope, phase: 'waiting', message: 'Selesaikan pembayaran di jendela pembayaran.' })
      payWithSnap(selected.snap_token, {
        onSuccess: (result: any) => {
          const transactionId = result?.transaction_id || (typeof result?.order_id === 'string' && result.order_id.startsWith('A12') ? result.order_id : undefined)
          watch(selected.id, 'verifying', 'Pembayaran diterima. Sedang memverifikasi aktivasi paket…', transactionId)
        },
        onPending: (result: any) => {
          const transactionId = result?.transaction_id || (typeof result?.order_id === 'string' && result.order_id.startsWith('A12') ? result.order_id : undefined)
          watch(selected.id, 'waiting', 'Pembayaran belum selesai. Instruksi pembayaran dapat dibuka kembali dari tagihan ini.', transactionId)
        },
        onClose: () => watch(selected.id, 'waiting', 'Jendela pembayaran ditutup. Tagihan tetap tersedia untuk dilanjutkan.'),
        onError: () => {
          update({ scope, invoiceId: selected.id, phase: 'error', message: 'Pembayaran belum berhasil. Periksa status tagihan sebelum mencoba lagi.', pollUntil: Date.now() + 60_000 })
          void refresh()
        },
      })
    } catch (error) {
      update({ scope, phase: 'error', message: error instanceof Error ? error.message : 'Pembayaran tidak dapat dibuka. Coba lagi dari tagihan.', pollUntil: 0 })
      void refresh()
    }
  }

  return { ...state, invoice, openInvoice, checkStatus, refresh }
}
