import * as React from "react"
import {
  Calculator,
  Boxes,
  ChefHat,
  ShoppingCart,
  CheckCircle2,
  TrendingUp,
  Search,
  Clock,
  ClipboardCheck,
  ReceiptText,
  ChartNoAxesCombined,
  Building2,
  ShieldCheck,
  UsersRound,
  MessageSquareText,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface FeatureItem {
  id: string
  title: string
  shortTitle: string
  tagline: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  badgeText: string
  badgeColor: string
}

interface AdditionalFeature extends FeatureItem {
  preview: {
    title: string
    path: string
    subtitle: string
    columns: [string, string]
    rows: [string, string][]
    resultLabel: string
    result: string
    note: string
  }
}

const ADDITIONAL_FEATURES: AdditionalFeature[] = [
  {
    "id": "purchases",
    "title": "Pembelian & Supplier",
    "shortTitle": "Belanja",
    "tagline": "Riwayat belanja lebih mudah ditelusuri.",
    "description": "Kelola pemasok dan pesanan pembelian dari pengajuan hingga barang diterima. Stok bahan tercatat saat penerimaan selesai.",
    "icon": ClipboardCheck,
    "badgeText": "PO & Supplier",
    "badgeColor": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "preview": {
        "title": "Pembelian bahan minggu ini",
        "path": "inventory/purchase-orders",
        "subtitle": "Pengajuan, persetujuan, dan penerimaan tercatat.",
        "columns": [
            "Pesanan",
            "Status"
        ],
        "rows": [
            [
                "PO-014 · Susu segar",
                "Diterima"
            ],
            [
                "PO-015 · Biji kopi",
                "Disetujui"
            ],
            [
                "PO-016 · Kemasan",
                "Draf"
            ]
        ],
        "resultLabel": "Setelah barang diterima",
        "result": "Stok bahan bertambah",
        "note": "Harga dan batch pembelian tersimpan untuk penelusuran biaya."
    }
},
  {
    "id": "simulation",
    "title": "Simulasi Resep & Produksi",
    "shortTitle": "Simulasi",
    "tagline": "Rencanakan biaya sebelum mulai masak.",
    "description": "Coba takaran, biaya, dan target harga jual. Periksa kebutuhan bahan serta perkiraan biaya sebelum menjalankan produksi.",
    "icon": Calculator,
    "badgeText": "Simulasi biaya",
    "badgeColor": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "preview": {
        "title": "Rencana produksi brownies",
        "path": "production/hpp/production-simulation",
        "subtitle": "Periksa kebutuhan sebelum menjalankan produksi.",
        "columns": [
            "Perencanaan",
            "Estimasi"
        ],
        "rows": [
            [
                "Target produksi",
                "20 potong"
            ],
            [
                "Total kebutuhan biaya",
                "Rp 100.000"
            ],
            [
                "Harga jual per potong",
                "Rp 10.000"
            ]
        ],
        "resultLabel": "Estimasi HPP per potong",
        "result": "Rp 5.000",
        "note": "Angka simulasi membantu perencanaan; HPP aktual mengikuti hasil produksi."
    }
},
  {
    "id": "overheads",
    "title": "Tenaga Kerja & Overhead",
    "shortTitle": "Biaya",
    "tagline": "Harga jual punya dasar biaya lebih lengkap.",
    "description": "Masukkan upah, listrik, gas, dan biaya produksi lainnya ke perhitungan HPP. Biaya per porsi mencakup lebih dari bahan baku.",
    "icon": ReceiptText,
    "badgeText": "Biaya produksi",
    "badgeColor": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "preview": {
        "title": "Biaya produksi satu batch",
        "path": "production/overheads",
        "subtitle": "Bahan, tenaga kerja, dan overhead masuk perhitungan.",
        "columns": [
            "Komponen biaya",
            "Jumlah"
        ],
        "rows": [
            [
                "Bahan baku",
                "Rp 80.000"
            ],
            [
                "Tenaga kerja",
                "Rp 15.000"
            ],
            [
                "Gas dan listrik",
                "Rp 5.000"
            ]
        ],
        "resultLabel": "Total biaya batch",
        "result": "Rp 100.000",
        "note": "Dengan hasil 20 potong, HPP aktual menjadi Rp 5.000 per potong."
    }
},
  {
    "id": "dashboard",
    "title": "Dashboard Operasional & HPP",
    "shortTitle": "Dashboard",
    "tagline": "Lebih cepat tahu yang perlu diperhatikan.",
    "description": "Lihat produksi aktif, stok menipis, bahan mendekati kedaluwarsa, hingga ringkasan penjualan dan margin produk.",
    "icon": ChartNoAxesCombined,
    "badgeText": "Ringkasan usaha",
    "badgeColor": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "preview": {
        "title": "Ringkasan penjualan hari ini",
        "path": "dashboard",
        "subtitle": "Pantau biaya dan laba kotor dari satu ringkasan.",
        "columns": [
            "Ringkasan",
            "Nilai"
        ],
        "rows": [
            [
                "Penjualan",
                "Rp 1.200.000"
            ],
            [
                "HPP produk terjual",
                "Rp 600.000"
            ],
            [
                "Laba kotor",
                "Rp 600.000"
            ]
        ],
        "resultLabel": "Margin laba kotor",
        "result": "50%",
        "note": "Dashboard operasional juga menampilkan stok menipis dan batch mendekati kedaluwarsa."
    }
},
  {
    "id": "stores",
    "title": "Kelola Beberapa Toko",
    "shortTitle": "Toko",
    "tagline": "Tetap teratur saat usaha bertambah cabang.",
    "description": "Pindah antar toko dari satu akun. Stok, resep, produksi, dan transaksi tersimpan sesuai toko yang sedang dikelola.",
    "icon": Building2,
    "badgeText": "Multi-toko",
    "badgeColor": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "preview": {
        "title": "Satu akun, beberapa toko",
        "path": "settings/store",
        "subtitle": "Setiap toko memiliki catatan operasionalnya sendiri.",
        "columns": [
            "Toko",
            "Catatan data"
        ],
        "rows": [
            [
                "Kedai Pusat",
                "Stok & transaksi terpisah"
            ],
            [
                "Kedai Selatan",
                "Stok & transaksi terpisah"
            ],
            [
                "Dapur Produksi",
                "Stok & transaksi terpisah"
            ]
        ],
        "resultLabel": "Saat berpindah toko",
        "result": "Data mengikuti toko aktif",
        "note": "Jumlah toko yang dapat dikelola mengikuti paket langganan."
    }
},
  {
    "id": "staff",
    "title": "Tim & Hak Akses Staf",
    "shortTitle": "Tim",
    "tagline": "Delegasikan pekerjaan dengan akses yang jelas.",
    "description": "Undang staf dan tentukan perannya. Atur akses agar setiap anggota tim menggunakan fitur sesuai tanggung jawabnya.",
    "icon": ShieldCheck,
    "badgeText": "Peran & izin",
    "badgeColor": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "preview": {
        "title": "Pembagian akses tim",
        "path": "settings?tab=staff",
        "subtitle": "Tentukan peran sesuai pekerjaan masing-masing.",
        "columns": [
            "Anggota tim",
            "Peran contoh"
        ],
        "rows": [
            [
                "Dina",
                "Kasir"
            ],
            [
                "Raka",
                "Produksi"
            ],
            [
                "Nadia",
                "Pengelola stok"
            ]
        ],
        "resultLabel": "Akses fitur",
        "result": "Sesuai izin peran",
        "note": "Contoh pembagian peran; kustomisasi peran tersedia sesuai paket."
    }
},
  {
    "id": "customers",
    "title": "Data & Riwayat Pelanggan",
    "shortTitle": "Pelanggan",
    "tagline": "Kenali pelanggan yang kembali berbelanja.",
    "description": "Simpan kontak pelanggan dan hubungkan dengan transaksi. Lihat riwayat pesanan, jumlah pembelian, dan total belanjanya.",
    "icon": UsersRound,
    "badgeText": "Riwayat pelanggan",
    "badgeColor": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "preview": {
        "title": "Catatan pelanggan: Maya",
        "path": "sales/customers",
        "subtitle": "Kontak dan transaksi pelanggan tersimpan bersama.",
        "columns": [
            "Informasi",
            "Catatan"
        ],
        "rows": [
            [
                "Jumlah pesanan",
                "8 transaksi"
            ],
            [
                "Total belanja",
                "Rp 640.000"
            ],
            [
                "Pesanan terakhir",
                "Brownies cokelat"
            ]
        ],
        "resultLabel": "Riwayat pesanan",
        "result": "Mudah ditelusuri",
        "note": "Hubungkan pelanggan ke transaksi POS untuk mencatat pembeliannya."
    }
},
  {
    "id": "ai",
    "title": "Asisten AI untuk Data Toko",
    "shortTitle": "AI Chat",
    "tagline": "Mulai dari pertanyaan, pahami data usaha.",
    "description": "Tanyakan stok, produk, produksi, atau penjualan lewat chat. Asisten AI membantu membaca data toko yang sedang aktif.",
    "icon": MessageSquareText,
    "badgeText": "Asisten AI",
    "badgeColor": "bg-indigo-50 text-indigo-700 border-indigo-200",
    "preview": {
        "title": "Tanyakan data usaha lewat chat",
        "path": "store/ai/conversations",
        "subtitle": "Contoh pertanyaan: bahan apa yang stoknya menipis?",
        "columns": [
            "Bahan contoh",
            "Stok tersedia"
        ],
        "rows": [
            [
                "Susu segar",
                "2 liter"
            ],
            [
                "Biji kopi",
                "500 gram"
            ],
            [
                "Cup minuman",
                "40 pcs"
            ]
        ],
        "resultLabel": "Dari pertanyaan ke ringkasan",
        "result": "Lebih mudah memahami data",
        "note": "Ilustrasi hasil percakapan; jawaban mengikuti data toko dan batas penggunaan AI."
    }
},
]

const FEATURES: FeatureItem[] = [
  {
    id: "hpp",
    title: "Kalkulasi Resep & HPP",
    shortTitle: "HPP",
    tagline: "Hitung biaya sesuai takaran resep",
    description:
      "Lihat biaya bahan sesuai takaran resep, lalu pertimbangkan kemasan dan biaya produksi saat menentukan harga jual.",
    icon: Calculator,
    badgeText: "Biaya per porsi",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    id: "inventory",
    title: "Kontrol Stok FIFO & FEFO",
    shortTitle: "Stok",
    tagline: "Prioritaskan bahan yang perlu dipakai lebih dulu",
    description:
      "Pengurangan bahan otomatis berdasarkan tanggal masuk pembelian (FIFO) atau tanggal kedaluwarsa terdekat (FEFO). Histori harga beli per faktur tersimpan rapi tanpa rumus manual.",
    icon: Boxes,
    badgeText: "Stok otomatis",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: "production",
    title: "Batch Produksi & Waste",
    shortTitle: "Produksi",
    tagline: "Kelola Jadwal Masak & Rendemen",
    description:
      "Jadwalkan batch masakan dapur, pantau rendemen (yield) porsi, dan catat sisa bahan terbuang (waste). Stok mentah di gudang otomatis terpotong saat batch selesai diproduksi.",
    icon: ChefHat,
    badgeText: "Yield & Rendemen",
    badgeColor: "bg-violet-50 text-violet-700 border-violet-200",
  },
  {
    id: "pos",
    title: "POS Kasir & Analisis Laba",
    shortTitle: "Kasir",
    tagline: "Ketahui Profit Riil Tiap Struk",
    description:
      "Aplikasi kasir cepat yang terhubung langsung ke inventaris bahan. Setiap transaksi otomatis merekam laba kotor riil dan mengurangi stok toko secara instan.",
    icon: ShoppingCart,
    badgeText: "Sinkronisasi POS & Laba",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  ...ADDITIONAL_FEATURES,
]

const MOBILE_PREVIEWS = [
  { title: "Kopi Susu Gula Aren", rows: [["Biaya per porsi", "Rp 6.100"], ["Harga jual", "Rp 18.000"], ["Estimasi laba kotor", "Rp 11.900"]] },
  { title: "Prioritas pemakaian susu", rows: [["Batch pertama", "Kedaluwarsa 3 hari lagi"], ["Batch berikutnya", "Kedaluwarsa 9 hari lagi"], ["Metode pencatatan", "FEFO"]] },
  { title: "Produksi brownies", rows: [["Target produksi", "30 potong"], ["Biaya bahan", "Tercatat per batch"], ["Pengurangan stok", "Saat produksi selesai"]] },
  { title: "Contoh transaksi kasir", rows: [["Total penjualan", "Rp 64.000"], ["Total HPP", "Rp 23.120"], ["Laba kotor", "Rp 40.880"]] },
  ...ADDITIONAL_FEATURES.map((feature) => ({ title: feature.preview.title, rows: feature.preview.rows })),
]

const FEATURE_GROUPS = [
  { id: "cost-production", label: "Biaya & Produksi", featureIds: ["hpp", "simulation", "overheads", "production"] },
  { id: "stock-sales", label: "Stok & Penjualan", featureIds: ["inventory", "purchases", "pos", "customers"] },
  { id: "management", label: "Manajemen Usaha", featureIds: ["dashboard", "stores", "staff", "ai"] },
]

export function FeatureScrollShowcase() {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const activeGroup = FEATURE_GROUPS.find((group) => group.featureIds.includes(FEATURES[activeIndex].id)) ?? FEATURE_GROUPS[0]
  const visibleFeatureIndices = activeGroup.featureIds.map((id) => FEATURES.findIndex((feature) => feature.id === id))
  const additionalFeature = ADDITIONAL_FEATURES.find((feature) => feature.id === FEATURES[activeIndex].id)

  return (
    <div
      className="relative bg-slate-50/60 border-b border-slate-200"
    >
      {/* Feature selector and illustrative product previews */}
      <div className="flex items-center py-16 lg:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-8 lg:mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Fitur Utama Dari HPP Tracker
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2.5">
              Dirancang khusus untuk pemilik kedai kopi, restoran, bakery, katering, dan cloud kitchen yang ingin mengamankan margin bisnis.
            </p>
          </div>

          <div role="group" aria-label="Kategori fitur" className="mx-auto mb-7 grid max-w-2xl grid-flow-col auto-cols-fr gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 sm:mb-9">
            {FEATURE_GROUPS.map((group) => (
              <button
                key={group.id}
                type="button"
                aria-pressed={activeGroup.id === group.id}
                aria-controls="feature-options feature-preview"
                onClick={() => setActiveIndex(FEATURES.findIndex((feature) => feature.id === group.featureIds[0]))}
                className={cn("flex min-h-12 min-w-0 items-center justify-center rounded-xl px-2 py-2.5 text-center text-xs font-semibold leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:px-4 sm:text-sm", activeGroup.id === group.id ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")}
              >
                {group.label}
              </button>
            ))}
          </div>

          <div id="feature-options">
          {/* Compact feature selector for mobile and tablet */}
          <div className="mb-5 grid grid-flow-col auto-cols-fr gap-1 rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5 lg:hidden">
            {visibleFeatureIndices.map((idx) => {
              const item = FEATURES[idx]
              const Icon = item.icon
              const isActive = activeIndex === idx
              return (
                <button
                  key={item.id}
                  aria-label={item.title}
                  aria-pressed={isActive}
                  aria-controls="feature-preview"
                  onClick={() => setActiveIndex(idx)}
                  className={cn(
                    "flex min-h-20 min-w-0 flex-col items-center justify-center gap-2 rounded-xl px-1 py-3 text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    isActive
                      ? "bg-white text-primary shadow-sm ring-1 ring-slate-200/70"
                      : "text-slate-500 hover:bg-white/60 hover:text-slate-900"
                  )}
                >
                  <Icon aria-hidden="true" className="size-5 shrink-0" />
                  <span>{item.shortTitle}</span>
                </button>
              )
            })}
          </div>

          {/* Main 2-Column Split: Left Tabs & Right Dynamic Visual Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Four feature choices in the selected category */}
            <div className="hidden lg:flex lg:col-span-5 flex-col gap-3">
              {visibleFeatureIndices.map((idx) => {
                const item = FEATURES[idx]
                const Icon = item.icon
                const isActive = activeIndex === idx


                return (
                  <button
                    type="button"
                    key={item.id}
                    aria-pressed={isActive}
                    aria-controls="feature-preview"
                    onClick={() => setActiveIndex(idx)}
                    className={cn(
                      "shrink-0 text-left p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group focus-visible:outline-primary",
                      isActive
                        ? "bg-white border-primary shadow-lg ring-1 ring-primary/20"
                        : "bg-white/70 border-slate-200 hover:border-slate-300 hover:bg-white"
                    )}
                  >
                    {/* Active vertical progress indicator on left border */}
                    {isActive && (
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1 bg-primary transition-all"
                        style={{ height: "100%" }}
                      />
                    )}

                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                          isActive
                            ? "bg-primary text-white shadow-sm shadow-primary/30"
                            : "bg-slate-50 border border-slate-200 text-slate-600"
                        )}
                      >
                        <Icon className="size-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <h3
                            className={cn(
                              "text-base font-bold transition-colors",
                              isActive ? "text-primary" : "text-slate-900"
                            )}
                          >
                            {item.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] font-bold py-0.5", item.badgeColor)}
                          >
                            {item.badgeText}
                          </Badge>
                        </div>

                        <p
                          className={cn(
                            "text-xs leading-relaxed transition-colors",
                            isActive ? "text-slate-700 font-medium" : "text-slate-500"
                          )}
                        >
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Right Column: Stacked UI Card Mockup (Real App Window + Floating Depth Cards) */}
            <div className="lg:col-span-7 min-w-0 relative">
              {/* Subtle ambient glow behind preview */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-primary/15 via-indigo-500/10 to-transparent rounded-3xl blur-2xl -z-10" />

              {/* Dynamic Stacked Screen Based on Active Index */}
              <div id="feature-preview" role="region" aria-label={FEATURES[activeIndex].title} className="relative">
                <div className="sm:hidden rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-medium text-slate-500">Ilustrasi penggunaan</p>
                  <h3 className="mt-2 text-lg font-bold text-slate-900">{MOBILE_PREVIEWS[activeIndex].title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{FEATURES[activeIndex].description}</p>
                  <dl className="mt-5 divide-y divide-slate-100">
                    {MOBILE_PREVIEWS[activeIndex].rows.map(([label, value]) => (
                      <div key={label} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 text-sm">
                        <dt className="text-slate-600">{label}</dt>
                        <dd className="font-semibold text-slate-900">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="hidden sm:block">
                  {activeIndex === 0 && <HppRecipeMockup />}
                  {activeIndex === 1 && <FifoInventoryMockup />}
                  {activeIndex === 2 && <ProductionBatchMockup />}
                  {activeIndex === 3 && <PosCashierMockup />}
                  {additionalFeature && <AdditionalFeatureMockup feature={additionalFeature} />}
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AdditionalFeatureMockup({ feature }: { feature: AdditionalFeature }) {
  const Icon = feature.icon
  return (
    <div className="relative motion-safe:animate-in motion-safe:fade-in duration-300">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 text-slate-900 shadow-xl sm:p-6">
        <div className="mb-5 flex min-w-0 items-center gap-2 border-b border-slate-200/80 pb-4">
          <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-rose-400" />
          <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-amber-400" />
          <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-emerald-400" />
          <span className="ml-2 min-w-0 truncate rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 font-mono text-[11px] text-slate-600">app.hpptracker.id/{feature.preview.path}</span>
        </div>
        <div className="mb-5 flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-primary"><Icon aria-hidden="true" className="size-5" /></span>
          <div className="min-w-0">
            <h4 className="text-lg font-bold leading-snug">{feature.preview.title}</h4>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">{feature.preview.subtitle}</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="grid grid-cols-2 gap-4 bg-slate-100 px-4 py-3 text-xs font-bold text-slate-600"><span>{feature.preview.columns[0]}</span><span className="text-right">{feature.preview.columns[1]}</span></div>
          <dl className="divide-y divide-slate-100">
            {feature.preview.rows.map(([label, value]) => (
              <div key={label} className="grid grid-cols-2 items-center gap-4 px-4 py-3.5 text-sm"><dt className="text-slate-600">{label}</dt><dd className="text-right font-semibold text-slate-900">{value}</dd></div>
            ))}
          </dl>
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 aria-hidden="true" className="size-3.5 text-primary" />Ilustrasi fitur · Data contoh</p>
      </div>
      <div className="relative mt-4 rounded-2xl border border-indigo-100 bg-white p-5 shadow-lg lg:-mt-2 lg:ml-auto lg:mr-[-12px] lg:w-[85%]">
        <p className="text-xs font-semibold text-primary">{feature.preview.resultLabel}</p>
        <p className="mt-2 text-xl font-bold leading-snug text-slate-900">{feature.preview.result}</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">{feature.preview.note}</p>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* PREVIEW MOCKUP 1: Kalkulasi Resep & HPP (Based on recipe-simulation-page) */
/* -------------------------------------------------------------------------- */
function HppRecipeMockup() {
  return (
    <div className="relative motion-safe:animate-in motion-safe:fade-in duration-300">
      {/* Base App Window */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden p-4 sm:p-5 text-slate-900">
        {/* Window Chrome Header */}
        <div className="flex items-center justify-between gap-2 overflow-hidden pb-3.5 border-b border-slate-200/80 mb-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="size-2.5 rounded-full bg-rose-400 shrink-0" />
            <span className="size-2.5 rounded-full bg-amber-400 shrink-0" />
            <span className="size-2.5 rounded-full bg-emerald-400 shrink-0" />
            <div className="ml-2 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-600 flex items-center gap-1.5 min-w-0 overflow-hidden">
              <span className="text-slate-400 shrink-0">app.hpptracker.id/</span>
              <span className="font-semibold text-slate-800 truncate">production/recipes/simulation</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-primary border border-indigo-100">
              Cabang Pusat
            </span>
          </div>
        </div>

        {/* Page Inner Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-base sm:text-lg font-extrabold text-slate-900">
                Kopi Susu Gula Aren 250ml
              </h4>
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] shrink-0">
                Minuman Dingin
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulasi formulasi bahan baku & penetapan margin laba saji
            </p>
          </div>
          <div className="hidden sm:block text-right shrink-0">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Yield Standar
            </span>
            <span className="text-xs font-bold text-slate-700">1 Porsi (250 ml)</span>
          </div>
        </div>

        {/* Realistic Ingredients Table */}
        <div className="rounded-xl border border-slate-200 overflow-hidden text-xs bg-slate-50/50">
          <div className="grid grid-cols-12 gap-2 p-2.5 bg-slate-100/80 font-bold text-slate-700 text-[11px] border-b border-slate-200">
            <span className="col-span-5">Komposisi Bahan</span>
            <span className="col-span-3 text-right">Takaran</span>
            <span className="col-span-4 text-right">Subtotal HPP</span>
          </div>
          <div className="divide-y divide-slate-200/70 text-slate-800">
            <div className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-white transition-colors">
              <div className="col-span-5 flex flex-col">
                <span className="font-semibold text-slate-900">Espresso House Blend</span>
                <span className="text-[10px] text-slate-400">Biji Kopi Arabika 100%</span>
              </div>
              <span className="col-span-3 text-right text-slate-600 font-mono text-[11px]">
                18 g
              </span>
              <span className="col-span-4 text-right font-mono font-bold text-slate-900 text-[11px]">
                Rp 2.520
              </span>
            </div>
            <div className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-white transition-colors">
              <div className="col-span-5 flex flex-col">
                <span className="font-semibold text-slate-900">Fresh Milk UHT Full Cream</span>
                <span className="text-[10px] text-slate-400">Susu Pasteurisasi</span>
              </div>
              <span className="col-span-3 text-right text-slate-600 font-mono text-[11px]">
                120 ml
              </span>
              <span className="col-span-4 text-right font-mono font-bold text-slate-900 text-[11px]">
                Rp 1.440
              </span>
            </div>
            <div className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-white transition-colors">
              <div className="col-span-5 flex flex-col">
                <span className="font-semibold text-slate-900">Sirup Aren Organik Cair</span>
                <span className="text-[10px] text-slate-400">Gula Aren Asli</span>
              </div>
              <span className="col-span-3 text-right text-slate-600 font-mono text-[11px]">
                25 ml
              </span>
              <span className="col-span-4 text-right font-mono font-bold text-slate-900 text-[11px]">
                Rp 500
              </span>
            </div>
            <div className="grid grid-cols-12 gap-2 p-2.5 items-center bg-slate-50/80">
              <div className="col-span-5 flex flex-col">
                <span className="font-semibold text-slate-700">Cup 12oz & Sedotan PLA</span>
                <span className="text-[10px] text-slate-400">Packaging Kemasan</span>
              </div>
              <span className="col-span-3 text-right text-slate-600 font-mono text-[11px]">
                1 set
              </span>
              <span className="col-span-4 text-right font-mono font-bold text-slate-900 text-[11px]">
                Rp 1.150
              </span>
            </div>
            <div className="grid grid-cols-12 gap-2 p-2.5 items-center bg-slate-50/80">
              <div className="col-span-5 flex flex-col">
                <span className="font-semibold text-slate-700">Listrik, Gas & Upah Dapur</span>
                <span className="text-[10px] text-slate-400">Beban Overhead</span>
              </div>
              <span className="col-span-3 text-right text-slate-600 font-mono text-[11px]">
                Per porsi
              </span>
              <span className="col-span-4 text-right font-mono font-bold text-slate-900 text-[11px]">
                Rp 600
              </span>
            </div>
          </div>
        </div>

        {/* Footer info strip */}
        <div className="pt-3 mt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 text-[11px]">
            <CheckCircle2 className="size-3.5 text-emerald-600" />
            <span>5 item komponen resep tersinkronisasi</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">Update real-time</span>
        </div>
      </div>

      {/* STACKED FLOATING CARD 1: Financial Outcome & Margin (Elevated Layer) */}
      <div className="mt-4 lg:mt-0 lg:absolute lg:-bottom-6 lg:-right-6 lg:w-80 rounded-2xl bg-white border border-indigo-200/80 shadow-2xl p-4 text-slate-900 ring-1 ring-slate-900/5 transition-transform hover:-translate-y-1">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
            <Calculator className="size-3 text-primary" />
            <span>Kalkulasi Margin Resep</span>
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Margin 65.5% (Sehat)
          </span>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Total Modal HPP / Porsi</span>
            <span className="font-mono font-bold text-slate-900">Rp 6.210</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Rekomendasi Harga Jual</span>
            <span className="font-mono font-bold text-indigo-600 text-sm">Rp 18.000</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
            <span className="font-semibold text-slate-700">Laba Bersih per Cup</span>
            <span className="font-mono font-extrabold text-emerald-600 text-sm">
              +Rp 11.790
            </span>
          </div>
        </div>
      </div>

      {/* STACKED FLOATING CARD 2: Toast Alert (System Intelligence) */}
      <div className="hidden sm:flex lg:absolute lg:-top-4 lg:-right-4 rounded-xl bg-slate-900/95 text-white shadow-xl px-3.5 py-2.5 text-xs items-center gap-2.5 border border-slate-800 backdrop-blur-md">
        <div className="size-2 rounded-full bg-indigo-400 motion-safe:animate-pulse" />
        <span className="font-medium">
          Presisi Desimal Finansial: HPP otomatis terhitung ke gram & ml
        </span>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* PREVIEW MOCKUP 2: Stok & FIFO/FEFO (Based on stock-list-page)              */
/* -------------------------------------------------------------------------- */
function FifoInventoryMockup() {
  return (
    <div className="relative motion-safe:animate-in motion-safe:fade-in duration-300">
      {/* Base App Window */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden p-4 sm:p-5 text-slate-900">
        {/* Window Chrome Header */}
        <div className="flex items-center justify-between gap-2 overflow-hidden pb-3.5 border-b border-slate-200/80 mb-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="size-2.5 rounded-full bg-rose-400 shrink-0" />
            <span className="size-2.5 rounded-full bg-amber-400 shrink-0" />
            <span className="size-2.5 rounded-full bg-emerald-400 shrink-0" />
            <div className="ml-2 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-600 flex items-center gap-1.5 min-w-0 overflow-hidden">
              <span className="text-slate-400 shrink-0">app.hpptracker.id/</span>
              <span className="font-semibold text-slate-800 truncate">inventory/stocks</span>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
            Gudang Utama
          </span>
        </div>

        {/* Search & Status Filter Pills */}
        <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              readOnly
              value="Susu Segar Pasteurisasi"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-800 font-medium"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-primary text-white">
              Semua (24)
            </span>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
              Healthy (19)
            </span>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
              Menipis (5)
            </span>
          </div>
        </div>

        {/* Real Inventory Stock Table */}
        <div className="rounded-xl border border-slate-200 overflow-hidden text-xs bg-slate-50/50">
          <div className="grid grid-cols-12 gap-2 p-2.5 bg-slate-100/80 font-bold text-slate-700 text-[11px] border-b border-slate-200">
            <span className="col-span-5">Bahan Mentah</span>
            <span className="col-span-3 text-center">Metode Alur</span>
            <span className="col-span-4 text-right">Sisa Stok</span>
          </div>
          <div className="divide-y divide-slate-200/70 text-slate-800">
            <div className="grid grid-cols-12 gap-2 p-2.5 items-center bg-blue-50/40">
              <div className="col-span-5 flex flex-col">
                <span className="font-semibold text-slate-900">Susu Sapi Pasteurisasi</span>
                <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                  <Clock className="size-3" />
                  <span>Batch #08 exp 3 hari lagi</span>
                </span>
              </div>
              <div className="col-span-3 flex justify-center">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] font-bold">
                  FEFO
                </Badge>
              </div>
              <span className="col-span-4 text-right font-mono font-bold text-slate-900 text-[11px]">
                36.5 Liter
              </span>
            </div>
            <div className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-white transition-colors">
              <div className="col-span-5 flex flex-col">
                <span className="font-semibold text-slate-900">Biji Kopi House Blend</span>
                <span className="text-[10px] text-slate-400">Batch #PO-14 • Masuk 10 Okt</span>
              </div>
              <div className="col-span-3 flex justify-center">
                <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-bold">
                  FIFO
                </Badge>
              </div>
              <span className="col-span-4 text-right font-mono font-bold text-slate-900 text-[11px]">
                14.2 kg
              </span>
            </div>
            <div className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-white transition-colors">
              <div className="col-span-5 flex flex-col">
                <span className="font-semibold text-slate-900">Sirup Aren Organik</span>
                <span className="text-[10px] text-slate-400">Batch #PO-21 • Exp 28 Nov</span>
              </div>
              <div className="col-span-3 flex justify-center">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] font-bold">
                  FEFO
                </Badge>
              </div>
              <span className="col-span-4 text-right font-mono font-bold text-amber-700 text-[11px]">
                4.8 Liter
              </span>
            </div>
            <div className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-white transition-colors">
              <div className="col-span-5 flex flex-col">
                <span className="font-semibold text-slate-900">Paper Cup Hot 12oz</span>
                <span className="text-[10px] text-slate-400">Batch #PO-09</span>
              </div>
              <div className="col-span-3 flex justify-center">
                <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-bold">
                  FIFO
                </Badge>
              </div>
              <span className="col-span-4 text-right font-mono font-bold text-slate-900 text-[11px]">
                320 pcs
              </span>
            </div>
          </div>
        </div>

        {/* Footer info strip */}
        <div className="pt-3 mt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 text-[11px]">
            <CheckCircle2 className="size-3.5 text-blue-600" />
            <span>Deteksi FIFO & FEFO otomatis per faktur masuk</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">24 SKU aktif</span>
        </div>
      </div>

      {/* STACKED FLOATING CARD 1: FEFO Batch Priority Breakdown */}
      <div className="mt-4 lg:mt-0 lg:absolute lg:-bottom-6 lg:-right-6 lg:w-80 rounded-2xl bg-white border border-blue-200/80 shadow-2xl p-4 text-slate-900 ring-1 ring-slate-900/5 transition-transform hover:-translate-y-1">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
            <Boxes className="size-3 text-blue-600" />
            <span>Alur Potong FEFO Otomatis</span>
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Batch Engine
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200 flex items-center justify-between">
            <div>
              <span className="font-mono font-bold text-slate-900 block text-[11px]">
                #INV-2026-08 (4.5 L)
              </span>
              <span className="text-[10px] text-amber-700 font-medium">Exp: 3 hari lagi</span>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-600 text-white">
              Prioritas #1
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-slate-600">
            <div>
              <span className="font-mono font-bold text-slate-800 block text-[11px]">
                #INV-2026-14 (12.0 L)
              </span>
              <span className="text-[10px] text-slate-400">Exp: 9 hari lagi</span>
            </div>
            <span className="text-[10px] font-medium text-slate-500">Antrean #2</span>
          </div>
        </div>
      </div>

      {/* STACKED FLOATING CARD 2: Toast Alert */}
      <div className="hidden sm:flex lg:absolute lg:-top-4 lg:-right-4 rounded-xl bg-slate-900/95 text-white shadow-xl px-3.5 py-2.5 text-xs items-center gap-2.5 border border-slate-800 backdrop-blur-md">
        <div className="size-2 rounded-full bg-blue-400 motion-safe:animate-pulse" />
        <span className="font-medium">
          Metode FEFO Aktif: Bahan paling mendekati basi dipotong duluan
        </span>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* PREVIEW MOCKUP 3: Batch Produksi & Waste (Based on batch-list-page)        */
/* -------------------------------------------------------------------------- */
function ProductionBatchMockup() {
  return (
    <div className="relative motion-safe:animate-in motion-safe:fade-in duration-300">
      {/* Base App Window */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden p-4 sm:p-5 text-slate-900">
        {/* Window Chrome Header */}
        <div className="flex items-center justify-between gap-2 overflow-hidden pb-3.5 border-b border-slate-200/80 mb-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="size-2.5 rounded-full bg-rose-400 shrink-0" />
            <span className="size-2.5 rounded-full bg-amber-400 shrink-0" />
            <span className="size-2.5 rounded-full bg-emerald-400 shrink-0" />
            <div className="ml-2 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-600 flex items-center gap-1.5 min-w-0 overflow-hidden">
              <span className="text-slate-400 shrink-0">app.hpptracker.id/</span>
              <span className="font-semibold text-slate-800 truncate">production/batches/42</span>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-100 shrink-0">
            Kitchen Sentral
          </span>
        </div>

        {/* Batch Overview Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-base sm:text-lg font-extrabold text-slate-900">
                Brownies Fudge Dark Choco
              </h4>
              <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-[10px] shrink-0">
                Dalam Produksi
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Batch #PRD-2026-042 • Jadwal masak dapur cabang
            </p>
          </div>
          <div className="hidden sm:block text-right shrink-0">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Target Batch
            </span>
            <span className="text-xs font-bold text-violet-700">30 Potong</span>
          </div>
        </div>

        {/* Auto Deduct Ingredients Grid */}
        <div className="rounded-xl border border-slate-200 overflow-hidden text-xs bg-slate-50/50">
          <div className="grid grid-cols-12 gap-2 p-2.5 bg-slate-100/80 font-bold text-slate-700 text-[11px] border-b border-slate-200">
            <span className="col-span-6">Bahan Mentah Gudang</span>
            <span className="col-span-3 text-right">Jml Terpakai</span>
            <span className="col-span-3 text-right">Status Gudang</span>
          </div>
          <div className="divide-y divide-slate-200/70 text-slate-800">
            <div className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-white transition-colors">
              <span className="col-span-6 font-semibold text-slate-900">
                Cokelat Couverture 70%
              </span>
              <span className="col-span-3 text-right font-mono text-slate-600">750 gr</span>
              <span className="col-span-3 text-right text-[10px] font-semibold text-emerald-600">
                Auto-Deduct OK
              </span>
            </div>
            <div className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-white transition-colors">
              <span className="col-span-6 font-semibold text-slate-900">
                Unsalted Butter Anchor
              </span>
              <span className="col-span-3 text-right font-mono text-slate-600">450 gr</span>
              <span className="col-span-3 text-right text-[10px] font-semibold text-emerald-600">
                Auto-Deduct OK
              </span>
            </div>
            <div className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-white transition-colors">
              <span className="col-span-6 font-semibold text-slate-900">
                Tepung Protein Sedang
              </span>
              <span className="col-span-3 text-right font-mono text-slate-600">300 gr</span>
              <span className="col-span-3 text-right text-[10px] font-semibold text-emerald-600">
                Auto-Deduct OK
              </span>
            </div>
            <div className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-white transition-colors">
              <span className="col-span-6 font-semibold text-slate-900">Telur Ayam Fresh</span>
              <span className="col-span-3 text-right font-mono text-slate-600">6 butir</span>
              <span className="col-span-3 text-right text-[10px] font-semibold text-emerald-600">
                Auto-Deduct OK
              </span>
            </div>
          </div>
        </div>

        {/* Footer info strip */}
        <div className="pt-3 mt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 text-[11px]">
            <CheckCircle2 className="size-3.5 text-violet-600" />
            <span>Stok bahan mentah otomatis terpangkas dari gudang</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">Yield aktual: 96.5%</span>
        </div>
      </div>

      {/* STACKED FLOATING CARD 1: Yield & Rendemen Metric Card */}
      <div className="mt-4 lg:mt-0 lg:absolute lg:-bottom-6 lg:-right-6 lg:w-80 rounded-2xl bg-white border border-violet-200/80 shadow-2xl p-4 text-slate-900 ring-1 ring-slate-900/5 transition-transform hover:-translate-y-1">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700 flex items-center gap-1">
            <ChefHat className="size-3 text-violet-600" />
            <span>Rendemen & Waste Terbuang</span>
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
            Yield 96.5%
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-600 font-medium">Rendemen (Yield Jadi)</span>
              <span className="font-bold text-emerald-600">96.5% (Efisien)</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-[96.5%]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-600 font-medium">Sisa Waste Terbuang</span>
              <span className="font-bold text-amber-600">3.5% (Terkontrol)</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full w-[3.5%]" />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-medium">
            <span className="text-slate-500">Modal Bersih / Potong</span>
            <span className="font-mono font-bold text-slate-900">Rp 6.450</span>
          </div>
        </div>
      </div>

      {/* STACKED FLOATING CARD 2: Toast Alert */}
      <div className="hidden sm:flex lg:absolute lg:-top-4 lg:-right-4 rounded-xl bg-slate-900/95 text-white shadow-xl px-3.5 py-2.5 text-xs items-center gap-2.5 border border-slate-800 backdrop-blur-md">
        <div className="size-2 rounded-full bg-violet-400 motion-safe:animate-pulse" />
        <span className="font-medium">
          Auto-Deduct: Stok gudang terpangkas presisi saat batch disimpan
        </span>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* PREVIEW MOCKUP 4: POS Kasir & Laba (Based on pos-page)                     */
/* -------------------------------------------------------------------------- */
function PosCashierMockup() {
  return (
    <div className="relative motion-safe:animate-in motion-safe:fade-in duration-300">
      {/* Base App Window */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden p-4 sm:p-5 text-slate-900">
        {/* Window Chrome Header */}
        <div className="flex items-center justify-between gap-2 overflow-hidden pb-3.5 border-b border-slate-200/80 mb-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="size-2.5 rounded-full bg-rose-400 shrink-0" />
            <span className="size-2.5 rounded-full bg-amber-400 shrink-0" />
            <span className="size-2.5 rounded-full bg-emerald-400 shrink-0" />
            <div className="ml-2 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-600 flex items-center gap-1.5 min-w-0 overflow-hidden">
              <span className="text-slate-400 shrink-0">app.hpptracker.id/</span>
              <span className="font-semibold text-slate-800 truncate">sales/pos/checkout</span>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
            Kasir 01 (Online)
          </span>
        </div>

        {/* Order Details Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-base sm:text-lg font-extrabold text-slate-900">
                Struk Kasir: #TRX-2026-881
              </h4>
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] shrink-0">
                Lunas (QRIS)
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Meja 04 (Dine-in) • Kasir: Rian Saputra • 14:28 WIB
            </p>
          </div>
          <div className="hidden sm:block text-right shrink-0">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Metode Bayar
            </span>
            <span className="text-xs font-bold text-slate-700">QRIS</span>
          </div>
        </div>

        {/* Order Items Table */}
        <div className="rounded-xl border border-slate-200 overflow-hidden text-xs bg-slate-50/50">
          <div className="grid grid-cols-12 gap-2 p-2.5 bg-slate-100/80 font-bold text-slate-700 text-[11px] border-b border-slate-200">
            <span className="col-span-5">Menu Dipesan</span>
            <span className="col-span-3 text-right">Modal HPP</span>
            <span className="col-span-4 text-right">Harga Jual POS</span>
          </div>
          <div className="divide-y divide-slate-200/70 text-slate-800">
            <div className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-white transition-colors">
              <div className="col-span-5 flex flex-col">
                <span className="font-semibold text-slate-900">2x Kopi Susu Gula Aren</span>
                <span className="text-[10px] text-slate-400">Less ice, normal sugar</span>
              </div>
              <span className="col-span-3 text-right text-slate-500 font-mono text-[11px]">
                Rp 12.420
              </span>
              <span className="col-span-4 text-right font-mono font-bold text-slate-900 text-[11px]">
                Rp 36.000
              </span>
            </div>
            <div className="grid grid-cols-12 gap-2 p-2.5 items-center hover:bg-white transition-colors">
              <div className="col-span-5 flex flex-col">
                <span className="font-semibold text-slate-900">1x Butter Croissant Almond</span>
                <span className="text-[10px] text-slate-400">Warm served</span>
              </div>
              <span className="col-span-3 text-right text-slate-500 font-mono text-[11px]">
                Rp 10.700
              </span>
              <span className="col-span-4 text-right font-mono font-bold text-slate-900 text-[11px]">
                Rp 28.000
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Order Summary Bar */}
        <div className="mt-3 p-3 rounded-xl bg-slate-100/80 border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] text-slate-500 block">Total Item</span>
              <span className="font-bold text-slate-800">3 Porsi</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Total Omset</span>
              <span className="font-mono font-extrabold text-slate-900">Rp 64.000</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-emerald-600 uppercase font-bold block">
              Stok Berkurang
            </span>
            <span className="text-[11px] font-semibold text-slate-700">2 Kopi & 1 Croissant</span>
          </div>
        </div>
      </div>

      {/* STACKED FLOATING CARD 1: Real-Time Gross Profit Card */}
      <div className="mt-4 lg:mt-0 lg:absolute lg:-bottom-6 lg:-right-6 lg:w-80 rounded-2xl bg-white border border-emerald-200/80 shadow-2xl p-4 text-slate-900 ring-1 ring-slate-900/5 transition-transform hover:-translate-y-1">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
            <TrendingUp className="size-3 text-emerald-600" />
            <span>Laba Kotor Struk Riil</span>
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Margin: 63.8%
          </span>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Total Omset Transaksi</span>
            <span className="font-mono font-bold text-slate-900">Rp 64.000</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Total Modal HPP</span>
            <span className="font-mono font-bold text-slate-500">Rp 23.120</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
            <span className="font-semibold text-slate-800">Laba Kotor Struk</span>
            <span className="font-mono font-extrabold text-emerald-600 text-base">
              +Rp 40.880
            </span>
          </div>
        </div>
      </div>

      {/* STACKED FLOATING CARD 2: Toast Alert */}
      <div className="hidden sm:flex lg:absolute lg:-top-4 lg:-right-4 rounded-xl bg-slate-900/95 text-white shadow-xl px-3.5 py-2.5 text-xs items-center gap-2.5 border border-slate-800 backdrop-blur-md">
        <div className="size-2 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
        <span className="font-medium">
          Sinkronisasi Instan: Struk kasir otomatis rekam laba & potong inventaris
        </span>
      </div>
    </div>
  )
}
