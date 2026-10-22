import type * as React from "react"
import { ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Role } from "../types"
import { PermissionBrowser } from "./permission-browser"

interface RolePermissionsDialogProps {
  role: Role | null
  onClose: () => void
  returnFocusTo: React.RefObject<HTMLElement | null>
}

export function RolePermissionsDialog({ role, onClose, returnFocusTo }: RolePermissionsDialogProps) {
  const permissions = role?.permissions ?? []
  return (
    <Dialog open={Boolean(role)} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[760px]" onCloseAutoFocus={(event) => {
        if (returnFocusTo.current?.isConnected) { event.preventDefault(); returnFocusTo.current.focus() }
      }}>
        <DialogHeader className="shrink-0 border-b px-4 py-4 pr-12 text-left sm:px-5">
          <div className="flex items-center gap-2"><ShieldCheck className="size-5 shrink-0 text-primary" aria-hidden="true" /><DialogTitle className="break-words text-base leading-6">Hak Akses: {role?.name}</DialogTitle></div>
          <DialogDescription className="text-xs leading-5">{role?.description || "Daftar tindakan yang diizinkan untuk anggota tim dengan peran ini."}</DialogDescription>
          <div className="flex flex-wrap items-center gap-2 pt-1"><Badge variant="secondary" className="text-[10px]">{role?.is_system ? "Bawaan sistem" : "Peran kustom"}</Badge><span className="text-xs text-muted-foreground">{permissions.length} izin · {new Set(permissions.map((permission) => permission.group)).size} modul</span></div>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {role && <PermissionBrowser key={role.id} permissions={permissions} />}
        </div>
        <DialogFooter className="shrink-0 border-t bg-muted/20 px-4 py-3 sm:px-5"><Button type="button" variant="outline" onClick={onClose} className="h-11 w-full text-xs sm:w-auto">Tutup</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
