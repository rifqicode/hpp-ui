import { useSearchParams } from "react-router-dom"
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
  CheckSquare,
  Square,
  Eye,
} from "lucide-react"

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

const PERMISSION_GROUP_INFO: Record<string, { label: string; desc: string }> = {
  MENU: {
    label: "Akses Halaman & Modul Menu",
    desc: "Wewenang membuka halaman navigasi utama sistem",
  },
  STOCKS: {
    label: "Operasional Stok & Gudang",
    desc: "Melihat, menambah, mengubah, dan stock opname bahan baku",
  },
  RECIPES: {
    label: "Formula Resep & Biaya HPP",
    desc: "Menyusun resep produksi dan menentukan target margin laba",
  },
  PRODUCTS: {
    label: "Katalog Produk Siap Jual",
    desc: "Mengelola produk etalase dan harga jual konsumen",
  },
  SALES: {
    label: "Kasir & Transaksi POS",
    desc: "Pencatatan kasir, riwayat pesanan, dan pembatalan nota (void)",
  },
  STAFF: {
    label: "Manajemen Tim & Hak Akses",
    desc: "Mengundang staf dan mendelegasikan wewenang akses",
  },
  SETTINGS: {
    label: "Pengaturan Toko & Outlet",
    desc: "Mengubah identitas toko, cabang, dan preferensi perhitungan",
  },
}

export default function StoreSettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") || "profile"

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val }, { replace: true })
  }

  const {
    loading,
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
    isCreateRoleOpen,
    setIsCreateRoleOpen,
    newRoleData,
    setNewRoleData,
    isCreatingRole,
    createRoleError,
    selectedRoleDetail,
    setSelectedRoleDetail,
    handleCreateRole,
    togglePermission,
    toggleGroupPermissions,
    handleSelectAllPermissions,
    handleClearAllPermissions,
    isNewStoreOpen,
    setIsNewStoreOpen,
    newStoreData,
    setNewStoreData,
    isCreatingStore,
    createStoreError,
    handleCreateStore,
    handleSwitchStore,
  } = useStoreSettings()

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
    if (found) return found.displayName
    if (roleName === "OWNER" || roleName === "STORE_OWNER") return "Pemilik Toko (Owner)"
    if (roleName === "STORE_MANAGER") return "Manajer Operasional"
    if (roleName === "STORE_CASHIER") return "Kasir (POS)"
    if (roleName === "STORE_KITCHEN") return "Tim Dapur & Produksi"
    if (roleName === "STAFF") return "Staf Operasional"
    return roleName
  }

  const TABS = [
    { id: "profile", label: "Profil Toko", icon: Building2 },
    { id: "staff", label: `Anggota Tim (${staffList.length})`, icon: Users },
    { id: "roles", label: `Peran & Hak Akses (${rolesList.length})`, icon: ShieldCheck },
    { id: "stores", label: `Daftar Cabang (${storesList.length})`, icon: Store },
  ] as const

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2.5 text-sm text-muted-foreground">Memuat pengaturan toko...</span>
      </div>
    )
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
              <TabsTrigger key={tab.id} value={tab.id} className="rounded-lg text-xs font-semibold py-2">
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
                              <span>{st.name}</span>
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
                {rolesList.filter((r) => r.isSystem).length}
              </p>
              <span className="text-[11px] text-muted-foreground">Template standar RBAC</span>
            </Card>

            <Card className="p-4 rounded-xl border border-border shadow-xs">
              <span className="text-xs text-muted-foreground font-medium">Peran Kustom Toko</span>
              <p className="text-2xl font-bold font-mono mt-1 text-primary">
                {rolesList.filter((r) => !r.isSystem).length}
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
                  onClick={() => setIsCreateRoleOpen(true)}
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
                    onClick={() => setIsCreateRoleOpen(true)}
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Tambah Peran Pertama
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {rolesList.map((r) => {
                    const rolePerms = r.permissions || []
                    const activeGroups = Array.from(new Set(rolePerms.map((p) => p.group)))

                    return (
                      <Card
                        key={r.id}
                        className="rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-all flex flex-col justify-between"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                  <Shield className="h-4 w-4 text-primary shrink-0" />
                                  <span>{r.displayName}</span>
                                </CardTitle>
                              </div>
                              <p className="text-[11px] font-mono text-muted-foreground">
                                ID: {r.name}
                              </p>
                            </div>

                            {r.isSystem ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-muted/60 text-muted-foreground border-border shrink-0"
                              >
                                Bawaan Sistem
                              </Badge>
                            ) : (
                              <Badge
                                variant="default"
                                className="text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-semibold shrink-0"
                              >
                                Peran Kustom
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-xs line-clamp-2 pt-1">
                            {r.description || "Tidak ada deskripsi tambahan untuk peran ini."}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-3 pt-0 pb-4">
                          <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground font-medium flex items-center gap-1">
                                <Layers className="h-3.5 w-3.5 text-primary" />
                                Cakupan Hak Akses:
                              </span>
                              <Badge variant="secondary" className="text-[10px] font-mono">
                                {rolePerms.length} Izin Aktif
                              </Badge>
                            </div>

                            {activeGroups.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {activeGroups.map((grp) => {
                                  const groupInfo = PERMISSION_GROUP_INFO[grp]
                                  return (
                                    <span
                                      key={grp}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-background border border-border text-foreground/80"
                                    >
                                      {groupInfo?.label || grp}
                                    </span>
                                  )
                                })}
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic">
                                Belum ada izin yang terhubung
                              </span>
                            )}
                          </div>

                          <div className="pt-1 flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">
                              {r.createdAt ? `Dibuat: ${formatDate(r.createdAt)}` : "Tersedia secara global"}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRoleDetail(r)}
                              className="rounded-lg text-xs h-7 gap-1 border-primary/20 hover:bg-primary/5 hover:text-primary"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Lihat Rincian Izin
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
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
                    <span className="truncate">
                      {getRoleDisplayName(inviteData.role)}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] rounded-xl max-h-56 overflow-y-auto" align="start">
                  {rolesList.map((r) => (
                    <DropdownMenuItem
                      key={r.id}
                      onClick={() => setInviteData({ ...inviteData, role: r.name })}
                      className="cursor-pointer text-xs flex flex-col items-start gap-0.5 py-1.5"
                    >
                      <div className="flex items-center gap-1.5 w-full justify-between">
                        <span className="font-semibold text-foreground">{r.displayName}</span>
                        {r.isSystem ? (
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

      {/* Modal Tambah Peran & Hak Akses Baru */}
      <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
        <DialogContent className="sm:max-w-[680px] max-h-[92vh] flex flex-col rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Tambah Peran & Hak Akses Baru</DialogTitle>
                <DialogDescription className="text-xs">
                  Buat peran khusus dan tentukan izin modul apa saja yang dapat diakses oleh staf.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {createRoleError && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{createRoleError}</span>
            </div>
          )}

          <form onSubmit={handleCreateRole} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 pt-4 space-y-4 flex-1 overflow-y-auto pr-4">
              {/* Form Input Peran */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="role-display-name" className="text-xs font-semibold">
                    Nama Tampilan Peran <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="role-display-name"
                    value={newRoleData.displayName}
                    onChange={(e) => {
                      const val = e.target.value
                      setNewRoleData((prev) => ({
                        ...prev,
                        displayName: val,
                        name:
                          !prev.name ||
                          prev.name ===
                            prev.displayName.trim().toUpperCase().replace(/\s+/g, "_")
                            ? val.trim().toUpperCase().replace(/\s+/g, "_")
                            : prev.name,
                      }))
                    }}
                    placeholder="Contoh: Supervisor Toko"
                    className="rounded-xl text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="role-code" className="text-xs font-semibold">
                    Kode Identifier Sistem <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="role-code"
                    value={newRoleData.name}
                    onChange={(e) =>
                      setNewRoleData({
                        ...newRoleData,
                        name: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                      })
                    }
                    placeholder="Contoh: STORE_SUPERVISOR"
                    className="rounded-xl text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role-description" className="text-xs font-semibold">
                  Deskripsi Peran
                </Label>
                <Textarea
                  id="role-description"
                  value={newRoleData.description}
                  onChange={(e) =>
                    setNewRoleData({ ...newRoleData, description: e.target.value })
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
                      <span>Pilih Hak Akses & Izin Modul ({newRoleData.permissionCodes.length} / {permissionsCatalog.length})</span>
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
                    }, {} as Record<string, Permission[]>)
                  ).map(([grp, perms]) => {
                    const allGroupSelected = perms.every((p) =>
                      newRoleData.permissionCodes.includes(p.code)
                    )
                    const groupInfo = PERMISSION_GROUP_INFO[grp]

                    return (
                      <div
                        key={grp}
                        className="rounded-xl border border-border/70 p-3 bg-muted/20 space-y-2.5 transition-all"
                      >
                        <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
                          <div>
                            <span className="text-xs font-bold text-foreground">
                              {groupInfo?.label || grp}
                            </span>
                            <p className="text-[10px] text-muted-foreground">
                              {groupInfo?.desc || "Daftar hak akses modul sistem"}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleGroupPermissions(grp, !allGroupSelected)}
                            className="text-[10px] h-6 px-2 text-primary hover:text-primary hover:bg-primary/10 rounded-md font-medium"
                          >
                            {allGroupSelected ? "Batalkan Grup" : "Pilih Semua"}
                          </Button>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                          {perms.map((p) => {
                            const isChecked = newRoleData.permissionCodes.includes(p.code)
                            return (
                              <div
                                key={p.id || p.code}
                                onClick={() => togglePermission(p.code)}
                                className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-2 select-none ${
                                  isChecked
                                    ? "bg-primary/10 border-primary/40 shadow-2xs"
                                    : "bg-background border-border hover:border-border/80 hover:bg-muted/40"
                                }`}
                              >
                                <div className="pt-0.5">
                                  {isChecked ? (
                                    <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                                  ) : (
                                    <Square className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                                  )}
                                </div>
                                <div className="space-y-0.5 min-w-0">
                                  <span className="text-xs font-semibold text-foreground block leading-tight">
                                    {p.name}
                                  </span>
                                  <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                                    {p.description || "Akses fungsional sistem"}
                                  </p>
                                  <span className="inline-block font-mono text-[9px] text-primary/80 bg-primary/5 px-1 rounded">
                                    {p.code}
                                  </span>
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
            </div>

            <DialogFooter className="p-4 border-t border-border/60 bg-muted/20 sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateRoleOpen(false)}
                className="rounded-xl text-xs"
                disabled={isCreatingRole}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="rounded-xl text-xs font-semibold"
                disabled={isCreatingRole}
              >
                {isCreatingRole && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Peran Baru
              </Button>
            </DialogFooter>
          </form>
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
                      {selectedRoleDetail?.displayName}
                    </DialogTitle>
                    <p className="text-[11px] font-mono text-muted-foreground">
                      ID: {selectedRoleDetail?.name}
                    </p>
                  </div>
                </div>
              </div>

              {selectedRoleDetail?.isSystem ? (
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
                {selectedRoleDetail?.isSystem
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
