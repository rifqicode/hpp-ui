import * as React from "react"
import {
  UploadCloud,
  X,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Camera,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/ui/user-avatar"
import { recipeService } from "@/features/recipes/services/recipe-service"

interface ProfilePhotoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentAvatarUrl?: string
  userName?: string
  onSave: (newUrl: string) => Promise<void>
}

// Client-side image compression to base64 WebP/JPEG fallback
async function compressImageToDataUrl(file: File, maxSize = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width)
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height)
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve(e.target?.result as string)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85)
        resolve(dataUrl)
      }
      img.onerror = () => reject(new Error("Gagal membaca gambar"))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error("Gagal memuat file"))
    reader.readAsDataURL(file)
  })
}

export function ProfilePhotoDialog({
  open,
  onOpenChange,
  currentAvatarUrl,
  userName = "User",
  onSave,
}: ProfilePhotoDialogProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(currentAvatarUrl || null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedFile(null)
      setPreviewUrl(currentAvatarUrl || null)
      setError(null)
    }
    onOpenChange(newOpen)
  }

  const handleFile = (file: File) => {
    setError(null)

    const validTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      setError("Format file tidak didukung. Harap pilih gambar JPG, PNG, atau WebP.")
      return
    }

    const maxSizeBytes = 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      setError("Ukuran gambar melebihi 5MB. Silakan pilih gambar yang lebih kecil.")
      return
    }

    setSelectedFile(file)
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleSave = async () => {
    if (!selectedFile && previewUrl === currentAvatarUrl) {
      handleOpenChange(false)
      return
    }

    try {
      setIsUploading(true)
      setError(null)

      let finalUrl = ""

      if (selectedFile) {
        try {
          // Attempt upload via S3 presigned URL
          finalUrl = await recipeService.uploadProductImage(selectedFile)
        } catch {
          // Fallback to high-quality compressed client-side data URL
          finalUrl = await compressImageToDataUrl(selectedFile, 400)
        }
      } else if (!previewUrl) {
        // User removed the photo
        finalUrl = ""
      }

      await onSave(finalUrl)
      handleOpenChange(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan foto profil."
      setError(msg)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemovePhoto = async () => {
    try {
      setIsUploading(true)
      setError(null)
      await onSave("")
      handleOpenChange(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus foto profil."
      setError(msg)
    } finally {
      setIsUploading(false)
    }
  }

  const activeDisplayUrl = previewUrl || undefined

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Camera className="size-5 text-primary" />
            <span>Foto Profil Pengguna</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Pilih foto untuk profil akun Anda.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4 py-2">
          {/* Avatar Preview Row */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <UserAvatar
              src={activeDisplayUrl}
              name={userName}
              className="size-16 sm:size-20 border-2 border-primary/20 shadow-md"
              fallbackClassName="text-xl sm:text-2xl"
            />
            <div className="space-y-1 min-w-0 flex-1">
              <span className="font-bold text-sm text-foreground block truncate">
                {userName}
              </span>
              {activeDisplayUrl && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                  <CheckCircle2 className="size-3" aria-hidden="true" />Foto Kustom Aktif
                </span>
              )}
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0])
              }
            }}
          />

          {/* Drag & Drop File Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              isDragging
                ? "border-primary bg-indigo-50/60 scale-[0.99]"
                : "border-slate-200 hover:border-primary/50 hover:bg-slate-50/60"
            }`}
          >
            <div className="size-10 rounded-full bg-indigo-50 text-primary flex items-center justify-center shadow-xs">
              <UploadCloud className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">
                Klik untuk memilih foto atau seret ke sini
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Mendukung file JPG, PNG, atau WebP (maksimal 5MB)
              </p>
            </div>

            {selectedFile && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedFile(null)
                    setPreviewUrl(currentAvatarUrl || null)
                  }}
                  className="hover:text-emerald-900"
                >
                  <X className="size-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between border-t border-slate-100 pt-3">
          {currentAvatarUrl ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemovePhoto}
              disabled={isUploading}
              className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 w-full sm:w-auto"
            >
              <Trash2 className="mr-1.5 size-3.5" />
              Gunakan Avatar Standar
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isUploading || (!selectedFile && previewUrl === currentAvatarUrl)}
              className="text-xs font-bold bg-primary hover:bg-primary/90 text-white"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Foto"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
