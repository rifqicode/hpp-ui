import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { settingsService } from "../services/settings-service"
import { useAuthStore } from "@/store/use-auth-store"
import type { CreateRoleInput, Permission, Role } from "../types"

export function useRoleForm() {
  const navigate = useNavigate()
  const { id: roleId } = useParams<{ id?: string }>()
  const isEditMode = Boolean(roleId)

  const activeStoreId = useAuthStore((s) => s.activeStoreId)

  const [permissionsCatalog, setPermissionsCatalog] = React.useState<Permission[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [existingRole, setExistingRole] = React.useState<Role | null>(null)

  const [roleData, setRoleData] = React.useState<CreateRoleInput>({
    name: "",
    displayName: "",
    description: "",
    permissionCodes: [],
  })

  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)
  const [formError, setFormError] = React.useState<string>("")

  // Load catalog & (if edit mode) existing role
  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    setFormError("")

    const loadData = async () => {
      try {
        const catalogPromise = settingsService.getPermissionsCatalog(activeStoreId ?? undefined)
        const rolePromise = roleId
          ? settingsService.getRoleById(roleId, activeStoreId ?? undefined)
          : Promise.resolve(null)

        const [catalog, role] = await Promise.all([catalogPromise, rolePromise])

        if (cancelled) return

        setPermissionsCatalog(catalog)

        if (roleId) {
          if (!role) {
            setFormError("Peran tidak ditemukan atau telah dihapus.")
          } else {
            setExistingRole(role)
            setRoleData({
              name: role.name,
              displayName: role.name,
              description: role.description || "",
              permissionCodes: (role.permissions || []).map((p) => p.code),
            })
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setFormError(err instanceof Error ? err.message : "Gagal memuat data peran.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [roleId, activeStoreId])

  const togglePermission = (code: string) => {
    setRoleData((prev) => {
      const exists = prev.permissionCodes.includes(code)
      return {
        ...prev,
        permissionCodes: exists
          ? prev.permissionCodes.filter((c) => c !== code)
          : [...prev.permissionCodes, code],
      }
    })
  }

  const toggleGroupPermissions = (group: string, selectAll: boolean) => {
    const groupPermCodes = permissionsCatalog.filter((p) => p.group === group).map((p) => p.code)
    setRoleData((prev) => ({
      ...prev,
      permissionCodes: selectAll
        ? Array.from(new Set([...prev.permissionCodes, ...groupPermCodes]))
        : prev.permissionCodes.filter((code) => !groupPermCodes.includes(code)),
    }))
  }

  const handleSelectAllPermissions = () => {
    setRoleData((prev) => ({ ...prev, permissionCodes: permissionsCatalog.map((p) => p.code) }))
  }

  const handleClearAllPermissions = () => {
    setRoleData((prev) => ({ ...prev, permissionCodes: [] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roleData.displayName.trim()) {
      setFormError("Nama tampilan peran wajib diisi.")
      return
    }
    if (roleData.permissionCodes.length === 0) {
      setFormError("Pilih minimal satu hak akses/izin untuk peran ini.")
      return
    }

    setIsSubmitting(true)
    setFormError("")

    try {
      if (isEditMode && roleId) {
        await settingsService.updateRole(
          roleId,
          {
            name: roleData.displayName.trim(),
            description: roleData.description?.trim() || "",
            permission_codes: roleData.permissionCodes,
          },
          activeStoreId ?? undefined
        )
      } else {
        const roleName =
          roleData.name.trim() ||
          roleData.displayName.trim().toUpperCase().replace(/\s+/g, "_")

        await settingsService.createRole(
          {
            ...roleData,
            name: roleName,
          },
          activeStoreId ?? undefined
        )
      }

      navigate("/settings/store?tab=roles", { replace: true })
    } catch (err: unknown) {
      setFormError(
        err instanceof Error
          ? err.message
          : isEditMode
          ? "Gagal memperbarui peran."
          : "Gagal menambahkan peran baru."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    isEditMode,
    roleId,
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
  }
}

// Backward compatibility alias
export const useCreateRole = useRoleForm
