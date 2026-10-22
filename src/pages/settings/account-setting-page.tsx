import * as React from "react"
import { useInitialLoading } from "@/hooks/use-initial-loading"
import { useSearchParams } from "react-router-dom"
import { User, Shield, KeyRound, Laptop, Smartphone, AlertOctagon, CheckCircle2, AlertCircle, Loader2, Trash2, Camera, RefreshCw, Eye, EyeOff } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

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
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserAvatar } from "@/components/ui/user-avatar"
import { ProfilePhotoDialog } from "@/features/settings/components/profile-photo-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { useAccountSettings } from "@/features/settings/hooks"

const ACCOUNT_TABS = [
  { value: "profile", label: "Profil Pengguna", description: "Identitas & kontak", icon: User },
  { value: "security", label: "Keamanan & Sesi", description: "Kata sandi & perangkat", icon: Shield },
  { value: "danger", label: "Zona Bahaya", description: "Penghapusan akun", icon: AlertOctagon },
] as const

interface PasswordFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  visible: boolean
  onToggle: () => void
  autoComplete: string
  placeholder?: string
}

function PasswordField({ id, label, value, onChange, visible, onToggle, autoComplete, placeholder }: PasswordFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium">{label}</Label>
      <div className="relative">
        <Input id={id} type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} placeholder={placeholder} required className="h-11 pr-12 text-sm" />
        <button type="button" aria-label={`${visible ? "Sembunyikan" : "Tampilkan"} ${label.toLowerCase()}`} aria-pressed={visible} onClick={onToggle} className="absolute right-0 top-0 flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}</button>
      </div>
    </div>
  )
}

export default function GeneralSettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get("tab")
  const activeTab = ACCOUNT_TABS.some((tab) => tab.value === requestedTab) ? requestedTab! : "profile"
  const isCompactLayout = useIsMobile(1280)

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val }, { replace: true })
  }

  // --- UI Only States ---
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = React.useState<boolean>(false)
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = React.useState<boolean>(false)
  const [showOldPassword, setShowOldPassword] = React.useState<boolean>(false)
  const [showNewPassword, setShowNewPassword] = React.useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState<boolean>(false)

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
    handleUpdateAvatar,
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
    revokingSessionId,
    deleteConfirmText,
    setDeleteConfirmText,
    isDeletingAccount,
    deleteError,
    handleDeleteAccount,
  } = useAccountSettings()

  const isStaff =
    currentUser?.account_type?.toUpperCase() === "STAFF" ||
    (!currentUser?.account_type && currentUser?.role?.toUpperCase() === "STAFF")
  const accountRoleLabel = isStaff ? "Staf" : "Pemilik Akun"

  const isInitialLoading = useInitialLoading(loadingInitial)
  if (isInitialLoading) {
    // Global LoadingOverlay renders the spinner on top of this placeholder
    return <div className="min-h-[60vh]" />
  }

  return (
    <div className="w-full min-w-0 space-y-5 pb-8">
      <header>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Pengaturan & Profil Akun</h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Kelola profil pribadi, kata sandi, dan perangkat yang terhubung.</p>
      </header>

      <Tabs value={activeTab} onValueChange={handleTabChange} orientation={isCompactLayout ? "horizontal" : "vertical"} className="grid min-w-0 items-start gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
        <aside aria-label="Bagian pengaturan akun" className="min-w-0 xl:sticky xl:top-0">
          <TabsList aria-label="Pengaturan akun" className="grid h-auto w-full grid-cols-2 justify-start gap-1 rounded-xl border bg-card p-1.5 sm:grid-cols-3 xl:grid-cols-1">
            {ACCOUNT_TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <TabsTrigger key={tab.value} value={tab.value} aria-label={tab.label} className={`group/account-tab min-h-11 min-w-0 justify-start gap-2 rounded-lg px-2.5 py-2.5 text-left text-xs font-medium text-muted-foreground shadow-none transition-colors hover:bg-muted/60 hover:text-foreground data-[state=active]:bg-primary data-[state=active]:font-semibold data-[state=active]:text-primary-foreground data-[state=active]:shadow-none data-[state=active]:hover:bg-primary/90 data-[state=active]:hover:text-primary-foreground xl:gap-3 xl:px-3 ${tab.value === "danger" ? "col-span-2 sm:col-span-1" : ""}`}>
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0"><span className="block whitespace-normal leading-4">{tab.label}</span><span className="mt-0.5 hidden text-[10px] font-normal text-muted-foreground group-data-[state=active]/account-tab:text-primary-foreground xl:block">{tab.description}</span></span>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </aside>

        <div className="min-w-0">
          <TabsContent value="profile" className="m-0 min-w-0 space-y-4">
            <Card className="min-w-0 gap-0 border border-border py-0 shadow-none ring-0">
              <CardHeader className="gap-1 border-b px-4 py-4 sm:px-5"><CardTitle className="text-base">Informasi Profil Akun</CardTitle><CardDescription className="text-xs leading-5">Profil ini digunakan untuk mengenali Anda di catatan aktivitas toko.</CardDescription></CardHeader>
              <CardContent className="p-0">
                <form onSubmit={handleSaveProfile}>
                  <fieldset disabled={isSavingProfile} className="space-y-6 p-4 sm:p-5">
                    {profileMsg && <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"><CheckCircle2 className="size-4 shrink-0" /><span>{profileMsg}</span></div>}
                    {profileError && <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive"><AlertCircle className="size-4 shrink-0" /><span>{profileError}</span></div>}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <button type="button" onClick={() => setIsPhotoDialogOpen(true)} aria-label="Ganti foto lewat avatar" className="relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                          <UserAvatar src={avatarUrl} name={name} className="size-16 shadow-none" fallbackClassName="text-xl" />
                          <span className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full border bg-card text-muted-foreground"><Camera className="size-3" aria-hidden="true" /></span>
                        </button>
                        <div className="min-w-0"><p className="break-words text-sm font-semibold">{name || "Pengguna HPP"}</p><Badge variant="secondary" className="mt-1.5 text-[10px]">{accountRoleLabel}</Badge></div>
                      </div>
                      <Button type="button" variant="outline" onClick={() => setIsPhotoDialogOpen(true)} className="h-10 gap-1.5 text-xs"><Camera className="size-3.5" />Ubah Foto Profil</Button>
                    </div>
                    <section aria-labelledby="account-identity-heading" className="space-y-4 border-t pt-5">
                      <div><h2 id="account-identity-heading" className="text-sm font-semibold">Identitas pengguna</h2><p className="mt-1 text-xs text-muted-foreground">Nama dan email untuk akun Anda.</p></div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5"><Label htmlFor="prof-name" className="text-xs font-medium">Nama Lengkap <span className="text-destructive">*</span></Label><Input id="prof-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Nama lengkap Anda" required className="h-11 text-sm" /></div>
                        <div className="space-y-1.5"><Label htmlFor="prof-email" className="text-xs font-medium">Alamat Email <span className="text-destructive">*</span></Label><Input id="prof-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="email@example.com" required className="h-11 text-sm" /></div>
                      </div>
                    </section>
                    <section aria-labelledby="account-contact-heading" className="space-y-4 border-t pt-5">
                      <div><h2 id="account-contact-heading" className="text-sm font-semibold">Kontak & catatan</h2><p className="mt-1 text-xs text-muted-foreground">Tambahkan nomor kontak dan informasi singkat tentang Anda.</p></div>
                      <div className="space-y-1.5 sm:max-w-sm"><Label htmlFor="prof-phone" className="text-xs font-medium">Nomor Telepon / WhatsApp</Label><Input id="prof-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" placeholder="Nomor telepon Anda" className="h-11 text-sm" /></div>
                      <div className="space-y-1.5"><Label htmlFor="prof-bio" className="text-xs font-medium">Bio Singkat / Catatan Jabatan</Label><Textarea id="prof-bio" value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Jabatan atau tanggung jawab Anda di toko" rows={3} className="min-h-24 text-sm" /></div>
                    </section>
                  </fieldset>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-4 py-4 sm:px-5"><p className="text-[11px] text-muted-foreground">Perubahan disimpan ke akun ini.</p><Button type="submit" disabled={isSavingProfile} className="h-11 w-full gap-2 text-xs sm:w-auto">{isSavingProfile && <Loader2 className="size-4 animate-spin" />}Simpan Perubahan Profil</Button></div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="m-0 min-w-0 space-y-4">
            <Card className="min-w-0 gap-0 border border-border py-0 shadow-none ring-0">
              <CardHeader className="gap-1 border-b px-4 py-4 sm:px-5"><CardTitle className="flex items-center gap-2 text-base"><KeyRound className="size-4 text-primary" />Ubah Kata Sandi</CardTitle><CardDescription className="text-xs leading-5">Gunakan kata sandi yang kuat dan berbeda dari kata sandi sebelumnya.</CardDescription></CardHeader>
              <CardContent className="p-0">
                <form onSubmit={handleChangePassword}>
                  <fieldset disabled={passwordLoading} className="space-y-4 p-4 sm:p-5">
                    {passwordMsg && <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"><CheckCircle2 className="size-4 shrink-0" /><span>{passwordMsg}</span></div>}
                    {passwordError && <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive"><AlertCircle className="size-4 shrink-0" /><span>{passwordError}</span></div>}
                    <div className="grid items-start gap-4 lg:grid-cols-3">
                      <PasswordField id="old-pass" label="Kata Sandi Saat Ini" value={currentPassword} onChange={setCurrentPassword} visible={showOldPassword} onToggle={() => setShowOldPassword(!showOldPassword)} autoComplete="current-password" />
                      <div className="space-y-2"><PasswordField id="new-pass" label="Kata Sandi Baru" value={newPassword} onChange={setNewPassword} visible={showNewPassword} onToggle={() => setShowNewPassword(!showNewPassword)} autoComplete="new-password" placeholder="Minimal 8 karakter" /><PasswordStrengthIndicator password={newPassword} /></div>
                      <PasswordField id="conf-pass" label="Konfirmasi Sandi Baru" value={confirmPassword} onChange={setConfirmPassword} visible={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} autoComplete="new-password" placeholder="Ulangi kata sandi baru" />
                    </div>
                  </fieldset>
                  <div className="flex justify-end border-t bg-muted/20 px-4 py-4 sm:px-5"><Button type="submit" disabled={passwordLoading} className="h-11 w-full gap-2 text-xs sm:w-auto">{passwordLoading && <Loader2 className="size-4 animate-spin" />}Perbarui Kata Sandi</Button></div>
                </form>
              </CardContent>
            </Card>

            <Card className="min-w-0 gap-0 border border-border py-0 shadow-none ring-0">
              <CardHeader className="border-b px-4 py-4 sm:px-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="text-base">Perangkat & sesi aktif</CardTitle><CardDescription className="mt-1 text-xs leading-5">Lihat perangkat yang terhubung dan cabut sesi yang tidak digunakan.</CardDescription></div><Button type="button" variant="outline" size="sm" onClick={loadSessions} disabled={sessionsLoading} className="h-10 gap-1.5 text-xs"><RefreshCw className={`size-3.5 ${sessionsLoading ? "animate-spin motion-reduce:animate-none" : ""}`} />Refresh</Button></div></CardHeader>
              <CardContent className="p-4 sm:p-5">
                {sessionsLoading ? <p role="status" className="py-8 text-center text-xs text-muted-foreground">Memuat sesi perangkat...</p> : sessions.length === 0 ? <p className="py-8 text-center text-xs text-muted-foreground">Sesi perangkat belum tersedia. Klik Refresh untuk mencoba lagi.</p> : <div className="divide-y overflow-hidden rounded-xl border">{sessions.map((session) => (
                  <div key={session.id} className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4">
                    <div className="flex min-w-0 flex-1 basis-52 items-start gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">{session.type === "mobile" ? <Smartphone className="size-4" /> : <Laptop className="size-4" />}</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="break-words text-sm font-medium">{session.device || "Perangkat tidak dikenal"}</span>{session.isCurrent && <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">Sesi Saat Ini</Badge>}</div><p className="mt-1 break-words text-xs leading-5 text-muted-foreground">{[session.browser, session.location].filter(Boolean).join(" · ")}</p>{session.lastActive && <p className="mt-0.5 text-[11px] text-muted-foreground">Aktif: {session.lastActive}</p>}</div></div>
                    {!session.isCurrent && <Button type="button" variant="outline" onClick={() => handleRevokeSession(session.id)} disabled={revokingSessionId !== null} className="h-10 w-full shrink-0 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto">{revokingSessionId === session.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}Hapus Sesi</Button>}
                  </div>
                ))}</div>}
              </CardContent>
            </Card>

            <div className="flex items-start gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50/20 dark:border-emerald-900/50 dark:bg-emerald-950/10 p-4 sm:p-5">
              <Shield className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold">Autentikasi Dua Faktor (2FA)</h2>
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                    Proteksi Aktif
                  </Badge>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  Autentikasi dua faktor berbasis perangkat (Adaptive 2FA) aktif secara otomatis. Setiap kali Anda masuk dari browser atau perangkat baru yang belum terdaftar, kode verifikasi 6 digit akan dikirimkan ke email Anda untuk melindungi akun dari akses tidak sah.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="danger" className="m-0 min-w-0 space-y-4">
            <Card className="min-w-0 gap-0 border border-destructive/30 py-0 shadow-none ring-0">
              <CardHeader className="gap-1 border-b border-destructive/20 px-4 py-4 sm:px-5"><CardTitle className="flex items-center gap-2 text-base text-destructive"><AlertOctagon className="size-5" />Zona Bahaya</CardTitle><CardDescription className="text-xs leading-5">Penghapusan akun bersifat permanen dan tidak dapat dibatalkan.</CardDescription></CardHeader>
              <CardContent className="p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 flex-1 basis-60"><h2 className="text-sm font-semibold">Hapus Akun & Seluruh Data Toko</h2><p className="mt-2 max-w-lg text-xs leading-5 text-muted-foreground">Data stok, resep produksi, riwayat pembelian, dan laporan penjualan akan dihapus secara permanen.</p></div><Button variant="destructive" onClick={() => setIsDeleteAccountOpen(true)} className="h-11 w-full shrink-0 gap-1.5 text-xs sm:w-auto"><Trash2 className="size-3.5" />Hapus Akun Permanen</Button></div></CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={isDeleteAccountOpen} onOpenChange={(open) => {
        if (isDeletingAccount) return
        setIsDeleteAccountOpen(open)
        if (!open) setDeleteConfirmText("")
      }}>
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

          {deleteError && (
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          <div className="space-y-3 py-2">
            <Label htmlFor="delete-account-confirmation" className="text-xs font-semibold text-foreground">
              Ketik <span className="font-mono text-destructive font-bold">&quot;HAPUS AKUN&quot;</span> untuk melanjutkan:
            </Label>
            <Input
              id="delete-account-confirmation"
              disabled={isDeletingAccount}
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="HAPUS AKUN"
              className="rounded-xl font-mono text-sm"
            />
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              disabled={isDeletingAccount}
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

      {/* Profile Photo Upload Dialog */}
      <ProfilePhotoDialog
        open={isPhotoDialogOpen}
        onOpenChange={setIsPhotoDialogOpen}
        currentAvatarUrl={avatarUrl}
        userName={name}
        onSave={handleUpdateAvatar}
      />
    </div>
  )
}
