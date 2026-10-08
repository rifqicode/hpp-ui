import * as React from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/use-auth-store"
import { authService } from "@/features/auth/services/auth-service"
import { settingsService } from "@/features/settings/services/settings-service"
import type { DeviceSession } from "@/features/settings/types"
import type { User as UserType } from "@/features/auth/types"

function formatAccountErrorMessage(err: unknown, fallback: string): string {
  const msg = err instanceof Error ? err.message : fallback
  if (!msg || msg.startsWith("Request failed with status code")) {
    return fallback
  }

  const lower = msg.toLowerCase()
  if (lower.includes("current password does not match") || lower.includes("current password is incorrect")) {
    return "Kata sandi saat ini salah atau tidak sesuai."
  }
  if (lower.includes("new password must be at least 6 characters")) {
    return "Kata sandi baru minimal 6 karakter."
  }
  if (lower.includes("new password must be different")) {
    return "Kata sandi baru harus berbeda dari kata sandi saat ini."
  }
  if (lower.includes("email is already registered") || lower.includes("email is already in use")) {
    return "Email sudah digunakan oleh akun lain."
  }
  if (lower.includes("username is already")) {
    return "Username sudah digunakan oleh akun lain."
  }
  if (lower.includes("invalid password payload")) {
    return "Data kata sandi tidak valid. Periksa kembali input Anda."
  }
  if (lower.includes("user not found")) {
    return "Akun pengguna tidak ditemukan."
  }

  return msg
}

export function useAccountSettings() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const setAuth = useAuthStore((state) => state.setAuth)
  const logout = useAuthStore((state) => state.logout)

  const [loadingInitial, setLoadingInitial] = React.useState<boolean>(true)

  // Profile States
  const [name, setName] = React.useState<string>(currentUser?.name || "")
  const [email, setEmail] = React.useState<string>(currentUser?.email || "")
  const [phone, setPhone] = React.useState<string>(currentUser?.phone || "")
  const [bio, setBio] = React.useState<string>(currentUser?.bio || "")
  const [avatarUrl, setAvatarUrl] = React.useState<string>(currentUser?.avatar || "")

  const [isSavingProfile, setIsSavingProfile] = React.useState<boolean>(false)
  const [profileMsg, setProfileMsg] = React.useState<string>("")
  const [profileError, setProfileError] = React.useState<string>("")

  // Password States
  const [currentPassword, setCurrentPassword] = React.useState<string>("")
  const [newPassword, setNewPassword] = React.useState<string>("")
  const [confirmPassword, setConfirmPassword] = React.useState<string>("")
  const [passwordLoading, setPasswordLoading] = React.useState<boolean>(false)
  const [passwordMsg, setPasswordMsg] = React.useState<string>("")
  const [passwordError, setPasswordError] = React.useState<string>("")

  // Sessions States
  const [sessions, setSessions] = React.useState<DeviceSession[]>([])
  const [sessionsLoading, setSessionsLoading] = React.useState<boolean>(false)

  // Danger Zone States
  const [deleteConfirmText, setDeleteConfirmText] = React.useState<string>("")
  const [isDeletingAccount, setIsDeletingAccount] = React.useState<boolean>(false)
  const [deleteError, setDeleteError] = React.useState<string>("")

  // Load Sessions
  const loadSessions = React.useCallback(async () => {
    try {
      setSessionsLoading(true)
      const data = await settingsService.getSessions()
      if (data && data.length > 0) {
        setSessions(data)
      } else {
        setSessions([
          {
            id: "current-sess",
            device: "Perangkat Ini (Aktif)",
            browser: "Browser",
            location: "Indonesia",
            lastActive: "Sekarang",
            isCurrent: true,
            type: "desktop",
          },
        ])
      }
    } catch {
      // Keep existing sessions on error
    } finally {
      setSessionsLoading(false)
    }
  }, [])

  // Initial Data Load
  React.useEffect(() => {
    async function loadData() {
      setLoadingInitial(true)
      try {
        const usr = await authService.getCurrentUser().catch(() => null)

        if (usr?.user) {
          setName(usr.user.name || "")
          setEmail(usr.user.email || "")
          setPhone(usr.user.phone || "")
          setBio(usr.user.bio || "")
          if (usr.user.avatar) setAvatarUrl(usr.user.avatar)
        }

        await loadSessions()
      } catch (err) {
        console.error("Failed to load settings data:", err)
      } finally {
        setLoadingInitial(false)
      }
    }

    loadData()
  }, [loadSessions])

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setProfileError("Nama dan email wajib diisi.")
      return
    }

    setIsSavingProfile(true)
    setProfileError("")
    setProfileMsg("")

    try {
      const updated = await authService.updateProfile({
        name,
        email,
        phone,
        bio,
        avatar: avatarUrl,
      })

      if (token) {
        setAuth(updated as UserType, token)
      }
      setProfileMsg("Profil pengguna berhasil disimpan!")
      setTimeout(() => setProfileMsg(""), 3500)
    } catch (err: unknown) {
      const msg = formatAccountErrorMessage(err, "Gagal menyimpan perubahan profil.")
      setProfileError(msg)
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Change Password Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")
    setPasswordMsg("")

    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi kata sandi baru tidak cocok.")
      return
    }

    if (newPassword.length < 6) {
      setPasswordError("Kata sandi baru minimal 6 karakter.")
      return
    }

    setPasswordLoading(true)
    try {
      await settingsService.changePassword(currentPassword, newPassword)
      setPasswordMsg("Kata sandi akun Anda berhasil diperbarui!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setPasswordMsg(""), 4000)
    } catch (err: unknown) {
      const msg = formatAccountErrorMessage(err, "Gagal memperbarui kata sandi. Periksa kata sandi saat ini.")
      setPasswordError(msg)
    } finally {
      setPasswordLoading(false)
    }
  }

  const [revokingSessionId, setRevokingSessionId] = React.useState<string | null>(null)

  // Revoke Single Session
  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId)
    try {
      await settingsService.revokeSession(sessionId)
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    } catch (err) {
      const msg = formatAccountErrorMessage(err, "Gagal menghapus sesi.")
      console.error(msg)
      alert(msg)
    } finally {
      setRevokingSessionId(null)
    }
  }

  // Revoke All Other Sessions
  const handleRevokeOtherSessions = async () => {
    try {
      await settingsService.revokeOtherSessions()
      setSessions((prev) => prev.filter((s) => s.isCurrent))
      alert("Semua sesi di perangkat lain berhasil dinonaktifkan.")
    } catch (err) {
      const msg = formatAccountErrorMessage(err, "Gagal membatalkan sesi perangkat lain.")
      console.error(msg)
      alert(msg)
    }
  }

  // Delete Account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "HAPUS AKUN") return
    setIsDeletingAccount(true)
    setDeleteError("")
    try {
      await settingsService.deleteAccount()
      logout()
      navigate("/login", { replace: true })
    } catch (err) {
      const msg = formatAccountErrorMessage(err, "Gagal menghapus akun.")
      setDeleteError(msg)
      setIsDeletingAccount(false)
    }
  }

  return {
    currentUser,
    loadingInitial,

    // Profile
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

    // Password
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

    // Sessions
    sessions,
    sessionsLoading,
    loadSessions,
    handleRevokeSession,
    handleRevokeOtherSessions,
    revokingSessionId,

    // Danger Zone
    deleteConfirmText,
    setDeleteConfirmText,
    isDeletingAccount,
    deleteError,
    handleDeleteAccount,
  }
}
