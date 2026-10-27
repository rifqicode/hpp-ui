import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { useInitialLoading } from "@/hooks/use-initial-loading"
import { useSearchParams, useNavigate } from "react-router-dom"
import {
  Store,
  Building2,
  Users,
  MapPin,
  Phone,
  Plus,
  Trash2,
  Check,
  ShieldCheck,
  UserCheck,
  Clock,
  Loader2,
  AlertCircle,
  ChevronDown,
  Shield,
  Pencil,
  Globe,
  Printer,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FeedbackAlert } from "@/components/ui/feedback-alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useStoreSettings } from "@/features/settings/hooks"
import type { Role } from "@/features/settings/types"
import { RolePermissionsDialog } from "@/features/settings/components/role-permissions-dialog"
import { permissionGroupInfo } from "@/features/settings/constants"
import { StorefrontSettingsTab } from "@/features/storefront/components/storefront-settings-tab"
import { ReceiptSettingsTab } from "@/features/settings/components/receipt-settings-tab"
import { StaffPasswordField } from "@/features/settings/components/staff-password-field"
import { useAuthStore } from "@/store/use-auth-store"

const STORE_CATEGORIES = [
  "Bakery & Pastry",
  "Cafe & Coffee Shop",
  "Restoran & Rumah Makan",
  "Cloud Kitchen / Produksi",
  "Minuman & Boba",
  "Catering & Jasa Boga",
  "Pizzaria & Fast Food",
  "Retail & Toko Kelontong",
  "Retail & Kelontong",
  "Other",
  "Lainnya",
]


export default function StoreSettingsPage() {
  const currentUser = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get("tab")
  const activeTab = requestedTab && ["profile", "storefront", "receipt", "staff", "roles", "stores"].includes(requestedTab) ? requestedTab : "profile"
  const isCompactLayout = useIsMobile(1280)

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val }, { replace: true })
  }

  const roleDetailsTrigger = React.useRef<HTMLElement | null>(null)
  const staffCreateTrigger = React.useRef<HTMLButtonElement | null>(null)
  const staffResetTrigger = React.useRef<HTMLButtonElement | null>(null)
  const openRoleDetails = (role: Role, trigger: HTMLElement | null) => {
    roleDetailsTrigger.current = trigger
    setSelectedRoleDetail(role)
  }

  const {
    loading: profileLoading,
    tabLoading,
    store,
    setStore,
    loadProfile,
    storesList,
    staffList,
    rolesList,
    formData,
    setFormData,
    isSavingProfile,
    profileSuccessMsg,
    setProfileSuccessMsg,
    profileErrorMsg,
    setProfileErrorMsg,
    handleSaveProfile,
    isInviteOpen,
    setIsInviteOpen,
    inviteData,
    setInviteData,
    isInviting,
    inviteError,
    handleInviteSubmit,
    closeInvite,
    staffMessage,
    resettingStaff,
    staffPassword,
    setStaffPassword,
    resetPasswordError,
    isResettingPassword,
    openPasswordReset,
    closePasswordReset,
    handleResetStaffPassword,
    revokingStaff,
    setRevokingStaff,
    isRevoking,
    handleConfirmRevoke,
    selectedRoleDetail,
    setSelectedRoleDetail,
    isNewStoreOpen,
    setIsNewStoreOpen,
    newStoreData,
    setNewStoreData,
    isCreatingStore,
    createStoreError,
    handleCreateStore,
    handleSwitchStore,
  } = useStoreSettings(activeTab)
  const loading = profileLoading || tabLoading
  const isOwner = ["OWNER", "STORE_OWNER"].includes(currentUser?.role || "")
  const staffRoles = rolesList.filter((role) => role.name !== "OWNER" && role.name !== "STORE_OWNER" && !role.name.startsWith("TIER_"))

  function formatDate(dateStr?: string) {
    if (!dateStr) return "-"
    try {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(dateStr))
    } catch {
      return dateStr
    }
  }

  function getRoleDisplayName(roleName: string) {
    const found = rolesList.find((r) => r.name === roleName)
    if (found) return found.name
    if (roleName === "OWNER" || roleName === "STORE_OWNER") return "Pemilik Toko (Owner)"
    if (roleName === "STORE_MANAGER") return "Manajer Operasional"
    if (roleName === "STORE_CASHIER") return "Kasir (POS)"
    if (roleName === "STORE_KITCHEN") return "Tim Dapur & Produksi"
    if (roleName === "STAFF") return "Staf Operasional"
    return roleName
  }

  const TABS = [
    { id: "profile", label: "Profil Toko", description: "Identitas & kontak", icon: Building2 },
    { id: "storefront", label: "Toko Online", description: "Katalog & checkout", icon: Globe },
    { id: "staff", label: "Anggota Tim", description: "Akun & akses staf", icon: Users },
    { id: "roles", label: "Peran & Hak Akses", description: "Izin operasional", icon: ShieldCheck },
    { id: "receipt", label: "Struk & Printer", description: "Format & ukuran kertas", icon: Printer },
    { id: "stores", label: "Daftar Toko", description: "Toko & cabang", icon: Store },
  ] as const

  const isInitialLoading = useInitialLoading(loading)
  if (isInitialLoading) {
    // Global LoadingOverlay renders the spinner on top of this placeholder
    return <div className="min-h-[60vh]" />
  }

  return (
    <div className="w-full min-w-0 space-y-5 pb-8">
      <header>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Pengaturan Toko & Outlet</h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Atur profil toko, anggota tim, dan akses setiap cabang.</p>
      </header>

      <Tabs value={activeTab} onValueChange={handleTabChange} orientation={isCompactLayout ? "horizontal" : "vertical"} className="grid min-w-0 items-start gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
        <aside aria-label="Bagian pengaturan toko" className="min-w-0 space-y-3 xl:sticky xl:top-0">
          <TabsList aria-label="Pengaturan toko" className="grid h-auto w-full grid-cols-2 justify-start gap-1 rounded-xl border bg-card p-1.5 sm:grid-cols-4 xl:grid-cols-1">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <TabsTrigger key={tab.id} value={tab.id} aria-label={tab.label} className="group/store-tab min-h-11 min-w-0 justify-start gap-2 rounded-lg px-2.5 py-2.5 text-left text-xs font-medium text-muted-foreground shadow-none transition-colors hover:bg-muted/60 hover:text-foreground data-[state=active]:bg-primary data-[state=active]:font-semibold data-[state=active]:text-primary-foreground data-[state=active]:shadow-none data-[state=active]:hover:bg-primary/90 data-[state=active]:hover:text-primary-foreground xl:gap-3 xl:px-3">
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0"><span className="block whitespace-normal leading-4">{tab.label}</span><span className="mt-0.5 hidden text-[10px] font-normal text-muted-foreground group-data-[state=active]/store-tab:text-primary-foreground xl:block">{tab.description}</span></span>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </aside>

        <div className="min-w-0">
        <TabsContent value="profile" className="m-0 space-y-4">
          <Card className="min-w-0 gap-0 border border-border py-0 shadow-none ring-0">
            <CardHeader className="gap-1 border-b px-4 py-4 sm:px-5">
              <CardTitle className="text-base">Informasi Toko & Outlet</CardTitle>
              <CardDescription className="text-xs leading-5">Informasi toko ditampilkan pada faktur, pesanan pembelian, dan struk kasir.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={handleSaveProfile}>
                <div className="space-y-6 p-4 sm:p-5">
                  {profileSuccessMsg && <FeedbackAlert variant="success" onDismiss={() => setProfileSuccessMsg("")}>{profileSuccessMsg}</FeedbackAlert>}
                  {profileErrorMsg && <FeedbackAlert variant="error" onDismiss={() => setProfileErrorMsg("")}>{profileErrorMsg}</FeedbackAlert>}

                  <section aria-labelledby="store-identity-heading" className="space-y-4">
                    <div><h2 id="store-identity-heading" className="text-sm font-semibold">Identitas toko</h2><p className="mt-1 text-xs text-muted-foreground">Nama dan jenis usaha yang dikenali pelanggan.</p></div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="store-name" className="text-xs font-medium">Nama Toko / Outlet <span className="text-destructive">*</span></Label>
                        <Input id="store-name" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} required className="h-11 text-sm" placeholder="Nama toko Anda" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="store-category" className="text-xs font-medium">Kategori Bisnis <span className="text-destructive">*</span></Label>
                        <select id="store-category" value={formData.category} onChange={(event) => setFormData({ ...formData, category: event.target.value })} className="h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          {formData.category && !STORE_CATEGORIES.includes(formData.category) && <option value={formData.category}>{formData.category}</option>}
                          {STORE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                        </select>
                      </div>
                    </div>
                  </section>

                  <section aria-labelledby="store-contact-heading" className="space-y-4 border-t pt-5">
                    <div><h2 id="store-contact-heading" className="text-sm font-semibold">Kontak & operasional</h2><p className="mt-1 text-xs text-muted-foreground">Nomor bisnis, lokasi, dan catatan untuk toko ini.</p></div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="store-phone" className="text-xs font-medium">Nomor Telepon / WhatsApp Bisnis</Label>
                        <Input id="store-phone" type="tel" value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} placeholder="Nomor telepon bisnis" className="h-11 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="store-location" className="text-xs font-medium">Alamat Fisik / Dapur Produksi</Label>
                        <Input id="store-location" value={formData.location} onChange={(event) => setFormData({ ...formData, location: event.target.value })} placeholder="Alamat toko atau dapur produksi" className="h-11 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="store-desc" className="text-xs font-medium">Deskripsi Singkat / Catatan Operasional</Label>
                      <Textarea id="store-desc" value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} placeholder="Jam buka atau catatan operasional toko" className="min-h-24 text-sm" rows={3} />
                    </div>
                    <dl className="grid gap-3 rounded-lg bg-muted/40 p-3 text-xs sm:grid-cols-2">
                      <div><dt className="text-[11px] text-muted-foreground">Mata uang operasional</dt><dd className="mt-1 font-medium">IDR · Rupiah Indonesia</dd></div>
                      <div><dt className="text-[11px] text-muted-foreground">Zona waktu gerai</dt><dd className="mt-1 font-medium">Asia/Jakarta · WIB (UTC+7)</dd></div>
                    </dl>
                  </section>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-4 py-4 sm:px-5">
                  <p className="text-[11px] text-muted-foreground">Perubahan berlaku untuk toko ini.</p>
                  <Button type="submit" disabled={isSavingProfile} className="h-11 w-full gap-2 text-xs sm:w-auto">{isSavingProfile && <Loader2 className="size-4 animate-spin" />}Simpan Perubahan Toko</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= TAB 2: ANGGOTA TIM & STAF ================= */}
        <TabsContent value="staff" className="m-0 min-w-0 space-y-4">
          <Card className="min-w-0 gap-0 rounded-xl border border-border py-0 shadow-none ring-0">
            <CardHeader className="border-b px-4 py-4 sm:px-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>Anggota Tim</span><Badge variant="secondary" className="text-[10px]">{staffList.length}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Buat akun staf dan atur akses mereka ke toko ini.
                  </CardDescription>
                </div>
                <Button onClick={(event) => { staffCreateTrigger.current = event.currentTarget; setIsInviteOpen(true) }} className="min-h-11 w-full gap-1.5 text-xs sm:w-auto" size="sm">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Tambah Staf Baru
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              {staffMessage && <p role="status" className="mb-4 break-words rounded-lg border bg-muted/30 p-3 text-sm text-foreground">{staffMessage}</p>}
              {staffList.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-foreground">Belum Ada Staf Tambahan</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Tambahkan barista, chef dapur, atau kasir untuk membantu operasional toko.
                    </p>
                  </div>
                  <Button onClick={(event) => { staffCreateTrigger.current = event.currentTarget; setIsInviteOpen(true) }} variant="outline" size="sm" className="min-h-11 rounded-xl text-xs">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Tambah Staf Pertama
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table className="min-w-0 md:min-w-[650px]">
                    <TableHeader className="hidden md:table-header-group">
                      <TableRow className="bg-muted/40">
                        <TableHead className="whitespace-nowrap">Nama Anggota</TableHead>
                        <TableHead className="whitespace-nowrap">Username / Email</TableHead>
                        <TableHead className="whitespace-nowrap">Peran / Role</TableHead>
                        <TableHead className="whitespace-nowrap">Tanggal Bergabung</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                        <TableHead className="w-[80px] text-center whitespace-nowrap">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="block md:table-row-group">
                      {staffList.map((st) => (
                        <TableRow key={st.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 p-4 hover:bg-muted/30 md:table-row md:p-0">
                          <TableCell className="order-1 col-span-2 p-0 font-medium text-foreground md:p-4">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs uppercase shrink-0">
                                {st.name ? st.name.substring(0, 2) : "ST"}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span>{st.name}</span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="order-2 col-span-2 break-all p-0 text-xs text-muted-foreground md:max-w-64 md:whitespace-normal md:p-4">
                            {st.username || st.email}
                          </TableCell>

                          <TableCell className="order-3 p-0 md:whitespace-nowrap md:p-4">
                            {st.role === "OWNER" ? (
                              <Badge variant="default" className="bg-amber-600 hover:bg-amber-600 text-white gap-1 text-[10px]">
                                <ShieldCheck className="h-3 w-3" /> Pemilik (Owner)
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1 text-[10px]">
                                <UserCheck className="h-3 w-3" /> {getRoleDisplayName(st.role)}
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="order-5 flex items-center p-0 text-xs text-muted-foreground md:table-cell md:whitespace-nowrap md:p-4">
                            <span className="mr-1 text-[10px] md:hidden">Bergabung:</span>{formatDate(st.joinedAt)}
                          </TableCell>

                          <TableCell className="order-4 p-0 text-right md:whitespace-nowrap md:p-4 md:text-left">
                            {st.status === "active" ? (
                              <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                                Aktif
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] gap-1">
                                <Clock className="h-3 w-3" /> Undangan Terkirim
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="order-6 p-0 text-right md:whitespace-nowrap md:p-4 md:text-center">
                            {isOwner && st.username && st.status === "active" && !["OWNER", "STORE_OWNER"].includes(st.role) && (
                              <Button variant="outline" size="sm" onClick={(event) => { staffResetTrigger.current = event.currentTarget; openPasswordReset(st) }} className="mb-1 min-h-11 rounded-lg px-2 text-xs md:mb-0 md:mr-2">Reset Kata Sandi</Button>
                            )}
                            {!["OWNER", "STORE_OWNER"].includes(st.role) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRevokingStaff(st)}
                                className="min-h-11 rounded-lg px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1" /> Cabut
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= TAB 3: PERAN & HAK AKSES ================= */}
        <TabsContent value="roles" className="m-0 min-w-0 space-y-4">
          <Card className="min-w-0 gap-0 rounded-xl border border-border py-0 shadow-none ring-0">
            <CardHeader className="border-b px-4 py-4 sm:px-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span>Peran & Hak Akses</span><Badge variant="secondary" className="text-[10px]">{rolesList.length}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Tentukan fitur dan tindakan yang dapat diakses setiap peran.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => navigate("/settings/role/new")}
                  className="h-10 w-full gap-1.5 text-xs sm:w-auto"
                  size="sm"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Tambah Peran Baru
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              {rolesList.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-foreground">Belum Ada Peran</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Buat peran kustom baru untuk membatasi atau memberikan hak akses tertentu kepada tim Anda.
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate("/settings/role/new")}
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Tambah Peran Pertama
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden bg-card shadow-xs">
                  <Table className="min-w-0 md:min-w-[680px]">
                    <TableHeader className="hidden md:table-header-group">
                      <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                        <TableHead className="font-bold text-foreground text-xs py-3.5 pl-4">
                          Peran & Deskripsi
                        </TableHead>
                        <TableHead className="font-bold text-foreground text-xs">Izin Aktif</TableHead>
                        <TableHead className="font-bold text-foreground text-xs">Cakupan Modul</TableHead>
                        <TableHead className="w-[200px] text-right font-bold text-foreground text-xs pr-4">
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="block md:table-row-group">
                      {rolesList.map((role) => {
                        const permissions = role.permissions ?? []
                        const groups = Array.from(new Set(permissions.map((permission) => permission.group)))
                        return (
                          <TableRow key={role.id} className="grid cursor-pointer grid-cols-2 gap-3 p-4 hover:bg-muted/30 md:table-row md:p-0" onClick={(event) => openRoleDetails(role, event.currentTarget.querySelector<HTMLButtonElement>('[data-role-details]'))}>
                            <TableCell className="col-span-2 p-0 align-top md:p-4">
                              <div className="flex items-start gap-3">
                                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Shield className="size-4" aria-hidden="true" /></span>
                                <div className="min-w-0 space-y-1">
                                  <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={(event) => { event.stopPropagation(); openRoleDetails(role, event.currentTarget) }} className="rounded text-left text-sm font-semibold hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{role.name}</button><Badge variant="secondary" className="text-[10px]">{role.is_system ? "Sistem" : "Kustom"}</Badge></div>
                                  <p className="max-w-md whitespace-normal text-xs leading-5 text-muted-foreground">{role.description || "Belum ada deskripsi peran."}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="col-span-2 p-0 align-top md:p-4"><span className="text-xs font-medium">{permissions.length} izin</span></TableCell>
                            <TableCell className="col-span-2 p-0 align-top md:p-4"><div className="flex max-w-60 flex-wrap gap-1">{groups.length === 0 ? <span className="text-xs text-muted-foreground">Belum ada modul</span> : groups.map((group) => <span key={group} className="rounded-md border px-2 py-1 text-[10px] text-muted-foreground">{permissionGroupInfo(group).label}</span>)}</div></TableCell>
                            <TableCell className="col-span-2 border-t p-0 pt-3 text-right align-top md:border-0 md:p-4" onClick={(event) => event.stopPropagation()}>
                              <div className="flex items-center gap-2 [&>button]:flex-1 md:justify-end md:[&>button]:flex-none">
                                <Button type="button" variant="outline" size="sm" disabled={Boolean(role.is_system)} title={role.is_system ? "Peran bawaan sistem tidak dapat diedit" : "Edit peran & izin"} onClick={() => navigate(`/settings/role/${role.id}`)} className="h-10 gap-1.5 text-xs"><Pencil className="size-3.5" />Edit</Button>
                                <Button type="button" variant="outline" size="sm" data-role-details aria-haspopup="dialog" onClick={(event) => openRoleDetails(role, event.currentTarget)} className="h-10 gap-1.5 text-xs"><ShieldCheck className="size-3.5" />Lihat izin</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= TAB 4: DAFTAR TOKO ================= */}
        <TabsContent value="stores" className="m-0 min-w-0 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Daftar Toko <span className="ml-1 text-xs font-normal text-muted-foreground">({storesList.length})</span></h2>
              <p className="text-xs text-muted-foreground">
                Pilih toko yang ingin dikelola atau tambahkan cabang baru.
              </p>
            </div>
            <Button onClick={() => setIsNewStoreOpen(true)} className="h-10 w-full gap-1.5 text-xs sm:w-auto" size="sm">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Tambah Toko Baru
            </Button>
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            {storesList.map((s) => {
              const isCurrent = store?.id === s.id
              return (
                <Card
                  key={s.id}
                  className={`rounded-2xl shadow-sm border transition-all ${
                    isCurrent
                      ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/30"
                      : "border-border bg-card hover:border-border/80"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 basis-32 items-center gap-2.5">
                        <div className={`p-2.5 rounded-xl shrink-0 ${isCurrent ? "bg-primary text-white shadow-sm" : "bg-muted text-muted-foreground"}`}>
                          <Store className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-sm font-bold text-foreground truncate">
                            {s.name}
                          </CardTitle>
                          <span className="text-[11px] text-muted-foreground block truncate">{s.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        {s.role && (
                          <Badge
                            variant={s.role.toUpperCase() === "OWNER" ? "default" : "secondary"}
                            className={`text-[10px] px-2 py-0.5 ${
                              s.role.toUpperCase() === "OWNER"
                                ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
                                : "bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            {s.role.toUpperCase() === "OWNER"
                              ? "Pemilik"
                              : s.role.toUpperCase() === "STAFF"
                              ? "Staf"
                              : s.role}
                          </Badge>
                        )}
                        {isCurrent && (
                          <Badge variant="default" className="text-[10px] gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                            <Check className="h-3 w-3" /> Aktif
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                        <span className="truncate">{s.location || "Alamat belum diatur"}</span>
                      </div>
                      {s.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                          <span>{s.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        {s.isMain ? "Toko Utama" : "Toko Cabang"}
                      </span>

                      {isCurrent ? (
                        <Button variant="outline" size="sm" className="h-10 cursor-default rounded-lg text-xs" disabled>
                          Sedang Aktif
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSwitchStore(s.id)}
                          className="h-10 rounded-lg border-primary/20 text-xs hover:bg-primary/10 hover:text-primary"
                        >
                          Beralih ke Toko Ini
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* ============================================================
            TAB: TOKO ONLINE & CHECKOUT BUILDER
           ============================================================ */}
        <TabsContent value="storefront" className="m-0">
          <StorefrontSettingsTab store={store} />
        </TabsContent>

        {/* ============================================================
            TAB: STRUK & PRINTER
           ============================================================ */}
        <TabsContent value="receipt" className="m-0">
          <ReceiptSettingsTab
            store={store}
            onUpdated={(updated) => {
              setStore(updated);
              void loadProfile();
            }}
          />
        </TabsContent>
        </div>
      </Tabs>

      <Dialog open={isInviteOpen} onOpenChange={(open) => open ? setIsInviteOpen(true) : closeInvite()}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[480px] rounded-2xl" closeButtonClassName="right-1 top-1 flex size-11 items-center justify-center" showCloseButton={!isInviting} onCloseAutoFocus={(event) => { event.preventDefault(); staffCreateTrigger.current?.focus() }}>
          <DialogHeader>
            <DialogTitle>Tambah Anggota Tim Baru</DialogTitle>
            <DialogDescription className="text-xs">
              Buat akun untuk toko <strong>{store?.name}</strong>. Staf langsung bisa login tanpa email atau verifikasi.
            </DialogDescription>
          </DialogHeader>

          {inviteError && (
            <div role="alert" className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{inviteError}</span>
            </div>
          )}
          {!store?.staff_login_code && <p role="alert" className="text-sm text-foreground">Kode login toko belum tersedia. Muat ulang halaman atau hubungi pengelola aplikasi.</p>}

          <form onSubmit={handleInviteSubmit} className="space-y-4 py-2">
            <fieldset disabled={isInviting} className="min-w-0 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="staff-name" className="text-xs font-semibold">
                Nama Lengkap Staf <span className="text-destructive">*</span>
              </Label>
              <Input
                id="staff-name"
                value={inviteData.name}
                onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                placeholder="Contoh: Rina Kusuma"
                className="h-11 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="staff-username" className="text-xs font-semibold">
                Username Staf <span className="text-destructive">*</span>
              </Label>
              <Input
                id="staff-username"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                value={inviteData.username}
                onChange={(e) => setInviteData({ ...inviteData, username: e.target.value })}
                placeholder="Contoh: rina"
                minLength={3}
                maxLength={32}
                aria-describedby="staff-login-preview staff-username-hint"
                className="h-11 rounded-xl"
                required
              />
              <p id="staff-username-hint" className="text-xs text-muted-foreground">3–32 karakter: huruf, angka, titik, garis bawah, atau tanda hubung.</p>
              <p id="staff-login-preview" className="break-all rounded-lg border bg-muted/30 p-3 text-sm text-foreground">Login staf: <strong>{inviteData.username.trim().toLowerCase() || "username"}@{store?.staff_login_code || "kode-toko-belum-tersedia"}</strong></p>
            </div>

            <StaffPasswordField id="staff-password" value={inviteData.password} onChange={(password) => setInviteData({ ...inviteData, password })} />

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Peran / Hak Akses</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" disabled={isInviting} className="w-full justify-between rounded-xl h-11 text-xs">
                    <span className={cn("truncate", !inviteData.role_id && "text-muted-foreground")}>
                      {inviteData.role_id
                        ? getRoleDisplayName(rolesList.find((r) => r.id === inviteData.role_id)?.name || "")
                        : "Pilih peran..."}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] rounded-xl max-h-56 overflow-y-auto" align="start">
                  {staffRoles.map((r) => (
                    <DropdownMenuItem
                      key={r.id}
                      onClick={() => setInviteData({ ...inviteData, role_id: r.id })}
                      className="min-h-11 cursor-pointer text-xs flex flex-col items-start gap-0.5 py-1.5"
                    >
                      <div className="flex items-center gap-1.5 w-full justify-between">
                        <span className="font-semibold text-foreground">{r.name}</span>
                        {r.is_system ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground">Sistem</span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 font-medium">Kustom</span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground line-clamp-1">{r.description || r.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <DialogFooter className="pt-3 sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeInvite}
                className="min-h-11 rounded-xl text-xs"
                disabled={isInviting}
              >
                Batal
              </Button>
              <Button type="submit" className="min-h-11 rounded-xl text-xs font-semibold" disabled={isInviting || !store?.staff_login_code}>
                {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isInviting ? "Menambahkan Staf..." : "Buat Akun Staf"}
              </Button>
            </DialogFooter>
            </fieldset>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resettingStaff} onOpenChange={(open) => !open && closePasswordReset()}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[440px]" closeButtonClassName="right-1 top-1 flex size-11 items-center justify-center" showCloseButton={!isResettingPassword} onCloseAutoFocus={(event) => { event.preventDefault(); staffResetTrigger.current?.focus() }}>
          <DialogHeader>
            <DialogTitle>Reset Kata Sandi Staf</DialogTitle>
            <DialogDescription className="break-words">Ganti kata sandi untuk {resettingStaff?.name}. Sesi login lama akan dicabut.</DialogDescription>
          </DialogHeader>
          <p className="break-all text-sm font-medium">{resettingStaff?.username}</p>
          <form onSubmit={handleResetStaffPassword}>
            <fieldset disabled={isResettingPassword} className="min-w-0 space-y-4">
              {resetPasswordError && <p role="alert" className="text-sm text-destructive">{resetPasswordError}</p>}
              <StaffPasswordField id="reset-staff-password" value={staffPassword} onChange={setStaffPassword} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closePasswordReset} className="min-h-11">Batal</Button>
                <Button type="submit" className="min-h-11">{isResettingPassword ? "Menyimpan..." : "Simpan Kata Sandi Baru"}</Button>
              </DialogFooter>
            </fieldset>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Cabut Akses Staf */}
      <Dialog open={!!revokingStaff} onOpenChange={(open) => !open && setRevokingStaff(null)}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-destructive">Cabut Akses Staf?</DialogTitle>
            <DialogDescription className="text-xs">
              Apakah Anda yakin ingin mencabut akses untuk{" "}
              <strong className="text-foreground">{revokingStaff?.name}</strong> ({revokingStaff?.email})?
              Staf ini tidak akan dapat mengakses data toko ini lagi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2 sm:space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRevokingStaff(null)}
              className="rounded-xl text-xs"
              disabled={isRevoking}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmRevoke}
              className="rounded-xl text-xs"
              disabled={isRevoking}
            >
              {isRevoking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cabut Akses
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RolePermissionsDialog role={selectedRoleDetail} onClose={() => setSelectedRoleDetail(null)} returnFocusTo={roleDetailsTrigger} />

      {/* Modal Tambah Cabang Baru */}
      <Dialog open={isNewStoreOpen} onOpenChange={setIsNewStoreOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Tambah Cabang Toko Baru</DialogTitle>
            <DialogDescription className="text-xs">
              Buat cabang atau unit dapur produksi baru untuk bisnis Anda.
            </DialogDescription>
          </DialogHeader>

          {createStoreError && (
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{createStoreError}</span>
            </div>
          )}

          <form onSubmit={handleCreateStore} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-store-name" className="text-xs font-semibold">
                Nama Toko <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-store-name"
                value={newStoreData.name}
                onChange={(e) => setNewStoreData({ ...newStoreData, name: e.target.value })}
                placeholder="Contoh: Dapur Roti - Cabang BSD"
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-store-cat" className="text-xs font-semibold">
                Kategori Usaha
              </Label>
              <select
                id="new-store-cat"
                value={newStoreData.category}
                onChange={(e) => setNewStoreData({ ...newStoreData, category: e.target.value })}
                className="w-full px-3 rounded-xl h-9 text-sm border border-input bg-background text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {newStoreData.category && !STORE_CATEGORIES.includes(newStoreData.category) && (
                  <option value={newStoreData.category}>
                    {newStoreData.category}
                  </option>
                )}
                {STORE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-store-loc" className="text-xs font-semibold">
                Alamat / Lokasi Cabang
              </Label>
              <Input
                id="new-store-loc"
                value={newStoreData.location}
                onChange={(e) => setNewStoreData({ ...newStoreData, location: e.target.value })}
                placeholder="Contoh: Ruko Golden Madrid No. 12, BSD City"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-store-phone" className="text-xs font-semibold">
                No. Telepon Cabang
              </Label>
              <Input
                id="new-store-phone"
                value={newStoreData.phone}
                onChange={(e) => setNewStoreData({ ...newStoreData, phone: e.target.value })}
                placeholder="0812-xxxx-xxxx"
                className="rounded-xl"
              />
            </div>

            <DialogFooter className="pt-3 sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewStoreOpen(false)}
                className="rounded-xl text-xs"
                disabled={isCreatingStore}
              >
                Batal
              </Button>
              <Button type="submit" className="rounded-xl text-xs font-semibold" disabled={isCreatingStore}>
                {isCreatingStore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buat Cabang Toko
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
