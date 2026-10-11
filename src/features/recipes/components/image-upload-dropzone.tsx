import * as React from "react"
import { UploadCloud, X, Image as ImageIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { recipeService } from "@/features/recipes/services/recipe-service"

interface ImageUploadDropzoneProps {
  value?: string | null
  onChange: (url: string | null) => void
  disabled?: boolean
}

export function ImageUploadDropzone({
  value,
  onChange,
  disabled = false,
}: ImageUploadDropzoneProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const handleFile = async (file: File) => {
    setError(null)

    // Validation: JPG, PNG, WebP
    const validTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      setError("Format file tidak didukung. Harap upload gambar JPG, PNG, atau WebP.")
      return
    }

    // Validation: <= 5MB
    const maxSizeBytes = 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      setError("Ukuran gambar melebihi 5MB. Silakan kompres gambar terlebih dahulu.")
      return
    }

    try {
      setIsUploading(true)
      const uploadedUrl = await recipeService.uploadProductImage(file)
      onChange(uploadedUrl)
    } catch (err: unknown) {
      console.error("Gagal mengupload gambar:", err)
      const msg = err instanceof Error ? err.message : "Gagal mengupload gambar ke server. Silakan coba lagi."
      setError(msg)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !isUploading) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled || isUploading) return

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
    // reset input so user can pick the same file again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled || isUploading}
        onChange={handleInputChange}
      />

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center h-48 w-full">
          <img
            src={value}
            alt="Product Preview"
            className="w-full h-full object-contain"
          />
          {!disabled && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="h-8 rounded-lg text-xs"
              >
                Ganti Foto
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onChange(null)}
                disabled={isUploading}
                className="h-8 rounded-lg text-xs"
              >
                <X className="h-4 w-4 mr-1" /> Hapus
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && !isUploading) {
              fileInputRef.current?.click()
            }
          }}
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-slate-300 hover:border-primary/60 hover:bg-slate-50/60"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-primary py-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-xs font-semibold">Mengupload foto ke S3 storage...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center py-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1">
                {isDragging ? <UploadCloud className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  <span className="text-primary hover:underline">Klik untuk unggah</span> atau seret file gambar ke sini
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  JPG, PNG, atau WebP (Maks. 5 MB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  )
}
