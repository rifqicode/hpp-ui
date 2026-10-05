# GEMINI.md - Panduan Teknis & Standar Koding Repository

Dokumen ini adalah panduan teknis bagi developer dan AI agent yang bekerja di repositori ini. Fokus dokumen ini **murni teknis**: struktur repository, standar koding, arsitektur frontend, dan workflow pengembangan.

---

## 1. Tech Stack & Environment

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Bahasa**: [TypeScript](https://www.typescriptlang.org/) (Strict type checking via `tsc -b`)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + `tailwind-merge` + `clsx`
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (`useAuthStore`)
- **Routing**: [React Router DOM v7](https://reactrouter.com/)
- **HTTP Client**: [Axios](https://axios-http.com/) dengan interceptor otomatis

---

## 2. Struktur Direktori Repository

Repositori menggunakan arsitektur berbasis fitur (*feature-based modular architecture*):

```text
src/
├── assets/                 # Asset statis (gambar, SVG, icons)
├── components/
│   ├── layout/             # Komponen shell (DashboardLayout, SidebarMain, Topbar)
│   └── ui/                 # Atomic UI primitives dari shadcn/ui (Button, Dialog, Tabs, Table, dll.)
├── features/               # Modul fitur bisnis terisolasi
│   └── <feature_name>/     # Contoh: settings, inventory, recipes, production, sales, auth
│       ├── types/          # Definisi interface TypeScript & DTOs
│       ├── services/       # Layer HTTP client murni (pemanggilan endpoint via apiClient)
│       └── hooks/          # Custom React hooks (state management, handlers, lifecycle)
├── hooks/                  # Reusable hooks lintas fitur (use-mobile, use-permission, use-table-data)
├── lib/
│   ├── api-client.ts       # Axios instance singleton + interceptors token & unwrapper
│   └── utils.ts            # Helper umum (cn untuk class merge, formatter)
├── pages/                  # Halaman aplikasi (Murni Presentational View)
│   ├── auth/
│   ├── dashboard/
│   ├── inventory/
│   ├── production/
│   ├── recipes/
│   ├── sales/
│   └── settings/
├── store/                  # Global client store via Zustand (use-auth-store.ts)
├── App.tsx                 # Routing table & route protection
└── main.tsx                # Entry point aplikasi
```

---

## 3. Standar Koding & Aturan Arsitektur (Architecture Rules)

### 3.1. Aturan Wajib: Pemisahan Layer Halaman & Logic (The Hooks Layer)
> [!IMPORTANT]
> **DILARANG KERAS** memanggil `apiClient` / Axios atau fungsi `*Service` secara langsung di dalam file halaman (`src/pages/*`).

- **Pages (`src/pages/*`)**:
  - Murni bertindak sebagai **Presentational View**.
  - Hanya mengonsumsi data, flag status (`loading`, `error`), dan event handler dari custom hook.
  - Berisi rendering JSX, dialog modal UI states, dan styling layout.
- **Custom Hooks (`src/features/<feature>/hooks/`)**:
  - Mengelola seluruh state data fetching (`useState`, `useCallback`, `useEffect`).
  - Menangani error handling (`try/catch`), feedback message (`errorMsg`, `successMsg`), dan indikator loading (`isLoading`).
  - Berkomunikasi langsung dengan service layer (`*Service`).
- **Services (`src/features/<feature>/services/`)**:
  - Kumpulan fungsi async murni tanpa React state.
  - Memanggil backend API menggunakan instance `apiClient`.

### 3.2. Pola Penulisan Custom Hook
Setiap fitur baru atau refaktorisasi wajib mengikuti template berikut:

```tsx
// src/features/<feature>/hooks/use-<feature>.ts
import * as React from "react"
import { featureService } from "../services/feature-service"
import type { FeatureItem } from "../types"

export function useFeature() {
  const [data, setData] = React.useState<FeatureItem[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string>("")

  const loadData = React.useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const result = await featureService.getItems()
      setData(result)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memuat data"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreate = async (payload: unknown) => {
    // Mutation logic...
    await featureService.createItem(payload)
    await loadData()
  }

  return {
    data,
    loading,
    error,
    loadData,
    handleCreate,
  }
}
```

### 3.3. HTTP Client & Header Protocol (`apiClient`)
Semua komunikasi HTTP wajib melalui [`src/lib/api-client.ts`](file:///home/rifqicode/project/hpp/hpp-ui/src/lib/api-client.ts):
- **Request Interceptor**:
  - Mengambil token sesi dari `localStorage.getItem('token')` $\rightarrow$ disuntikkan ke header `Authorization: Bearer <token>`.
  - Mengambil store aktif dari Zustand store (`useAuthStore.getState().activeStoreId`) $\rightarrow$ disuntikkan ke header `X-Store-ID: <activeStoreId>`.
- **Response Interceptor**:
  - Secara otomatis meng-unwrap format response backend `{ success: true, message: "...", data: T }` menjadi objek `data` murni (`response.data`).

### 3.4. Aturan Komponen & UI

1. **Komponen Dinamis (Contoh: Navigation Tabs)**:
   - Jangan melakukan hardcode jumlah kolom (seperti `grid-cols-4` jika jumlah tab berbeda).
   - Simpan daftar konfigurasi tab dalam bentuk array (`const TABS = [...] as const`) dan render dengan `.map()`.
   - Gunakan layout fleksibel: `grid grid-flow-col auto-cols-fr gap-1` agar lebar tab terbagi proporsional secara otomatis.

2. **Sinkronisasi Tab dengan URL Query Param**:
   - Untuk tab atau filter yang tersinkron dengan URL (`?tab=...`), gunakan *derived state* langsung dari query param:
     ```tsx
     const [searchParams, setSearchParams] = useSearchParams()
     const activeTab = searchParams.get("tab") || "defaultTab"

     const handleTabChange = (val: string) => {
       setSearchParams({ tab: val }, { replace: true })
     }
     ```
   - **DILARANG** menggunakan `setState` di dalam `useEffect` hanya untuk menyinkronkan tab URL, karena akan memicu lint error React 19 (`react-hooks/set-state-in-effect`) dan cascading re-renders.

3. **Styling & Class Merging**:
   - Selalu gunakan helper `cn(...)` dari `@/lib/utils` untuk menggabungkan class conditionally:
     ```tsx
     import { cn } from "@/lib/utils"
     <div className={cn("base-class", isActive && "active-class", className)} />
     ```

4. **Type Safety**:
   - Dilarang menggunakan tipe data `any` secara sembarangan.
   - Definisikan tipe DTO, entity, dan parameter request pada file `types/index.ts` di masing-masing feature folder.

---

## 4. Script & Workflow Pengembangan

Jalankan perintah berikut dari direktori root `hpp-ui`:

| Perintah | Fungsi | Catatan |
|---|---|---|
| `npm run dev` | Menjalankan Vite local dev server | Default berjalan di `http://localhost:5173` |
| `npm run build` | Menjalankan type check & build bundle | Menjalankan `tsc -b` terlebih dahulu, lalu `vite build` |
| `npm run lint` | Menjalankan ESLint | Memeriksa kepatuhan aturan React Hooks & TypeScript |
| `npm run preview`| Preview hasil binary dist lokal | Menjalankan server lokal dari folder `dist/` |

---

*Setiap perubahan fitur baru atau refaktorisasi kode wajib lolos uji `npm run build` tanpa error tipe data.*
