import * as React from 'react'
import { FileText, UploadCloud, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { purchaseOrderService } from '../services/po-service'
import { type POAttachment, PO_DOCUMENT_TYPES, MAX_PO_ATTACHMENTS, getAttachmentContentType } from '../lib/attachment'

interface Props {
  value: POAttachment[]
  onChange: (value: POAttachment[]) => void
  onUploadingChange: (uploading: boolean) => void
  disabled?: boolean
  purpose?: 'request' | 'completion'
}

export function POAttachmentUpload({ value, onChange, onUploadingChange, disabled, purpose = 'request' }: Props) {
  const inputId = React.useId()
  const [uploading, setUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [error, setError] = React.useState('')
  const [dragging, setDragging] = React.useState(false)
  const busyRef = React.useRef(false)

  async function upload(files: FileList | null) {
    if (!files?.length || disabled || busyRef.current) return
    const selected = Array.from(files)
    if (value.length + selected.length > MAX_PO_ATTACHMENTS) {
      setError(`Maksimal ${MAX_PO_ATTACHMENTS} dokumen lampiran. Hapus dokumen yang tidak diperlukan sebelum menambah lagi.`)
      return
    }
    try {
      selected.forEach(getAttachmentContentType)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dokumen tidak valid.')
      return
    }
    busyRef.current = true
    setError('')
    setProgress(0)
    setUploading(true)
    onUploadingChange(true)
    try {
      const uploaded = [...value]
      for (let index = 0; index < selected.length; index++) {
        const attachment = await purchaseOrderService.uploadAttachment(selected[index], (fileProgress) => {
          setProgress(Math.round((index * 100 + fileProgress) / selected.length))
        }, purpose)
        uploaded.push(attachment)
        onChange([...uploaded])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah dokumen. Silakan coba lagi.')
    } finally {
      busyRef.current = false
      setUploading(false)
      onUploadingChange(false)
    }
  }

  return <div className="space-y-3">
    <div
      className={cn('rounded-xl border-2 border-dashed p-5 transition-colors sm:p-6', dragging ? 'border-primary bg-primary/10' : 'border-primary/20 bg-primary/5')}
      onDragOver={(event) => { event.preventDefault(); if (!disabled && !uploading) setDragging(true) }}
      onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false) }}
      onDrop={(event) => { event.preventDefault(); setDragging(false); void upload(event.dataTransfer.files) }}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><UploadCloud className="size-5" /></div>
        <p className="text-sm font-medium">Tarik dokumen ke sini atau pilih dari perangkat</p>
        <p id={`${inputId}-help`} className="text-xs text-muted-foreground">PDF, Excel, atau Word · Maksimal 10MB per dokumen · Maksimal {MAX_PO_ATTACHMENTS} dokumen</p>
        <input id={inputId} type="file" multiple aria-label="Pilih lampiran purchase" accept={Object.keys(PO_DOCUMENT_TYPES).join(',')} className="sr-only" disabled={disabled || uploading || value.length >= MAX_PO_ATTACHMENTS}
          aria-describedby={`${inputId}-help`}
          onChange={(event) => { void upload(event.target.files); event.target.value = '' }} />
        <Button type="button" variant="outline" size="sm" className="mt-1" disabled={disabled || uploading || value.length >= MAX_PO_ATTACHMENTS}
          onClick={() => document.getElementById(inputId)?.click()}>
          {uploading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UploadCloud className="mr-2 size-4" />}
          {uploading ? 'Mengunggah...' : value.length ? 'Tambah dokumen' : 'Pilih dokumen'}
        </Button>
      </div>
      {uploading && <div role="status" className="mt-4 space-y-2">
        <Progress value={progress} aria-label="Progres upload dokumen" />
        <p className="text-center text-xs text-muted-foreground">{progress >= 100 ? 'Menyimpan dokumen...' : `Mengunggah dokumen ${progress}%`}</p>
      </div>}
    </div>
    {value.length > 0 && <p className="text-xs text-muted-foreground">{value.length} dari {MAX_PO_ATTACHMENTS} dokumen terlampir</p>}
    {value.map((attachment, index) => <div key={attachment.url} className="flex min-w-0 items-center gap-3 rounded-xl border bg-background p-3">
      <FileText className="size-5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium" title={attachment.name}>{attachment.name}</p><p className="text-xs text-muted-foreground">Dokumen terlampir</p></div>
      <Button type="button" variant="ghost" size="icon" aria-label={`Hapus lampiran ${attachment.name}`} disabled={disabled || uploading}
        onClick={() => { onChange(value.filter((_, itemIndex) => itemIndex !== index)); setError('') }}><X className="size-4" /></Button>
    </div>)}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>
}
