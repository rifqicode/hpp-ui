import * as React from "react"
import { useAuthStore } from "@/store/use-auth-store"
import { settingsService } from "@/features/settings/services/settings-service"
import type { StoreInfo, StaffMember, StaffRole, Role, Permission, CreateRoleInput } from "@/features/settings/types"

export function useStoreSettings() {
  const setActiveStoreId = useAuthStore((state) => state.setActiveStoreId)

  const [loading, setLoading] = React.useState<boolean>(true)
  const [store, setStore] = React.useState<StoreInfo | null>(null)
  const [storesList, setStoresList] = React.useState<StoreInfo[]>([])
  const [staffList, setStaffList] = React.useState<StaffMember[]>([])
  const [rolesList, setRolesList] = React.useState<Role[]>([])
  const [permissionsCatalog, setPermissionsCatalog] = React.useState<Permission[]>([])

  // Store Profile Form State
  const [formData, setFormData] = React.useState<{
    name: string
    category: string
    location: string
    phone: string
    description: string
  }>({
    name: "",
    category: "Bakery & Pastry",
    location: "",
    phone: "",
    description: "",
  })
  const [isSavingProfile, setIsSavingProfile] = React.useState<boolean>(false)
  const [profileSuccessMsg, setProfileSuccessMsg] = React.useState<string>("")
  const [profileErrorMsg, setProfileErrorMsg] = React.useState<string>("")

  // Invite Staff Modal State
  const [isInviteOpen, setIsInviteOpen] = React.useState<boolean>(false)
  const [inviteData, setInviteData] = React.useState<{
    name: string
    email: string
    role: StaffRole
  }>({
    name: "",
    email: "",
    role: "STAFF",
  })
  const [isInviting, setIsInviting] = React.useState<boolean>(false)
  const [inviteError, setInviteError] = React.useState<string>("")

  // Revoke Staff Modal State
  const [revokingStaff, setRevokingStaff] = React.useState<StaffMember | null>(null)
  const [isRevoking, setIsRevoking] = React.useState<boolean>(false)

  // Create New Store Modal State
  const [isNewStoreOpen, setIsNewStoreOpen] = React.useState<boolean>(false)
  const [newStoreData, setNewStoreData] = React.useState<{
    name: string
    category: string
    location: string
    phone: string
    description: string
  }>({
    name: "",
    category: "Bakery & Pastry",
    location: "",
    phone: "",
    description: "",
  })
  const [isCreatingStore, setIsCreatingStore] = React.useState<boolean>(false)
  const [createStoreError, setCreateStoreError] = React.useState<string>("")

  // Create Role Modal State
  const [isCreateRoleOpen, setIsCreateRoleOpen] = React.useState<boolean>(false)
  const [newRoleData, setNewRoleData] = React.useState<CreateRoleInput>({
    name: "",
    displayName: "",
    description: "",
    permissionCodes: [],
  })
  const [isCreatingRole, setIsCreatingRole] = React.useState<boolean>(false)
  const [createRoleError, setCreateRoleError] = React.useState<string>("")
  const [selectedRoleDetail, setSelectedRoleDetail] = React.useState<Role | null>(null)

  // Load all store data
  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [currentStore, allStores, staff, roles, perms] = await Promise.all([
        settingsService.getStoreProfile(),
        settingsService.getStoresList(),
        settingsService.getStaffList(),
        settingsService.getRolesList(),
        settingsService.getPermissionsCatalog(),
      ])
      setStore(currentStore)
      setStoresList(allStores)
      setStaffList(staff)
      setRolesList(roles)
      setPermissionsCatalog(perms)
      setFormData({
        name: currentStore.name || "",
        category: currentStore.category || "Bakery & Pastry",
        location: currentStore.location || "",
        phone: currentStore.phone || "",
        description: currentStore.description || "",
      })
    } catch (err) {
      console.error("Failed to load store settings:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  // Save Store Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setProfileErrorMsg("Nama toko wajib diisi.")
      return
    }

    setIsSavingProfile(true)
    setProfileSuccessMsg("")
    setProfileErrorMsg("")
    try {
      const updated = await settingsService.updateStoreProfile(formData)
      setStore(updated)
      setProfileSuccessMsg("Informasi profil toko berhasil diperbarui!")
      const updatedList = await settingsService.getStoresList()
      setStoresList(updatedList)
      setTimeout(() => setProfileSuccessMsg(""), 4000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui profil toko."
      setProfileErrorMsg(msg)
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Invite Staff
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteData.email.trim() || !inviteData.name.trim()) {
      setInviteError("Nama dan alamat email staf wajib diisi.")
      return
    }

    setIsInviting(true)
    setInviteError("")
    try {
      await settingsService.inviteStaff(inviteData)
      setIsInviteOpen(false)
      setInviteData({ name: "", email: "", role: "STAFF" })
      const updated = await settingsService.getStaffList()
      setStaffList(updated)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengundang staf."
      setInviteError(msg)
    } finally {
      setIsInviting(false)
    }
  }

  // Confirm Revoke Staff
  const handleConfirmRevoke = async () => {
    if (!revokingStaff) return
    setIsRevoking(true)
    try {
      await settingsService.revokeStaff(revokingStaff.userId || revokingStaff.id)
      setRevokingStaff(null)
      const updated = await settingsService.getStaffList()
      setStaffList(updated)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mencabut akses staf."
      alert(msg)
    } finally {
      setIsRevoking(false)
    }
  }

  // Create Branch Store
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStoreData.name.trim()) {
      setCreateStoreError("Nama cabang/toko wajib diisi.")
      return
    }

    setIsCreatingStore(true)
    setCreateStoreError("")
    try {
      await settingsService.createStore(newStoreData)
      setIsNewStoreOpen(false)
      setNewStoreData({
        name: "",
        category: "Bakery & Pastry",
        location: "",
        phone: "",
        description: "",
      })
      const updated = await settingsService.getStoresList()
      setStoresList(updated)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membuat cabang toko."
      setCreateStoreError(msg)
    } finally {
      setIsCreatingStore(false)
    }
  }

  // Switch Active Store
  const handleSwitchStore = async (storeId: string) => {
    try {
      const switched = await settingsService.switchStore(storeId)
      setStore(switched)
      setActiveStoreId(switched.id)
      setFormData({
        name: switched.name,
        category: switched.category,
        location: switched.location,
        phone: switched.phone || "",
        description: switched.description || "",
      })
      const [updatedStores, staff] = await Promise.all([
        settingsService.getStoresList(),
        settingsService.getStaffList(),
      ])
      setStoresList(updatedStores)
      setStaffList(staff)
    } catch (err) {
      console.error("Failed to switch store:", err)
    }
  }

  // Toggle single permission selection
  const togglePermission = (code: string) => {
    setNewRoleData((prev) => {
      const exists = prev.permissionCodes.includes(code)
      return {
        ...prev,
        permissionCodes: exists
          ? prev.permissionCodes.filter((c) => c !== code)
          : [...prev.permissionCodes, code],
      }
    })
  }

  // Toggle all permissions in a specific group
  const toggleGroupPermissions = (group: string, selectAll: boolean) => {
    const groupPermCodes = permissionsCatalog
      .filter((p) => p.group === group)
      .map((p) => p.code)

    setNewRoleData((prev) => {
      if (selectAll) {
        const combined = Array.from(new Set([...prev.permissionCodes, ...groupPermCodes]))
        return { ...prev, permissionCodes: combined }
      } else {
        return {
          ...prev,
          permissionCodes: prev.permissionCodes.filter((code) => !groupPermCodes.includes(code)),
        }
      }
    })
  }

  // Select all permissions in catalog
  const handleSelectAllPermissions = () => {
    const allCodes = permissionsCatalog.map((p) => p.code)
    setNewRoleData((prev) => ({
      ...prev,
      permissionCodes: allCodes,
    }))
  }

  // Clear all selected permissions
  const handleClearAllPermissions = () => {
    setNewRoleData((prev) => ({
      ...prev,
      permissionCodes: [],
    }))
  }

  // Create Role Submit Handler
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoleData.displayName.trim()) {
      setCreateRoleError("Nama tampilan peran wajib diisi.")
      return
    }

    if (newRoleData.permissionCodes.length === 0) {
      setCreateRoleError("Pilih minimal satu hak akses/izin untuk peran ini.")
      return
    }

    setIsCreatingRole(true)
    setCreateRoleError("")
    try {
      // Auto-generate system name code if empty
      const roleName = newRoleData.name.trim() ||
        newRoleData.displayName.trim().toUpperCase().replace(/\s+/g, "_")

      await settingsService.createRole({
        ...newRoleData,
        name: roleName,
      })

      setIsCreateRoleOpen(false)
      setNewRoleData({
        name: "",
        displayName: "",
        description: "",
        permissionCodes: [],
      })

      // Reload roles list
      const updatedRoles = await settingsService.getRolesList()
      setRolesList(updatedRoles)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menambahkan peran baru."
      setCreateRoleError(msg)
    } finally {
      setIsCreatingRole(false)
    }
  }

  return {
    loading,
    store,
    storesList,
    staffList,
    rolesList,
    permissionsCatalog,
    loadData,

    // Profile Form
    formData,
    setFormData,
    isSavingProfile,
    profileSuccessMsg,
    profileErrorMsg,
    handleSaveProfile,

    // Staff Invite & Revoke
    isInviteOpen,
    setIsInviteOpen,
    inviteData,
    setInviteData,
    isInviting,
    inviteError,
    handleInviteSubmit,
    revokingStaff,
    setRevokingStaff,
    isRevoking,
    handleConfirmRevoke,

    // Roles Management
    isCreateRoleOpen,
    setIsCreateRoleOpen,
    newRoleData,
    setNewRoleData,
    isCreatingRole,
    createRoleError,
    setCreateRoleError,
    selectedRoleDetail,
    setSelectedRoleDetail,
    handleCreateRole,
    togglePermission,
    toggleGroupPermissions,
    handleSelectAllPermissions,
    handleClearAllPermissions,

    // New Store
    isNewStoreOpen,
    setIsNewStoreOpen,
    newStoreData,
    setNewStoreData,
    isCreatingStore,
    createStoreError,
    handleCreateStore,

    // Switch Store
    handleSwitchStore,
  }
}
