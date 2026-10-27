import { useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { APP_NAME } from "@/lib/utils"
import { ServiceAgreement } from "./service-agreement"
import type { ServiceAgreementDocument } from "../types"

interface RegistrationAgreementProps {
  document: ServiceAgreementDocument | null
  loading: boolean
  error: string
  onRetry: () => void
  hasRead: boolean
  agreed: boolean
  onReadComplete: () => void
  onAgreeChange: (agreed: boolean) => void
}

export function RegistrationAgreement({ document, loading, error, onRetry, hasRead, agreed, onReadComplete, onAgreeChange }: RegistrationAgreementProps) {
  const documentRef = useRef<HTMLDivElement>(null)
  const canAgree = Boolean(document && !loading && !error && hasRead)

  return (
    <div className="space-y-3 pt-1">
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            className="min-h-11 text-left text-sm font-semibold text-primary underline underline-offset-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Baca Ketentuan Layanan &amp; Kebijakan Privasi
          </button>
        </DialogTrigger>
        <DialogContent
          className="flex h-[85dvh] max-w-2xl flex-col gap-0 overflow-hidden bg-white p-0 text-slate-900 sm:p-0"
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            documentRef.current?.focus()
          }}
        >
          <DialogHeader className="shrink-0 border-b border-slate-200 px-5 py-4 pr-12 text-left sm:px-6 sm:pr-12">
            <DialogTitle className="text-lg leading-snug">{document?.title ?? "Ketentuan Layanan & Kebijakan Privasi"}</DialogTitle>
            <DialogDescription className="text-slate-600">
              Baca dokumen hingga bagian akhir untuk menyetujui ketentuan ini.
            </DialogDescription>
          </DialogHeader>
          <div
            ref={documentRef}
            role="region"
            aria-label="Dokumen Ketentuan Layanan dan Kebijakan Privasi"
            tabIndex={0}
            onScroll={(event) => {
              const { scrollTop, scrollHeight, clientHeight } = event.currentTarget
              if (document && !loading && !error && clientHeight > 0 && scrollTop + clientHeight >= scrollHeight - 4) {
                onReadComplete()
              }
            }}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:px-6"
          >
            {loading && <p role="status" className="text-sm text-slate-700">Memuat dokumen ketentuan...</p>}
            {error && (
              <div className="space-y-3">
                <p role="alert" className="text-sm text-rose-700">{error}</p>
                <Button type="button" variant="outline" onClick={onRetry}>Coba lagi</Button>
              </div>
            )}
            {document && !loading && !error && <ServiceAgreement document={document} />}
          </div>
          <div className="shrink-0 space-y-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
            <p role="status" className="text-sm text-slate-700">
              {loading
                ? "Tunggu hingga dokumen selesai dimuat sebelum memberikan persetujuan."
                : error
                ? "Dokumen belum berhasil dimuat. Coba lagi untuk membaca ketentuan."
                : canAgree
                ? "Anda sudah mencapai akhir dokumen. Klik tombol di bawah jika Anda setuju."
                : "Scroll ke bawah sampai akhir dokumen. Anda juga dapat menggunakan tombol Page Down atau End pada keyboard."}
            </p>
            <DialogClose asChild>
              <Button
                type="button"
                disabled={!canAgree}
                onClick={() => { if (canAgree) onAgreeChange(true) }}
                className="min-h-11 w-full sm:w-auto"
              >
                Selesai membaca dan setuju
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      <label className="flex min-h-11 items-start gap-2.5 text-xs leading-relaxed text-slate-700">
        <input
          id="agreeTerms"
          type="checkbox"
          required
          disabled={!canAgree}
          checked={agreed}
          aria-describedby={!hasRead ? "agreement-help" : undefined}
          onChange={(event) => onAgreeChange(canAgree && event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-400 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed"
        />
        <span>Saya telah membaca dan menyetujui {document?.title ?? "Ketentuan Layanan & Kebijakan Privasi"} {document?.app_name ?? APP_NAME}.</span>
      </label>
    </div>
  )
}
