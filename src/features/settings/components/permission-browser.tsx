import * as React from "react"
import { Check, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { permissionGroupInfo } from "../constants"
import type { Permission } from "../types"

interface PermissionBrowserProps {
  permissions: readonly Permission[]
  selectedCodes?: readonly string[]
  onSelectionChange?: (codes: string[]) => void
  disabled?: boolean
}

export function PermissionBrowser({ permissions, selectedCodes = [], onSelectionChange, disabled = false }: PermissionBrowserProps) {
  const [search, setSearch] = React.useState("")
  const [group, setGroup] = React.useState("ALL")
  const [selectedOnly, setSelectedOnly] = React.useState(false)
  const editable = Boolean(onSelectionChange)
  const selected = new Set(selectedCodes)
  const searchId = React.useId()
  const modules = Array.from(new Set(permissions.map((permission) => permission.group)))
  const terms = search.trim().toLocaleLowerCase('id-ID').split(/\s+/).filter(Boolean)
  const visiblePermissions = permissions.filter((permission) => {
    const info = permissionGroupInfo(permission.group)
    const text = `${permission.name} ${permission.description ?? ""} ${permission.code} ${info.label}`.toLocaleLowerCase('id-ID')
    return (group === "ALL" || permission.group === group)
      && (!editable || !selectedOnly || selected.has(permission.code))
      && terms.every((term) => text.includes(term))
  })
  const groups = Object.entries(visiblePermissions.reduce<Record<string, Permission[]>>((result, permission) => {
    const items = result[permission.group] ??= []
    items.push(permission)
    return result
  }, {}))
  const hasFilters = Boolean(search.trim()) || group !== "ALL" || selectedOnly

  const changeSelection = (codes: string[], checked: boolean) => {
    const affected = new Set(codes)
    onSelectionChange?.(checked
      ? Array.from(new Set([...selectedCodes, ...codes]))
      : selectedCodes.filter((code) => !affected.has(code)))
  }

  const resetFilters = () => { setSearch(""); setGroup("ALL"); setSelectedOnly(false) }

  return (
    <div className="min-w-0 space-y-4">
      <fieldset disabled={disabled} aria-label={editable ? "Cari dan filter pilihan hak akses" : "Cari dan filter hak akses"} className="min-w-0 space-y-3">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_200px]">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" aria-hidden="true" />
            <Input id={searchId} aria-label="Cari hak akses" placeholder="Cari nama, deskripsi, atau kode izin..." value={search} onChange={(event) => setSearch(event.target.value)} className="h-11 pl-9 pr-11 text-sm" />
            {search && <button type="button" aria-label="Hapus pencarian izin" onClick={() => setSearch("")} className="absolute right-0 top-0 flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X className="size-4" /></button>}
          </div>
          <select aria-label="Modul hak akses" value={group} onChange={(event) => setGroup(event.target.value)} className="h-11 min-w-0 rounded-lg border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="ALL">Semua modul</option>
            {modules.map((module) => <option key={module} value={module}>{permissionGroupInfo(module).label}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <span role="status" className="text-xs text-muted-foreground">{visiblePermissions.length} izin ditampilkan{editable ? ` · ${selectedCodes.length} dipilih` : ""}</span>
            {editable && <label className="flex min-h-10 cursor-pointer items-center gap-2 text-xs"><input type="checkbox" checked={selectedOnly} onChange={(event) => setSelectedOnly(event.target.checked)} className="size-4 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />Hanya yang dipilih</label>}
            {hasFilters && <button type="button" onClick={resetFilters} className="min-h-10 rounded px-1 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Reset filter izin</button>}
          </div>
          {editable && <div className="flex items-center gap-1">
            <Button type="button" variant="outline" size="sm" disabled={visiblePermissions.length === 0 || visiblePermissions.every((permission) => selected.has(permission.code))} onClick={() => changeSelection(visiblePermissions.map((permission) => permission.code), true)} className="h-10 text-xs">Pilih hasil ({visiblePermissions.length})</Button>
            <Button type="button" variant="ghost" size="sm" disabled={selectedCodes.length === 0} onClick={() => onSelectionChange?.([])} className="h-10 text-xs text-muted-foreground">Kosongkan semua</Button>
          </div>}
        </div>
      </fieldset>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm font-medium">{permissions.length === 0 ? "Belum ada hak akses." : "Tidak ada hak akses yang cocok."}</p>
          <p className="mt-1 text-xs text-muted-foreground">{permissions.length === 0 ? "Daftar izin akan muncul di sini ketika tersedia." : "Coba kata kunci lain atau ubah filter modul."}</p>
        </div>
      ) : groups.map(([key, items]) => {
        const info = permissionGroupInfo(key)
        const selectedInGroup = items.filter((permission) => selected.has(permission.code)).length
        const allChecked = selectedInGroup === items.length
        return (
          <section key={key} aria-label={info.label} className="overflow-hidden rounded-xl border bg-card">
            <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-3 py-3 sm:px-4">
              <div className="min-w-0"><h3 className="text-sm font-semibold">{info.label}</h3>{info.desc && <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{info.desc}</p>}</div>
              {editable ? <label className="flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-md px-1 text-xs text-muted-foreground">
                <span>{selectedInGroup}/{items.length}</span>
                <input type="checkbox" checked={allChecked} ref={(element) => { if (element) element.indeterminate = selectedInGroup > 0 && !allChecked }} disabled={disabled}
                  aria-label={`Pilih semua izin yang tampil di ${info.label}`} onChange={(event) => changeSelection(items.map((permission) => permission.code), event.target.checked)}
                  className="size-4 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
              </label> : <span className="shrink-0 text-xs text-muted-foreground">{items.length} izin</span>}
            </div>
            <div className="divide-y">
              {items.map((permission) => {
                const checked = selected.has(permission.code)
                const contents = <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-5">{permission.name}</span>
                  {permission.description && <span className="mt-1 block text-xs leading-5 text-muted-foreground">{permission.description}</span>}
                  <span className="mt-1 block break-all font-mono text-[10px] text-muted-foreground">{permission.code}</span>
                </span>
                return editable ? (
                  <label key={permission.code} className={`flex cursor-pointer items-start gap-3 px-3 py-3 transition-colors sm:px-4 ${checked ? "bg-primary/5" : "hover:bg-muted/30"} ${disabled ? "cursor-wait opacity-60" : ""}`}>
                    <input type="checkbox" aria-label={permission.name} checked={checked} disabled={disabled} onChange={(event) => changeSelection([permission.code], event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                    {contents}
                  </label>
                ) : <div key={permission.code} className="flex items-start gap-3 px-3 py-3 sm:px-4"><Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />{contents}</div>
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
