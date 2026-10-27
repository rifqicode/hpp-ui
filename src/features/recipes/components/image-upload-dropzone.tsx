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
        hidden
        disabled={disabled || isUploading}
        onChange={handleInputChange}
      />

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center h-48 w-full">
          <img
            src={value}
            alt="Product Preview"
            className="w-full h-full object-contain"
          />
          {!disabled && (
            <div className="absolute inset-0 bg-black/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="h-11 rounded-lg text-xs"
              >
                Ganti Foto
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onChange(null)}
                disabled={isUploading}
                className="h-11 rounded-lg text-xs"
              >
                <X className="h-4 w-4 mr-1" /> Hapus
              </Button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          aria-label="Unggah foto produk"
          aria-busy={isUploading}
          disabled={disabled || isUploading}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && !isUploading) {
              fileInputRef.current?.click()
            }
          }}
          className={`w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl bg-card text-foreground cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-60 disabled:cursor-not-allowed ${
            isDragging
              ? "border-primary bg-accent"
              : "border-border enabled:hover:border-primary/60 enabled:hover:bg-accent"
          }`}
        >
          {isUploading ? (
            <span className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
              <span className="text-xs font-semibold">Mengunggah foto...</span>
            </span>
          ) : (
            <span className="flex flex-col items-center gap-2 text-center py-2">
              <span className="h-10 w-10 rounded-full bg-muted text-foreground flex items-center justify-center mb-1">
                {isDragging ? <UploadCloud className="h-5 w-5" aria-hidden="true" /> : <ImageIcon className="h-5 w-5" aria-hidden="true" />}
              </span>
              <span>
                <span className="block text-xs font-semibold text-foreground">
                  <span className="underline underline-offset-2">Klik untuk unggah</span> atau seret file gambar ke sini
                </span>
                <span className="block text-[11px] text-foreground mt-0.5">
                  JPG, PNG, atau WebP (Maks. 5 MB)
                </span>
              </span>
            </span>
          )}
        </button>
      )}

      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  )
}
