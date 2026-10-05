import * as React from "react"
import { useSearchParams } from "react-router-dom"
import {
  Settings,
  User,
  Shield,
  KeyRound,
  Laptop,
  Smartphone,
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  Trash2,
  Camera,
  Phone,
  Mail,
  RefreshCw,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { useAccountSettings } from "@/features/settings/hooks"
import { cn } from "@/lib/utils"

interface AccountTabItem {
  value: string
  label: string
  icon: React.ElementType
  className?: string
}

const ACCOUNT_TABS: AccountTabItem[] = [
  {
    value: "profile",
    label: "Profil Pengguna",
    icon: User,
  },
  {
    value: "security",
    label: "Keamanan & Sesi",
    icon: Shield,
  },
  {
    value: "danger",
    label: "Zona Bahaya",
    icon: AlertOctagon,
    className: "text-destructive hover:text-destructive data-[state=active]:text-destructive data-[state=active]:bg-destructive/10",
  },
]

export default function GeneralSettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") || "profile"

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val }, { replace: true })
  }

  // --- UI Only States ---
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState<boolean>(false)
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = React.useState<boolean>(false)

  // --- API & State Logic from Hook ---
  const {
    currentUser,
    loadingInitial,
    name,
    setName,
    email,
    setEmail,
    phone,
    setPhone,
    bio,
    setBio,
    avatarUrl,
    setAvatarUrl,
    isSavingProfile,
    profileMsg,
    profileError,
    handleSaveProfile,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordLoading,
    passwordMsg,
    passwordError,
    handleChangePassword,
    sessions,
    sessionsLoading,
    loadSessions,
    handleRevokeSession,
    handleRevokeOtherSessions,
    deleteConfirmText,
    setDeleteConfirmText,
    isDeletingAccount,
    handleDeleteAccount,
  } = useAccountSettings()

  if (loadingInitial) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2.5 text-sm text-muted-foreground">Memuat pengaturan akun & profil...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-500 w-full">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Pengaturan & Profil Akun
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola profil pemilik usaha, keamanan akun, dan preferensi kalkulasi HPP.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-flow-col auto-cols-fr rounded-xl bg-muted/60 p-1 border border-border h-auto w-full sm:w-auto sm:inline-grid gap-1">
          {ACCOUNT_TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "rounded-lg text-xs font-semibold py-2 transition-all whitespace-nowrap",
                  tab.className
                )}
              >
                <Icon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                {tab.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* ================= TAB 1: PROFIL PENGGUNA ================= */}
        <TabsContent value="profile" className="mt-4 space-y-6">
          <Card className="rounded-xl shadow-sm border-border w-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Informasi Profil Akun</CardTitle>
                  <CardDescription>
                    Data profil pengelola yang ditampilkan di header dan catatan riwayat operasional toko.
                  </CardDescription>
                </div>
                <Badge variant="default" className="bg-primary text-primary-foreground text-[10px] font-bold">
                  {currentUser?.role || "OWNER"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {profileMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{profileMsg}</span>
                </div>
              )}

              {profileError && (
                <div className="p-3.5 rounded-xl bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <Avatar className="h-20 w-20 border-2 border-primary/20 shadow-md">
                      <AvatarImage src={avatarUrl} alt={name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                        {name ? name.substring(0, 2).toUpperCase() : "US"}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => {
                        const newUrl = prompt("Masukkan URL avatar foto baru:", avatarUrl)
                        if (newUrl) setAvatarUrl(newUrl)
                      }}
                      className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                      title="Ganti Foto"
                    >
                      <Camera className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-foreground">{name || "Pengguna HPP"}</span>
                      <span className="text-emerald-600 font-semibold text-xs flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" /> Terverifikasi
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{email}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Klik avatar atau tombol di samping untuk mengganti foto profil Anda.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => {
                    const newUrl = prompt("Masukkan URL foto profil baru:", avatarUrl)
                    if (newUrl) setAvatarUrl(newUrl)
                  }}
                >
                  <Camera className="mr-1.5 h-3.5 w-3.5" />
                  Ubah Foto Profil
                </Button>
              </div>

              {/* Profile Details Form */}
              <form onSubmit={handleSaveProfile} className="space-y-5 w-full">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="prof-name" className="text-xs font-semibold">
                      Nama Lengkap <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="prof-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                        className="pl-9 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="prof-email" className="text-xs font-semibold">
                      Alamat Email <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="prof-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama@tokoroti.com"
                        className="pl-9 rounded-xl"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="prof-phone" className="text-xs font-semibold">
                      Nomor Telepon / WhatsApp
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="prof-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0812-3456-7890"
                        className="pl-9 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Peran Akun (Role)</Label>
                    <Input
                      value={currentUser?.role === "OWNER" ? "Pemilik Usaha (Owner)" : "Staf Operasional"}
                      disabled
                      className="rounded-xl bg-muted/40 text-muted-foreground text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="prof-bio" className="text-xs font-semibold">
                    Bio Singkat / Catatan Jabatan
                  </Label>
                  <Textarea
                    id="prof-bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Contoh: Pemilik Toko Roti Enak & Praktisi Kuliner UMKM"
                    rows={3}
                    className="rounded-xl text-sm"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" className="rounded-xl shadow-sm font-semibold px-6" disabled={isSavingProfile}>
                    {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan Perubahan Profil
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= TAB 2: KEAMANAN & SESI ================= */}
        <TabsContent value="security" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Change Password Card */}
            <Card className="rounded-xl shadow-sm border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  Ubah Kata Sandi
                </CardTitle>
                <CardDescription>
                  Gunakan kata sandi yang kuat untuk menjaga keamanan data finansial toko Anda.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {passwordMsg && (
                  <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{passwordMsg}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="mb-4 p-3.5 rounded-xl bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 w-full">
                  <div className="space-y-1.5">
                    <Label htmlFor="old-pass" className="text-xs font-semibold">
                      Kata Sandi Saat Ini
                    </Label>
                    <Input
                      id="old-pass"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="rounded-xl"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="new-pass" className="text-xs font-semibold">
                        Kata Sandi Baru
                      </Label>
                      <Input
                        id="new-pass"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="rounded-xl"
                        placeholder="Minimal 6 karakter"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="conf-pass" className="text-xs font-semibold">
                        Konfirmasi Sandi Baru
                      </Label>
                      <Input
                        id="conf-pass"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="rounded-xl"
                        placeholder="Ulangi kata sandi"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" variant="default" className="rounded-xl shadow-sm px-6 font-semibold" disabled={passwordLoading}>
                      {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Perbarui Kata Sandi
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* 2FA Card */}
            <Card className="rounded-xl shadow-sm border-border flex flex-col justify-between">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Autentikasi Dua Faktor (2FA)
                </CardTitle>
                <CardDescription>
                  Tingkatkan keamanan akun Anda dengan verifikasi OTP saat masuk dari perangkat baru.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">Aplikasi Authenticator (TOTP)</span>
                      <Badge variant={twoFactorEnabled ? "default" : "secondary"} className="text-[10px]">
                        {twoFactorEnabled ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                    <Switch
                      checked={twoFactorEnabled}
                      onCheckedChange={(checked) => {
                        setTwoFactorEnabled(checked)
                        if (checked) {
                          alert("Fitur 2FA TOTP akan aktif pada sesi login berikutnya.")
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Gunakan aplikasi seperti Google Authenticator atau 1Password untuk menghasilkan kode verifikasi sekali pakai demi perlindungan maksimal.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
                  <span className="font-semibold block mb-0.5">Catatan Keamanan:</span>
                  Pastikan nomor telepon dan email akun Anda selalu aktif untuk pemulihan akses jika kehilangan perangkat autentikator.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Sessions Card (Full Width) */}
          <Card className="rounded-xl shadow-sm border-border w-full">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Laptop className="h-4 w-4 text-primary" />
                    Manajemen Sesi Perangkat Aktif
                  </CardTitle>
                  <CardDescription>
                    Daftar perangkat yang saat ini memiliki akses login aktif ke akun bisnis Anda.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={loadSessions}
                    className="rounded-xl text-xs"
                    disabled={sessionsLoading}
                  >
                    <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${sessionsLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                  {sessions.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRevokeOtherSessions}
                      className="rounded-xl text-xs text-destructive border-destructive/20 hover:bg-destructive/10"
                    >
                      <LogOut className="mr-1.5 h-3.5 w-3.5" />
                      Logout Sesi Lain
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 w-full">
                {sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                        {sess.type === "mobile" ? (
                          <Smartphone className="h-5 w-5" />
                        ) : (
                          <Laptop className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {sess.device || "Browser Sesi"}
                          </span>
                          {sess.isCurrent && (
                            <Badge variant="default" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              Sesi Saat Ini
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>{sess.browser || "Chrome"}</span>
                          <span>&bull;</span>
                          <span>{sess.location || "Indonesia"}</span>
                          <span>&bull;</span>
                          <span>Aktif: {sess.lastActive}</span>
                        </div>
                      </div>
                    </div>

                    {!sess.isCurrent && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeSession(sess.id)}
                        className="rounded-xl text-xs text-destructive hover:bg-destructive/10"
                      >
                        Keluar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= TAB 4: ZONA BERBAHAYA ================= */}
        <TabsContent value="danger" className="mt-4 space-y-6">
          <Card className="rounded-xl shadow-sm border-destructive/30 bg-destructive/5 w-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-base text-destructive flex items-center gap-2">
                <AlertOctagon className="h-5 w-5" />
                Zona Berbahaya (Danger Zone)
              </CardTitle>
              <CardDescription>
                Tindakan di bagian ini memiliki dampak permanen terhadap akun dan akses data bisnis Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logout All Devices */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border border-destructive/20 bg-background gap-3">
                <div>
                  <span className="font-semibold text-sm text-foreground block">
                    Keluar dari Semua Perangkat
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Batalkan seluruh token sesi aktif di perangkat lain. Anda harus login ulang setelah ini.
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10 text-xs shrink-0"
                  onClick={handleRevokeOtherSessions}
                >
                  <LogOut className="h-3.5 w-3.5 mr-1.5" />
                  Logout Semua Sesi Lain
                </Button>
              </div>

              {/* Delete Account */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border border-destructive/20 bg-background gap-3">
                <div>
                  <span className="font-semibold text-sm text-destructive block">
                    Hapus Akun & Seluruh Data Toko
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Data stok, resep produksi, riwayat pembelian, dan laporan penjualan akan dihapus secara permanen.
                  </span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="rounded-xl text-xs shrink-0"
                  onClick={() => setIsDeleteAccountOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Hapus Akun Permanen
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={isDeleteAccountOpen} onOpenChange={setIsDeleteAccountOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertOctagon className="h-5 w-5" />
              Konfirmasi Penghapusan Akun
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tindakan ini tidak dapat dibatalkan. Seluruh data transaksi, resep, dan inventaris toko Anda akan dihapus permanen.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label className="text-xs font-semibold text-foreground">
              Ketik <span className="font-mono text-destructive font-bold">&quot;HAPUS AKUN&quot;</span> untuk melanjutkan:
            </Label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="HAPUS AKUN"
              className="rounded-xl font-mono text-sm"
            />
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteAccountOpen(false)
                setDeleteConfirmText("")
              }}
              className="rounded-xl text-xs"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmText !== "HAPUS AKUN" || isDeletingAccount}
              onClick={handleDeleteAccount}
              className="rounded-xl text-xs"
            >
              {isDeletingAccount && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Hapus Akun Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
