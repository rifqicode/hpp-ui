import * as React from "react"
import { useAuthStore } from "@/store/use-auth-store"
import { settingsService } from "@/features/settings/services/settings-service"
import type { StoreInfo, StaffMember, Role, Permission } from "@/features/settings/types"

type Resource = "stores" | "staff" | "roles" | "permissions"

// Data required by each tab (profile is always loaded)
const TAB_RESOURCES: Record<string, Resource[]> = {
  profile: [],
  staff: ["staff", "roles"],
  roles: ["roles", "permissions"],
  stores: ["stores"],
}

export function useStoreSettings(activeTab: string = "profile") {
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
    role_id: string
  }>({
    name: "",
    email: "",
    role_id: "",
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

  const [selectedRoleDetail, setSelectedRoleDetail] = React.useState<Role | null>(null)

  // Load store profile only (always needed)
  const loadProfile = React.useCallback(async () => {
    setLoading(true)
    try {
      const currentStore = await settingsService.getStoreProfile()
      setStore(currentStore)
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

  const profileRequestedRef = React.useRef(false)
  React.useEffect(() => {
    if (profileRequestedRef.current) return
    profileRequestedRef.current = true
    loadProfile()
  }, [loadProfile])

  // Lazy per-tab resources
  const [loadedResources, setLoadedResources] = React.useState<string[]>([])
  const requestedRef = React.useRef<Set<string>>(new Set())
  const [cacheVersion, setCacheVersion] = React.useState(0)
  const storeId = store?.id

  const neededResources = TAB_RESOURCES[activeTab] ?? []
  const tabLoading = neededResources.some((r) => !loadedResources.includes(r))

  React.useEffect(() => {
    if (!storeId) return
    const fetchers: Record<Resource, () => Promise<void>> = {
      stores: async () => setStoresList(await settingsService.getStoresList()),
      staff: async () => setStaffList(await settingsService.getStaffList()),
      roles: async () => setRolesList(await settingsService.getRolesList(storeId)),
      permissions: async () => setPermissionsCatalog(await settingsService.getPermissionsCatalog(storeId)),
    }
    for (const res of TAB_RESOURCES[activeTab] ?? []) {
      if (requestedRef.current.has(res)) continue
      requestedRef.current.add(res)
      fetchers[res]()
        .catch((err) => {
          console.error(`Failed to load ${res}:`, err)
          requestedRef.current.delete(res)
        })
        .finally(() => setLoadedResources((prev) => (prev.includes(res) ? prev : [...prev, res])))
    }
  }, [activeTab, storeId, cacheVersion])

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
    if (!inviteData.role_id) {
      setInviteError("Pilih peran / hak akses untuk staf.")
      return
    }

    setIsInviting(true)
    setInviteError("")
    try {
      await settingsService.inviteStaff(inviteData)
      setIsInviteOpen(false)
      setInviteData({ name: "", email: "", role_id: "" })
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
      // Invalidate lazy-loaded tab data; effect refetches only the active tab's data
      requestedRef.current.clear()
      setCacheVersion((v) => v + 1)
      setLoadedResources([])
      setStoresList([])
      setStaffList([])
      setRolesList([])
      setPermissionsCatalog([])
      setStore(switched)
      setActiveStoreId(switched.id)
      setFormData({
        name: switched.name,
        category: switched.category,
        location: switched.location,
        phone: switched.phone || "",
        description: switched.description || "",
      })
      window.location.reload()
    } catch (err) {
      console.error("Failed to switch store:", err)
    }
  }

  // Refresh roles list explicitly (e.g. after editing/creating a role)
  const refreshRoles = React.useCallback(async () => {
    if (!storeId) return
    try {
      const updated = await settingsService.getRolesList(storeId)
      setRolesList(updated)
    } catch (err) {
      console.error("Failed to refresh roles:", err)
    }
  }, [storeId])

  return {
    loading,
    store,
    storesList,
    staffList,
    rolesList,
    permissionsCatalog,
    tabLoading,

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
    selectedRoleDetail,
    setSelectedRoleDetail,
    refreshRoles,

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
