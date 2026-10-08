import * as React from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import {
  Factory,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  User,
  ShieldCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { authService } from "@/features/auth/services/auth-service"
import type { InviteDetailsResponse } from "@/features/auth/types"
import { useAuthStore } from "@/store/use-auth-store"

export default function AcceptInvitePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") || ""
  const setAuth = useAuthStore((state) => state.setAuth)

  const [loading, setLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string>("")
  const [invite, setInvite] = React.useState<InviteDetailsResponse | null>(null)

  // Form states for new user
  const [name, setName] = React.useState<string>("")
  const [password, setPassword] = React.useState<string>("")
  const [confirmPassword, setConfirmPassword] = React.useState<string>("")
  const [showPassword, setShowPassword] = React.useState<boolean>(false)
  const [submitting, setSubmitting] = React.useState<boolean>(false)
  const [formError, setFormError] = React.useState<string>("")

  React.useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setError("Tautan undangan tidak memiliki token yang valid.")
        setLoading(false)
        return
      }

      try {
        const details = await authService.getInviteDetails(token)
        setInvite(details)
        setName(details.name || "")
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Tautan undangan tidak valid atau telah kadaluarsa."
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    verifyToken()
  }, [token])

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault()
    setFormError("")

    if (!name.trim()) {
      setFormError("Nama lengkap wajib diisi.")
      return
    }

    if (password.length < 6) {
      setFormError("Kata sandi minimal 6 karakter.")
      return
    }

    if (password !== confirmPassword) {
      setFormError("Konfirmasi kata sandi tidak cocok.")
      return
    }

    setSubmitting(true)
    try {
      const res = await authService.acceptInvite({
        token,
        name: name.trim(),
        password,
      })

      setAuth(res.user, res.token)
      if (res.active_store_id) {
        useAuthStore.getState().setActiveStoreId(res.active_store_id)
      }

      navigate("/dashboard")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menerima undangan."
      setFormError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <Factory className="h-5 w-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">
            HPP Tracker
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <Card className="rounded-2xl border-border/60 shadow-lg">
            <CardContent className="pt-8 pb-8 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">
                Memvalidasi tautan undangan...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {!loading && error && (
          <Card className="rounded-2xl border-border/60 shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-2">
                <AlertCircle className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg font-bold">Undangan Tidak Valid</CardTitle>
              <CardDescription className="text-xs pt-1">
                {error}
              </CardDescription>
            </CardHeader>
            <CardFooter className="pt-4">
              <Button
                onClick={() => navigate("/login")}
                className="w-full rounded-xl text-xs font-semibold"
              >
                Kembali ke Halaman Masuk
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Existing User State */}
        {!loading && !error && invite && invite.is_existing_user && (
          <Card className="rounded-2xl border-border/60 shadow-lg">
            <CardHeader className="text-center pb-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 mb-2">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg font-bold">Akses Toko Sudah Aktif</CardTitle>
              <CardDescription className="text-xs pt-1">
                Akun Anda (<strong className="text-foreground">{invite.email}</strong>) sudah terdaftar di sistem.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-1">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" /> Toko:
                  </span>
                  <span className="font-semibold text-foreground">{invite.store_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" /> Peran:
                  </span>
                  <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                    {invite.role_name}
                  </Badge>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Anda tidak perlu mengatur ulang kata sandi. Anda dapat langsung membuka toko ini melalui menu dashboard.
              </p>
            </CardContent>

            <CardFooter className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => navigate("/dashboard")}
                className="w-full rounded-xl text-xs font-semibold gap-1.5 shadow-md shadow-primary/20"
              >
                Buka Dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <Link
                to="/login"
                className="text-[11px] text-muted-foreground hover:text-foreground text-center"
              >
                Masuk dengan akun lain
              </Link>
            </CardFooter>
          </Card>
        )}

        {/* New User Set-Password State */}
        {!loading && !error && invite && !invite.is_existing_user && (
          <Card className="rounded-2xl border-border/60 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold">Atur Kata Sandi & Bergabung</CardTitle>
              <CardDescription className="text-xs pt-1">
                Anda diundang bergabung ke{" "}
                <strong className="text-foreground">{invite.store_name}</strong> sebagai{" "}
                <strong className="text-foreground">{invite.role_name}</strong>.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleAccept}>
              <CardContent className="space-y-3.5 pt-1">
                {formError && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-xs font-semibold">
                      Alamat Email
                    </Label>
                    <Input
                      id="email"
                      value={invite.email}
                      disabled
                      className="rounded-xl bg-muted/40 text-xs font-mono"
                    />
                  </div>

                  {invite.username && (
                    <div className="space-y-1">
                      <Label htmlFor="username" className="text-xs font-semibold">
                        Username Login
                      </Label>
                      <Input
                        id="username"
                        value={invite.username}
                        disabled
                        className="rounded-xl bg-primary/5 border-primary/20 text-primary text-xs font-mono font-semibold"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="name" className="text-xs font-semibold">
                    Nama Lengkap <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Masukkan nama lengkap Anda"
                      className="rounded-xl pl-9 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs font-semibold">
                    Kata Sandi Baru <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="rounded-xl pl-9 pr-9 text-xs"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirm-password" className="text-xs font-semibold">
                    Konfirmasi Kata Sandi <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi"
                      className="rounded-xl pl-9 text-xs"
                      required
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2 flex flex-col gap-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl text-xs font-semibold shadow-md shadow-primary/20"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Buat Kata Sandi & Masuk
                </Button>
                <Link
                  to="/login"
                  className="text-[11px] text-muted-foreground hover:text-foreground text-center"
                >
                  Sudah punya akun? Masuk di sini
                </Link>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </div>
  )
}
