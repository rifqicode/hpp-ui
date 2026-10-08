import * as React from "react"
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
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Sparkles,
  Shield,
  Layers,
  Pencil,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
import { PERMISSION_GROUP_INFO } from "@/features/settings/constants"
import type { Permission } from "@/features/settings/types"

const STORE_CATEGORIES = [
  "Bakery & Pastry",
  "Cafe & Coffee Shop",
  "Restoran & Rumah Makan",
  "Cloud Kitchen / Produksi",
  "Minuman & Boba",
  "Catering & Jasa Boga",
  "Pizzaria & Fast Food",
  "Retail & Kelontong",
  "Lainnya",
]


export default function StoreSettingsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") || "profile"

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val }, { replace: true })
  }

  const [expandedRoleIds, setExpandedRoleIds] = React.useState<string[]>([])

  const toggleExpandRole = (roleId: string) => {
    setExpandedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    )
  }

  const {
    loading: profileLoading,
    tabLoading,
    store,
    storesList,
    staffList,
    rolesList,
    permissionsCatalog,
    formData,
    setFormData,
    isSavingProfile,
    profileSuccessMsg,
    profileErrorMsg,
    handleSaveProfile,
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
    { id: "profile", label: "Profil Toko", icon: Building2 },
    { id: "staff", label: "Anggota Tim", icon: Users },
    { id: "roles", label: "Peran & Hak Akses", icon: ShieldCheck },
    { id: "stores", label: "Daftar Cabang", icon: Store },
  ] as const

  const isInitialLoading = useInitialLoading(loading)
  if (isInitialLoading) {
    // Global LoadingOverlay renders the spinner on top of this placeholder
    return <div className="min-h-[60vh]" />
  }

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-500 w-full">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" />
            Pengaturan Toko & Outlet
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola profil outlet, manajemen peran & hak akses staf, serta perpindahan antar-cabang.
          </p>
        </div>
        {store && (
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <Badge variant="outline" className="px-3 py-1 bg-primary/5 text-primary border-primary/20 text-xs font-semibold">
              Toko Aktif: {store.name}
            </Badge>
            {store.isMain && (
              <Badge variant="default" className="text-[10px] bg-amber-500 text-white font-bold">
                Toko Utama
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-flow-col auto-cols-fr gap-1 rounded-xl bg-muted/60 p-1 border border-border h-auto w-full">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="rounded-lg text-xs font-semibold py-2.5 transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted/80 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/30 data-[state=active]:font-bold"
              >
                <Icon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* ================= TAB 1: PROFIL TOKO ================= */}
        <TabsContent value="profile" className="mt-4 space-y-4">
          <Card className="rounded-xl shadow-sm border-border w-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Informasi Toko & Outlet</CardTitle>
                  <CardDescription>
                    Detail informasi ini digunakan pada faktur, Purchase Order, dan bukti transaksi kasir.
                  </CardDescription>
                </div>
                {store?.isMain && (
                  <Badge variant="outline" className="border-amber-500/30 text-amber-600 bg-amber-500/10 text-xs font-semibold">
                    <Sparkles className="h-3 w-3 mr-1 text-amber-500" />
                    Toko Utama
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {profileSuccessMsg && (
                <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              {profileErrorMsg && (
                <div className="mb-4 p-3.5 rounded-xl bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{profileErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4 w-full">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="store-name" className="text-xs font-semibold">
                      Nama Toko / Outlet <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="store-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="pl-9 rounded-xl"
                        placeholder="Contoh: Dapur Roti Senopati"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="store-category" className="text-xs font-semibold">
                      Kategori Bisnis <span className="text-destructive">*</span>
                    </Label>
                    <select
                      id="store-category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 rounded-xl h-9 text-sm border border-input bg-background text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {STORE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="store-phone" className="text-xs font-semibold">
                      Nomor Telepon / WhatsApp Bisnis
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="store-phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0812-xxxx-xxxx"
                        className="pl-9 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="store-location" className="text-xs font-semibold">
                      Alamat Fisik / Dapur Produksi
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="store-location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Contoh: Jl. Senopati No. 45, Jakarta Selatan"
                        className="pl-9 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Mata Uang Operasional</Label>
                    <Input
                      value="IDR (Rp - Rupiah Indonesia)"
                      disabled
                      className="rounded-xl bg-muted/40 text-muted-foreground text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Zona Waktu Gerai</Label>
                    <Input
                      value="Asia/Jakarta (WIB - UTC+7)"
                      disabled
                      className="rounded-xl bg-muted/40 text-muted-foreground text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="store-desc" className="text-xs font-semibold">
                    Deskripsi Singkat / Catatan Operasional
                  </Label>
                  <Textarea
                    id="store-desc"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tuliskan keterangan mengenai fokus produksi, spesialisasi menu, atau jam operasional gerai..."
                    className="rounded-xl min-h-[90px]"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" className="rounded-xl shadow-sm px-6 font-semibold" disabled={isSavingProfile}>
                    {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan Perubahan Toko
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= TAB 2: ANGGOTA TIM & STAF ================= */}
        <TabsContent value="staff" className="mt-4 space-y-4">
          {/* Quick Staff Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="rounded-xl border-border shadow-xs bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Total Anggota</span>
                <Users className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold font-mono mt-1 text-foreground">{staffList.length}</p>
              <span className="text-[11px] text-muted-foreground">Staf terdaftar di outlet ini</span>
            </Card>
            <Card className="rounded-xl border-border shadow-xs bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Pemilik (Owner)</span>
                <ShieldCheck className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold font-mono mt-1 text-foreground">
                {staffList.filter((s) => s.role === "OWNER").length}
              </p>
              <span className="text-[11px] text-muted-foreground">Akses penuh seluruh fitur</span>
            </Card>
            <Card className="rounded-xl border-border shadow-xs bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Staf Operasional</span>
                <UserCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold font-mono mt-1 text-foreground">
                {staffList.filter((s) => s.role === "STAFF").length}
              </p>
              <span className="text-[11px] text-muted-foreground">Akses pencatatan stok & POS</span>
            </Card>
          </div>

          <Card className="rounded-xl shadow-sm border-border w-full">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>Anggota Tim Toko: {store?.name}</span>
                  </CardTitle>
                  <CardDescription>
                    Kelola hak akses staf yang dapat mencatat stok bahan, resep produksi, dan kasir POS di toko ini.
                  </CardDescription>
                </div>
                <Button onClick={() => setIsInviteOpen(true)} className="rounded-xl shadow-sm font-semibold" size="sm">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Undang Staf Baru
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {staffList.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-foreground">Belum Ada Staf Tambahan</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Undang barista, chef dapur, atau kasir Anda agar mereka dapat membantu operasional toko.
                    </p>
                  </div>
                  <Button onClick={() => setIsInviteOpen(true)} variant="outline" size="sm" className="rounded-xl text-xs">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Undang Staf Pertama
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Nama Anggota</TableHead>
                        <TableHead>Email Akun</TableHead>
                        <TableHead>Peran / Role</TableHead>
                        <TableHead>Tanggal Bergabung</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[80px] text-center"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staffList.map((st) => (
                        <TableRow key={st.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-foreground">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs uppercase shrink-0">
                                {st.name ? st.name.substring(0, 2) : "ST"}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span>{st.name}</span>
                                {st.username && (
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    @{st.username}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="text-muted-foreground text-xs font-mono">
                            {st.email}
                          </TableCell>

                          <TableCell>
                            {st.role === "OWNER" ? (
                              <Badge variant="default" className="bg-amber-600 hover:bg-amber-600 text-white gap-1 text-[10px]">
                                <ShieldCheck className="h-3 w-3" /> Pemilik (Owner)
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1 text-[10px]">
                                <UserCheck className="h-3 w-3" /> Staf Operasional
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(st.joinedAt)}
                          </TableCell>

                          <TableCell>
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

                          <TableCell className="text-center">
                            {st.role !== "OWNER" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRevokingStaff(st)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg h-7 px-2 text-xs"
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
        <TabsContent value="roles" className="mt-4 space-y-5">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4 rounded-xl border border-border shadow-xs">
              <span className="text-xs text-muted-foreground font-medium">Total Peran</span>
              <p className="text-2xl font-bold font-mono mt-1 text-foreground">
                {rolesList.length}
              </p>
              <span className="text-[11px] text-muted-foreground">Peran aktif di toko</span>
            </Card>

            <Card className="p-4 rounded-xl border border-border shadow-xs">
              <span className="text-xs text-muted-foreground font-medium">Peran Bawaan Sistem</span>
              <p className="text-2xl font-bold font-mono mt-1 text-foreground">
                {rolesList.filter((r) => r.is_system).length}
              </p>
              <span className="text-[11px] text-muted-foreground">Template standar RBAC</span>
            </Card>

            <Card className="p-4 rounded-xl border border-border shadow-xs">
              <span className="text-xs text-muted-foreground font-medium">Peran Kustom Toko</span>
              <p className="text-2xl font-bold font-mono mt-1 text-primary">
                {rolesList.filter((r) => !r.is_system).length}
              </p>
              <span className="text-[11px] text-muted-foreground">Dibuat khusus pengguna</span>
            </Card>

            <Card className="p-4 rounded-xl border border-border shadow-xs">
              <span className="text-xs text-muted-foreground font-medium">Katalog Hak Akses</span>
              <p className="text-2xl font-bold font-mono mt-1 text-foreground">
                {permissionsCatalog.length}
              </p>
              <span className="text-[11px] text-muted-foreground">
                {Object.keys(PERMISSION_GROUP_INFO).length} Modul Terintegrasi
              </span>
            </Card>
          </div>

          <Card className="rounded-xl shadow-sm border-border w-full">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span>Daftar Peran & Hak Akses Toko</span>
                  </CardTitle>
                  <CardDescription>
                    Kelola wewenang dan izin operasional untuk setiap peran tim staf toko Anda.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => navigate("/settings/role/new")}
                  className="rounded-xl shadow-sm font-semibold"
                  size="sm"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Tambah Peran Baru
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
                  <Table>
                    <TableHeader>
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
                    <TableBody>
                      {rolesList.map((r) => {
                        const isExpanded = expandedRoleIds.includes(r.id)
                        const rolePerms = r.permissions || []
                        const activeGroups = Array.from(new Set(rolePerms.map((p) => p.group)))
                        const isSystem = Boolean(r.is_system)

                        return (
                          <React.Fragment key={r.id}>
                            {/* Main Clickable Row */}
                            <TableRow
                              onClick={() => toggleExpandRole(r.id)}
                              className={`cursor-pointer transition-colors border-b border-border/70 ${
                                isExpanded ? "bg-muted/40 font-medium" : "hover:bg-muted/30"
                              }`}
                            >
                              {/* Nama Peran & Deskripsi */}
                              <TableCell className="py-4 pl-4 align-top">
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`p-2 rounded-xl shrink-0 mt-0.5 transition-colors ${
                                      isExpanded
                                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                                        : "bg-primary/10 text-primary"
                                    }`}
                                  >
                                    <Shield className="h-4 w-4" />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-bold text-sm text-foreground leading-tight">
                                        {r.name}
                                      </p>
                                      {isSystem ? (
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] bg-muted/60 text-muted-foreground border-border py-0 h-4"
                                        >
                                          Sistem
                                        </Badge>
                                      ) : (
                                        <Badge
                                          variant="default"
                                          className="text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-semibold py-0 h-4"
                                        >
                                          Kustom
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-foreground/80 leading-relaxed max-w-md">
                                      {r.description || "Tidak ada deskripsi tambahan untuk peran ini."}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>

                              {/* Jumlah Izin */}
                              <TableCell className="align-top py-4">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                                  {rolePerms.length} Izin
                                </span>
                              </TableCell>

                              {/* Cakupan Modul */}
                              <TableCell className="align-top py-4">
                                <div className="flex flex-wrap gap-1 max-w-[260px]">
                                  {activeGroups.map((grp) => {
                                    const groupInfo = PERMISSION_GROUP_INFO[grp]
                                    return (
                                      <span
                                        key={grp}
                                        className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-background border border-border text-foreground shadow-2xs"
                                      >
                                        {groupInfo?.label
                                          ? groupInfo.label.replace("Akses ", "").replace("Modul ", "")
                                          : grp}
                                      </span>
                                    )
                                  })}
                                </div>
                              </TableCell>

                              {/* Action Buttons */}
                              <TableCell className="text-right align-top py-4 pr-4">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={isSystem}
                                    title={isSystem ? "Peran bawaan sistem tidak dapat diedit" : "Edit peran & izin"}
                                    className="rounded-lg text-xs h-8 px-2.5 gap-1.5 hover:bg-primary/10 hover:text-primary hover:border-primary/40 text-foreground disabled:opacity-40"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      navigate(`/settings/role/${r.id}`)
                                    }}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                    <span>Edit</span>
                                  </Button>

                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className={`rounded-lg text-xs h-8 px-2.5 gap-1.5 transition-all ${
                                      isExpanded
                                        ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground font-bold shadow-xs"
                                        : "hover:bg-primary/10 hover:text-primary hover:border-primary/40 border-border text-foreground font-semibold"
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleExpandRole(r.id)
                                    }}
                                  >
                                    <span>{isExpanded ? "Tutup" : "Izin"}</span>
                                    <ChevronDown
                                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                                        isExpanded ? "rotate-180" : ""
                                      }`}
                                    />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>

                            {/* Expandable Accordion Content Row */}
                            {isExpanded && (
                              <TableRow className="bg-muted/15 hover:bg-muted/15 border-b border-border/80">
                                <TableCell colSpan={5} className="p-4 pl-6 sm:pl-10">
                                  <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4 animate-in fade-in-50 duration-200">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-border">
                                      <div>
                                        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                          <Layers className="h-4 w-4 text-primary" />
                                          <span>Rincian Lengkap Hak Akses: {r.name}</span>
                                        </h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                          Daftar wewenang tindakan yang diizinkan untuk staf dengan peran ini.
                                        </p>
                                      </div>
                                      <Badge variant="secondary" className="font-mono text-xs px-2.5 py-1 font-bold shrink-0 self-start sm:self-auto">
                                        {rolePerms.length} dari {permissionsCatalog.length} Izin Tersedia
                                      </Badge>
                                    </div>

                                    {rolePerms.length === 0 ? (
                                      <div className="py-6 text-center text-xs text-muted-foreground">
                                        Peran ini belum memiliki hak akses aktif.
                                      </div>
                                    ) : (
                                      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                                        {Object.entries(
                                          rolePerms.reduce((acc, p) => {
                                            acc[p.group] = acc[p.group] || []
                                            acc[p.group].push(p)
                                            return acc
                                          }, {} as Record<string, Permission[]>)
                                        ).map(([grp, perms]) => {
                                          const groupInfo = PERMISSION_GROUP_INFO[grp]
                                          return (
                                            <div
                                              key={grp}
                                              className="rounded-xl border border-border/80 p-3 bg-muted/25 space-y-2.5 shadow-2xs"
                                            >
                                              <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
                                                <span className="text-xs font-bold text-foreground">
                                                  {groupInfo?.label || grp}
                                                </span>
                                                <span className="text-[10px] font-bold text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                                                  {perms.length} izin
                                                </span>
                                              </div>

                                              <div className="space-y-1.5">
                                                {perms.map((p) => (
                                                  <div
                                                    key={p.id || p.code}
                                                    className="p-2.5 rounded-lg bg-card border border-border/70 text-xs flex items-start gap-2.5 shadow-2xs"
                                                  >
                                                    <div className="p-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">
                                                      <Check className="h-3 w-3 stroke-[3]" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                      <p className="font-bold text-foreground text-xs leading-tight">
                                                        {p.name}
                                                      </p>
                                                      {p.description && (
                                                        <p className="text-[11px] text-foreground/80 leading-snug mt-0.5">
                                                          {p.description}
                                                        </p>
                                                      )}
                                                      <span className="inline-block font-mono text-[9px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.2 rounded font-bold mt-1.5">
                                                        {p.code}
                                                      </span>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= TAB 4: DAFTAR CABANG TOKO ================= */}
        <TabsContent value="stores" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Daftar Cabang & Toko Bisnis</h3>
              <p className="text-xs text-muted-foreground">
                Pilih atau beralih cabang untuk mengelola stok bahan dan laporan HPP cabang terkait.
              </p>
            </div>
            <Button onClick={() => setIsNewStoreOpen(true)} className="rounded-xl shadow-sm font-semibold" size="sm">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Tambah Cabang Baru
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2.5 rounded-xl ${isCurrent ? "bg-primary text-white shadow-sm" : "bg-muted text-muted-foreground"}`}>
                          <Store className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-bold text-foreground">
                            {s.name}
                          </CardTitle>
                          <span className="text-[11px] text-muted-foreground">{s.category}</span>
                        </div>
                      </div>
                      {isCurrent && (
                        <Badge variant="default" className="text-[10px] gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          <Check className="h-3 w-3" /> Aktif
                        </Badge>
                      )}
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
                        <Button variant="outline" size="sm" className="rounded-xl text-xs h-8 cursor-default" disabled>
                          Sedang Aktif
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSwitchStore(s.id)}
                          className="rounded-xl text-xs h-8 hover:bg-primary/10 hover:text-primary border-primary/20"
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
      </Tabs>

      {/* Modal Undang Staf */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Undang Anggota Tim Baru</DialogTitle>
            <DialogDescription className="text-xs">
              Kirimkan undangan untuk bergabung mengelola toko <strong>{store?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          {inviteError && (
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{inviteError}</span>
            </div>
          )}

          <form onSubmit={handleInviteSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="staff-name" className="text-xs font-semibold">
                Nama Lengkap Staf <span className="text-destructive">*</span>
              </Label>
              <Input
                id="staff-name"
                value={inviteData.name}
                onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                placeholder="Contoh: Rina Kusuma"
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="staff-email" className="text-xs font-semibold">
                Alamat Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="staff-email"
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                placeholder="Contoh: rina@tokoroti.com"
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Peran / Hak Akses</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-between rounded-xl h-9 text-xs">
                    <span className={cn("truncate", !inviteData.role_id && "text-muted-foreground")}>
                      {inviteData.role_id
                        ? getRoleDisplayName(rolesList.find((r) => r.id === inviteData.role_id)?.name || "")
                        : "Pilih peran..."}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] rounded-xl max-h-56 overflow-y-auto" align="start">
                  {rolesList.map((r) => (
                    <DropdownMenuItem
                      key={r.id}
                      onClick={() => setInviteData({ ...inviteData, role_id: r.id })}
                      className="cursor-pointer text-xs flex flex-col items-start gap-0.5 py-1.5"
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
                onClick={() => setIsInviteOpen(false)}
                className="rounded-xl text-xs"
                disabled={isInviting}
              >
                Batal
              </Button>
              <Button type="submit" className="rounded-xl text-xs font-semibold" disabled={isInviting}>
                {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kirim Undangan
              </Button>
            </DialogFooter>
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

      {/* Modal Detail Hak Akses Peran */}
      <Dialog
        open={!!selectedRoleDetail}
        onOpenChange={(open) => !open && setSelectedRoleDetail(null)}
      >
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] flex flex-col rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-3 border-b border-border/60">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold">
                      {selectedRoleDetail?.name}
                    </DialogTitle>
                    <p className="text-[11px] font-mono text-muted-foreground">
                      ID: {selectedRoleDetail?.name}
                    </p>
                  </div>
                </div>
              </div>

              {selectedRoleDetail?.is_system ? (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-muted/60 text-muted-foreground border-border"
                >
                  Bawaan Sistem
                </Badge>
              ) : (
                <Badge
                  variant="default"
                  className="text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-semibold"
                >
                  Peran Kustom
                </Badge>
              )}
            </div>
            <DialogDescription className="text-xs pt-2">
              {selectedRoleDetail?.description || "Tidak ada deskripsi tambahan untuk peran ini."}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 pt-4 flex-1 overflow-y-auto space-y-4 pr-4">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-border/50">
              <span className="font-semibold text-foreground">
                Daftar Izin Aktif ({selectedRoleDetail?.permissions?.length || 0})
              </span>
              <span className="text-[11px] text-muted-foreground">
                {selectedRoleDetail?.is_system
                  ? "Standar hak akses sistem terproteksi"
                  : "Dikonfigurasi khusus toko"}
              </span>
            </div>

            {(!selectedRoleDetail?.permissions || selectedRoleDetail.permissions.length === 0) ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Peran ini belum memiliki hak akses aktif.
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(
                  (selectedRoleDetail.permissions || []).reduce((acc, p) => {
                    acc[p.group] = acc[p.group] || []
                    acc[p.group].push(p)
                    return acc
                  }, {} as Record<string, Permission[]>)
                ).map(([grp, perms]) => {
                  const groupInfo = PERMISSION_GROUP_INFO[grp]
                  return (
                    <div key={grp} className="rounded-xl border border-border/60 p-3 bg-muted/15 space-y-2">
                      <span className="text-xs font-bold text-foreground block">
                        {groupInfo?.label || grp}
                      </span>
                      <div className="grid gap-1.5 sm:grid-cols-2">
                        {perms.map((p) => (
                          <div
                            key={p.id || p.code}
                            className="p-2 rounded-lg bg-background border border-border/60 text-xs flex items-center gap-2"
                          >
                            <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-foreground leading-tight truncate">
                                {p.name}
                              </p>
                              <span className="font-mono text-[9px] text-muted-foreground">
                                {p.code}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t border-border/60 bg-muted/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedRoleDetail(null)}
              className="rounded-xl text-xs w-full sm:w-auto"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                Nama Cabang / Toko <span className="text-destructive">*</span>
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
