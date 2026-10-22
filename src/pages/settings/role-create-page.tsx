import { useNavigate } from "react-router-dom"
import { ArrowLeft, ShieldCheck, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PermissionBrowser } from "@/features/settings/components/permission-browser"
import { useRoleForm } from "@/features/settings/hooks"

export default function RoleCreatePage() {
  const navigate = useNavigate()
  const {
    isEditMode, existingRole, loading, permissionsCatalog, roleData, setRoleData,
    isSubmitting, formError, handleSubmit,
  } = useRoleForm()
  const backToRoles = () => navigate("/settings/store?tab=roles")

  return (
    <div className="w-full min-w-0 space-y-4 pb-8">
      <header className="space-y-3">
        <Button variant="ghost" size="sm" onClick={backToRoles} disabled={isSubmitting} className="-ml-2 h-10 gap-1.5 text-xs"><ArrowLeft className="size-4" />Kembali ke Peran</Button>
        <div><h1 className="text-xl font-bold tracking-tight sm:text-2xl">{isEditMode ? `Edit Peran: ${existingRole?.name || "…"}` : "Tambah Peran & Hak Akses Baru"}</h1><p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">Beri nama peran, lalu pilih tindakan yang boleh dilakukan anggota tim.</p></div>
      </header>

      {formError && <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs leading-5 text-destructive"><AlertCircle className="mt-0.5 size-4 shrink-0" /><span>{formError}</span></div>}
      {loading ? (
        <div role="status" className="flex min-h-64 items-center justify-center gap-3 rounded-xl border bg-card text-sm text-muted-foreground"><Loader2 className="size-5 animate-spin motion-reduce:animate-none" />Memuat data peran & katalog izin...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="min-w-0 space-y-3 lg:sticky lg:top-0" aria-label="Informasi peran">
              <Card className="gap-0 border py-0 shadow-none ring-0">
                <CardHeader className="border-b px-4 py-4"><CardTitle className="text-sm">Informasi peran</CardTitle><CardDescription className="text-xs leading-5">Gunakan nama yang mudah dikenali tim.</CardDescription></CardHeader>
                <CardContent className="p-4">
                  <fieldset disabled={isSubmitting} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="role-display-name" className="text-xs font-medium">Nama Peran <span className="text-destructive">*</span></Label>
                      <Input id="role-display-name" value={roleData.displayName} onChange={(event) => {
                        const value = event.target.value
                        setRoleData((previous) => ({ ...previous, displayName: value, name: value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_").replace(/_+/g, "_") }))
                      }} placeholder="Nama peran, misalnya Kasir" required className="h-11 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="role-description" className="text-xs font-medium">Deskripsi Peran <span className="font-normal text-muted-foreground">(opsional)</span></Label>
                      <Textarea id="role-description" value={roleData.description} onChange={(event) => setRoleData((previous) => ({ ...previous, description: event.target.value }))} placeholder="Tanggung jawab anggota tim dengan peran ini" className="min-h-20 text-sm lg:min-h-28" rows={3} />
                    </div>
                  </fieldset>
                </CardContent>
              </Card>
              <div className="hidden items-start gap-3 rounded-xl border bg-card p-4 lg:flex">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><ShieldCheck className="size-4" aria-hidden="true" /></span>
                <div><p className="text-sm font-semibold" aria-live="polite">{roleData.permissionCodes.length} hak akses dipilih</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Pilihan tetap tersimpan saat pencarian atau filter modul berubah.</p></div>
              </div>
            </aside>

            <Card className="min-w-0 gap-0 border py-0 shadow-none ring-0">
              <CardHeader className="border-b px-4 py-4 sm:px-5"><CardTitle className="text-base">Pilih hak akses</CardTitle><CardDescription className="text-xs leading-5">Cari izin yang dibutuhkan. Centang satu per satu atau pilih izin yang ditampilkan dalam satu modul.</CardDescription></CardHeader>
              <CardContent className="p-4 sm:p-5">
                <PermissionBrowser permissions={permissionsCatalog} selectedCodes={roleData.permissionCodes} onSelectionChange={(permissionCodes) => setRoleData((previous) => ({ ...previous, permissionCodes }))} disabled={isSubmitting} />
              </CardContent>
            </Card>
          </div>
          <div className="z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3 sm:p-4 lg:sticky lg:bottom-0">
            <p className="text-xs text-muted-foreground">{roleData.permissionCodes.length} dari {permissionsCatalog.length} hak akses dipilih</p>
            <div className="flex w-full gap-2 sm:w-auto">
              <Button type="button" variant="outline" onClick={backToRoles} disabled={isSubmitting} className="h-11 flex-1 text-xs sm:flex-none">Batal</Button>
              <Button type="submit" disabled={isSubmitting || permissionsCatalog.length === 0 || (isEditMode && !existingRole)} className="h-11 flex-1 gap-2 text-xs sm:flex-none">{isSubmitting && <Loader2 className="size-4 animate-spin" />}{isEditMode ? "Simpan Perubahan" : "Simpan Peran Baru"}</Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
