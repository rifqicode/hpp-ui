import { useState } from "react"
import { ArrowRight, Boxes, Check, ChefHat, ClipboardList, Layers3, Link2, TrendingUp } from "lucide-react"
import { APP_NAME, cn } from "@/lib/utils"

const WORKFLOW_STEPS = [
  {
    title: "Tambahkan bahan",
    icon: Boxes,
    description: "Catat bahan, harga beli, dan stok yang tersedia.",
    outcome: "Harga bahan punya catatan.",
    previewTitle: "Kenali modal dari bahan yang masuk.",
    previewDescription: "Catat jumlah dan harga setiap kali belanja bahan. Tambahkan tanggal kedaluwarsa bila ada. Harga bahan ini dipakai untuk menghitung biaya resep Anda.",
    rows: [
      { label: "Bahan baku", value: "Tepung, cokelat, mentega, telur" },
      { label: "Data pembelian", value: "Jumlah, satuan, dan harga beli" },
      { label: "Catatan stok", value: "Belanja & tanggal kedaluwarsa" },
    ],
    resultLabel: "Yang Anda dapatkan",
    result: "Tahu bahan yang tersedia dan biaya belinya.",
  },
  {
    title: "Tentukan produk & resep",
    icon: ClipboardList,
    description: "Pilih bahan, atur takaran, dan tentukan hasil per resep.",
    outcome: "Biaya per porsi mulai terlihat.",
    previewTitle: "Satu resep, takaran yang jelas.",
    previewDescription: "Pilih bahan yang sudah dicatat, lalu masukkan takarannya. Isi jumlah porsi yang dihasilkan untuk melihat perkiraan biaya tiap porsi sebelum mulai memasak.",
    rows: [
      { label: "Produk", value: "Brownies cokelat" },
      { label: "Resep", value: "Takaran tepung, cokelat, mentega & telur" },
      { label: "Hasil per resep", value: "20 potong" },
    ],
    resultLabel: "Yang Anda dapatkan",
    result: "Punya dasar biaya untuk menentukan harga jual.",
  },
  {
    title: "Mulai produksi",
    icon: ChefHat,
    description: "Mulai memasak, lalu catat hasil dan biaya yang terpakai.",
    outcome: "Stok terpakai, HPP terhitung.",
    previewTitle: "Selesai memasak, tahu biaya per potongnya.",
    previewDescription: "Setelah produksi ditandai selesai, stok berkurang sesuai bahan yang dipakai. Biaya bahan, upah, listrik, dan gas yang dicatat dijumlahkan, lalu dibagi dengan hasil masakan.",
    rows: [
      { label: "Bahan yang terpakai", value: "Rp 80.000" },
      { label: "Upah + listrik dan gas", value: "Rp 15.000 + Rp 5.000" },
      { label: "Hasil masakan", value: "20 potong brownies" },
    ],
    resultLabel: "Biaya membuat satu potong (HPP)",
    result: "Rp 5.000",
  },
  {
    title: "Lihat penjualan & laba",
    icon: TrendingUp,
    description: "Catat penjualan dan lihat stok serta laba kotornya.",
    outcome: "Tahu selisih penjualan dan biaya produk.",
    previewTitle: "Tahu yang terjual, tersisa, dan dihasilkan.",
    previewDescription: "Catat penjualan lewat kasir di aplikasi. Stok produk berkurang dan Anda bisa melihat laba kotor, yaitu uang penjualan dikurangi biaya membuat produk yang terjual.",
    rows: [
      { label: "Terjual", value: "12 potong × Rp 10.000" },
      { label: "Biaya produk terjual", value: "12 potong × Rp 5.000" },
      { label: "Stok produk tersisa", value: "8 potong brownies" },
    ],
    resultLabel: "Laba kotor dari 12 potong",
    result: "Rp 60.000",
  },
]

export function ProductionWorkflow() {
  const [activeStep, setActiveStep] = useState(0)
  const currentStep = WORKFLOW_STEPS[activeStep]
  const ActiveIcon = currentStep.icon

  const selectStep = (index: number) => {
    setActiveStep(index)
  }

  return (
    <section id="alur-kerja" aria-labelledby="workflow-heading" className="scroll-mt-32 lg:scroll-mt-20 border-b border-slate-200 bg-white py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-6 max-w-2xl text-center sm:mb-10">
          <h2 id="workflow-heading" className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">Cara kerja {APP_NAME}</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">Catat belanja bahan, susun resep, lalu lihat biaya tiap porsi (HPP). Pilih langkah di bawah untuk melihat contohnya.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 sm:p-7 lg:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-700"><Link2 aria-hidden="true" className="size-4 text-primary" />Satu alur, semua tercatat.</p>
            <p className="text-xs text-slate-500">Pilih langkah untuk melihat contohnya</p>
          </div>

          <ol aria-label="Alur bahan hingga penjualan" className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-6">
            {WORKFLOW_STEPS.map((step, index) => {
              const Icon = step.icon
              const isActive = index === activeStep
              return (
                <li key={step.title} className="relative min-w-0">
                  <button
                    type="button"
                    id={`workflow-step-${index}`}
                    aria-label={`${index + 1}. ${step.title}`}
                    aria-pressed={isActive}
                    aria-controls="workflow-example"
                    onClick={() => selectStep(index)}
                    className={cn("relative z-10 flex h-full w-full flex-col items-start gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 lg:rounded-2xl lg:gap-4 lg:p-5", isActive ? "border-primary bg-white shadow-sm" : "border-slate-200 bg-white/70 hover:border-indigo-300 hover:bg-white")}
                  >
                    <span className={cn("relative flex size-8 lg:size-11 shrink-0 items-center justify-center rounded-lg", isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-600")}>
                      <Icon aria-hidden="true" className="size-5" />
                      <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-[10px] font-bold text-white">{index + 1}</span>
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={cn("text-sm font-bold leading-snug", isActive ? "text-primary" : "text-slate-900")}>{step.title}</span>
                      <span className="mt-2 hidden lg:block text-sm leading-relaxed text-slate-600">{step.description}</span>
                      <span className="mt-3 hidden lg:flex items-start gap-1.5 text-xs font-medium leading-relaxed text-slate-600"><Check aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-primary" />{step.outcome}</span>
                    </span>
                  </button>
                  {index < WORKFLOW_STEPS.length - 1 && <>
                    <span aria-hidden="true" className="absolute -right-6 top-10 z-20 hidden w-6 items-center justify-center text-indigo-400 lg:flex"><ArrowRight className="size-5" /></span>
                  </>}
                </li>
              )
            })}
          </ol>

          <div id="workflow-example" role="region" aria-labelledby={`workflow-step-${activeStep}`} className="mt-6 grid scroll-mt-20 min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white lg:mt-8 lg:grid-cols-2">
            <div className="p-5 sm:p-7">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-primary"><Layers3 aria-hidden="true" className="size-3.5" />Contoh alur: Brownies cokelat</p>
              <h3 className="text-xl font-bold leading-snug tracking-tight text-slate-900 sm:text-2xl">{currentStep.previewTitle}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{currentStep.previewDescription}</p>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">Angka di sini hanya contoh perhitungan.</p>
            </div>
            <div className="min-w-0 border-t border-slate-100 bg-slate-50/70 p-5 sm:p-7 lg:border-l lg:border-t-0">
              <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500"><ActiveIcon aria-hidden="true" className="size-4" />Tahap {activeStep + 1} · {currentStep.title}</div>
              <dl className="space-y-3">
                {currentStep.rows.map((row) => (
                  <div key={row.label} className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1 border-b border-slate-200/70 pb-3 text-sm">
                    <dt className="text-slate-500">{row.label}</dt>
                    <dd className="font-medium text-slate-800">{row.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
                <p className="text-xs font-medium text-primary">{currentStep.resultLabel}</p>
                <p className={cn("mt-1.5 font-bold leading-snug text-slate-900", activeStep >= 2 ? "text-2xl" : "text-base")}>{currentStep.result}</p>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2" aria-label="Navigasi contoh alur">
                <button type="button" disabled={activeStep === 0} onClick={() => setActiveStep((previous) => previous - 1)} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-30"><ArrowRight aria-hidden="true" className="size-3.5 rotate-180" />Sebelumnya</button>
                <span className="text-xs tabular-nums text-slate-600">{activeStep + 1} / {WORKFLOW_STEPS.length}</span>
                <button type="button" disabled={activeStep === WORKFLOW_STEPS.length - 1} onClick={() => setActiveStep((previous) => previous + 1)} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-primary hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-30">Berikutnya<ArrowRight aria-hidden="true" className="size-3.5" /></button>
              </div>
            </div>
          </div>

          <p className="mt-5 flex items-start justify-center gap-2 text-xs leading-relaxed text-slate-500 sm:text-sm"><Link2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" /><span>Catatan bahan → resep → produksi → penjualan. Telusuri biayanya dalam satu aplikasi.</span></p>
        </div>

      </div>
    </section>
  )
}
