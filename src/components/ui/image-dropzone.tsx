import * as React from 'react';
import { ImagePlus, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const ACCEPT_ATTR = '.png,.jpg,.jpeg,.webp';
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export interface ImageDropzoneProps {
  /** Current public image URL, if one is already stored. */
  value?: string;
  /** Uploads the file and resolves to the public URL of the stored image. */
  onUpload: (file: File) => Promise<string>;
  /** Called with the new public URL after upload, or an empty string after removal. */
  onChange: (url: string) => void;
  label?: string;
  disabled?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ImageDropzone({
  value,
  onUpload,
  onChange,
  label = 'Tarik & lepas gambar QRIS ke sini, atau klik untuk memilih file',
  disabled = false,
}: ImageDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [fileMeta, setFileMeta] = React.useState<{ name: string; size: number } | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file || disabled) return;
    setError('');
    if (!ACCEPTED_TYPES.includes(file.type.toLowerCase())) {
      setError('Format file tidak didukung. Gunakan PNG, JPG, JPEG, atau WEBP.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('Ukuran file melebihi batas 5 MB.');
      return;
    }
    setIsUploading(true);
    try {
      const url = await onUpload(file);
      setFileMeta({ name: file.name, size: file.size });
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah gambar.');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    setFileMeta(null);
    setError('');
    onChange('');
  };

  const openPicker = () => {
    if (!disabled && !isUploading) inputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />

      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
          <img
            src={value}
            alt="Gambar QRIS"
            className="size-20 shrink-0 rounded-lg border border-border bg-white object-contain p-1"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">
                {fileMeta?.name || value.split('/').pop()?.split('?')[0] || 'qris-image'}
              </p>
              {fileMeta && (
                <p className="text-[11px] text-muted-foreground">{formatFileSize(fileMeta.size)}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-[11px]"
                onClick={openPicker}
                disabled={disabled || isUploading}
              >
                {isUploading ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
                Ganti Gambar
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-[11px] text-destructive hover:text-destructive"
                onClick={handleRemove}
                disabled={disabled || isUploading}
              >
                <Trash2 className="size-3" />
                Hapus
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label={label}
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openPicker();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            void handleFile(e.dataTransfer.files?.[0]);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/50'
          } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          {isUploading ? (
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          ) : (
            <ImagePlus className="size-6 text-muted-foreground" />
          )}
          <p className="text-xs font-medium text-foreground">{isUploading ? 'Mengunggah gambar…' : label}</p>
          <p className="text-[11px] text-muted-foreground">PNG, JPG, JPEG, atau WEBP. Maksimal 5 MB.</p>
        </div>
      )}

      {error && (
        <p role="alert" className="text-[11px] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
