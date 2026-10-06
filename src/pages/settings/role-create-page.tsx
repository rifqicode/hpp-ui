import { useNavigate } from "react-router-dom"
import { ArrowLeft, ShieldCheck, Layers, AlertCircle, Loader2, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { useRoleForm } from "@/features/settings/hooks"
import { PERMISSION_GROUP_INFO } from "@/features/settings/constants"

export default function RoleCreatePage() {
  const navigate = useNavigate()
  const {
    isEditMode,
    existingRole,
    loading,
    permissionsCatalog,
    roleData,
    setRoleData,
    isSubmitting,
    formError,
    handleSubmit,
    togglePermission,
    toggleGroupPermissions,
    handleSelectAllPermissions,
    handleClearAllPermissions,
  } = useRoleForm()

  const backToRoles = () => navigate("/settings/store?tab=roles")

  return (
    <div className="w-full space-y-4">
      <Button variant="ghost" size="sm" onClick={backToRoles} className="rounded-xl text-xs -ml-2">
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Kembali ke Peran
      </Button>

      <Card className="rounded-2xl">
        <CardHeader className="border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">
                {isEditMode ? `Edit Peran: ${existingRole?.name || "..."}` : "Tambah Peran & Hak Akses Baru"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isEditMode
                  ? "Perbarui nama, deskripsi, dan pilihan hak akses modul untuk peran ini."
                  : "Buat peran khusus dan tentukan izin modul apa saja yang dapat diakses oleh staf."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {formError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-muted-foreground text-xs">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Memuat data peran &amp; katalog izin...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="pt-4 space-y-4">
              {/* Form Input Peran */}
              <div className="space-y-1.5">
                <Label htmlFor="role-display-name" className="text-xs font-semibold">
                  Nama Peran <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="role-display-name"
                  value={roleData.displayName}
                  onChange={(e) => {
                    const val = e.target.value
                    setRoleData((prev) => ({
                      ...prev,
                      displayName: val,
                      name: val.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_").replace(/_+/g, "_"),
                    }))
                  }}
                  placeholder="Contoh: Supervisor Toko, Kepala Dapur, Barista"
                  className="rounded-xl text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role-description" className="text-xs font-semibold">
                  Deskripsi Peran
                </Label>
                <Textarea
                  id="role-description"
                  value={roleData.description}
                  onChange={(e) =>
                    setRoleData({ ...roleData, description: e.target.value })
                  }
                  placeholder="Jelaskan ruang lingkup wewenang dan tanggung jawab peran ini..."
                  className="rounded-xl text-xs min-h-[60px]"
                />
              </div>

              {/* Permissions Selector Header */}
              <div className="pt-2 border-t border-border/60">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2">
                  <div>
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-primary" />
                      <span>
                        Pilih Hak Akses &amp; Izin Modul ({roleData.permissionCodes.length} /{" "}
                        {permissionsCatalog.length})
                      </span>
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Centang izin yang diberikan kepada staf dengan peran ini.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllPermissions}
                      className="text-[11px] h-7 px-2.5 rounded-lg border-primary/30 text-primary hover:bg-primary/5"
                    >
                      Pilih Semua
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAllPermissions}
                      className="text-[11px] h-7 px-2.5 rounded-lg text-muted-foreground hover:text-foreground"
                    >
                      Hapus Semua
                    </Button>
                  </div>
                </div>

                {/* Permissions By Group */}
                <div className="space-y-3.5 mt-2">
                  {Object.entries(
                    permissionsCatalog.reduce((acc, p) => {
                      acc[p.group] = acc[p.group] || []
                      acc[p.group].push(p)
                      return acc
                    }, {} as Record<string, typeof permissionsCatalog>)
                  ).map(([grp, perms]) => {
                    const allGroupSelected =
                      perms.length > 0 &&
                      perms.every((p) => roleData.permissionCodes.includes(p.code))
                    const selectedInGroupCount = perms.filter((p) =>
                      roleData.permissionCodes.includes(p.code)
                    ).length
                    const groupInfo = PERMISSION_GROUP_INFO[grp]

                    return (
                      <div
                        key={grp}
                        className={`rounded-2xl border p-3.5 space-y-3 transition-all ${
                          selectedInGroupCount > 0
                            ? "border-primary/40 bg-primary/[0.03] shadow-xs"
                            : "border-border/70 bg-muted/20"
                        }`}
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-border/50">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-foreground">
                                {groupInfo?.label || grp}
                              </span>
                              {selectedInGroupCount > 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold shadow-xs">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                                  {selectedInGroupCount} dipilih
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {groupInfo?.desc || "Daftar hak akses modul sistem"}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleGroupPermissions(grp, !allGroupSelected)}
                            className={`text-[10px] h-6 px-2.5 rounded-md font-semibold transition-colors ${
                              allGroupSelected
                                ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                                : "text-primary hover:text-primary hover:bg-primary/10"
                            }`}
                          >
                            {allGroupSelected ? "Batalkan Grup" : "Pilih Semua Modul Ini"}
                          </Button>
                        </div>

                        <div className="grid gap-2.5 sm:grid-cols-2">
                          {perms.map((p) => {
                            const isChecked = roleData.permissionCodes.includes(p.code)
                            return (
                              <div
                                key={p.id || p.code}
                                onClick={() => togglePermission(p.code)}
                                className={`relative p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 flex items-start gap-3 select-none ${
                                  isChecked
                                    ? "bg-primary/15 border-primary ring-2 ring-primary shadow-md shadow-primary/25 scale-[1.015] z-10 text-foreground"
                                    : "bg-card border-border/70 hover:border-border hover:bg-muted/40 opacity-70 hover:opacity-100 text-muted-foreground"
                                }`}
                              >
                                {/* Glowing Checkbox Indicator */}
                                <div className="pt-0.5 shrink-0">
                                  <div
                                    className={`h-5 w-5 rounded-lg flex items-center justify-center transition-all ${
                                      isChecked
                                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary ring-2 ring-primary/40"
                                        : "border-2 border-muted-foreground/30 bg-background"
                                    }`}
                                  >
                                    {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                  </div>
                                </div>

                                {/* Content Details */}
                                <div className="space-y-1 min-w-0 flex-1">
                                  <span
                                    className={`text-xs block leading-tight transition-colors ${
                                      isChecked ? "text-primary font-bold" : "text-foreground font-semibold"
                                    }`}
                                  >
                                    {p.name}
                                  </span>

                                  <p
                                    className={`text-[10px] leading-snug line-clamp-2 transition-colors ${
                                      isChecked ? "text-foreground font-medium" : "text-muted-foreground"
                                    }`}
                                  >
                                    {p.description || "Akses fungsional sistem"}
                                  </p>

                                  <div className="pt-0.5">
                                    <span
                                      className={`inline-block font-mono text-[9px] px-1.5 py-0.5 rounded transition-all ${
                                        isChecked
                                          ? "bg-primary/25 text-primary border border-primary/40 font-bold"
                                          : "bg-muted text-muted-foreground"
                                      }`}
                                    >
                                      {p.code}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>

            <div className="p-4 border-t border-border/60 bg-muted/20 flex justify-end gap-2 rounded-b-2xl">
              <Button type="button" variant="outline" onClick={backToRoles} className="rounded-xl text-xs" disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" className="rounded-xl text-xs font-semibold" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "Simpan Perubahan" : "Simpan Peran Baru"}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}
