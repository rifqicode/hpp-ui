import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function StaffPasswordField({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold">Kata Sandi Staf <span className="text-destructive">*</span></Label>
      <div className="relative">
        <Input id={id} type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoComplete="new-password" minLength={8} maxLength={72} required aria-describedby={`${id}-hint`} className="h-11 pr-12 text-sm" />
        <button type="button" aria-label={visible ? "Sembunyikan kata sandi staf" : "Tampilkan kata sandi staf"} aria-pressed={visible} onClick={() => setVisible(!visible)} className="absolute right-0 top-0 flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      </div>
      <p id={`${id}-hint`} className="text-xs text-muted-foreground">Minimal 8 karakter. Bagikan kata sandi ini langsung kepada staf.</p>
    </div>
  )
}
