import { useEffect, useId, useState, type CSSProperties } from "react"
import { ArrowRight, Check, ChevronLeft, ChevronRight, Pause, Play, RotateCcw, X } from "lucide-react"
import { APP_NAME, cn } from "@/lib/utils"
import { TOUR_STEP_DURATION, WORKFLOW_TOUR_STEPS as STEPS } from "./workflow-tour-data"
import "./workflow-tour.css"

export function ProductionWorkflow() {
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const arrowId = useId()
  const step = activeStep === null ? null : STEPS[activeStep]

  useEffect(() => {
    if (!isPlaying || activeStep === null) return
    const timer = window.setTimeout(() => {
      if (activeStep === STEPS.length - 1) {
        setIsPlaying(false)
        setIsComplete(true)
      } else {
        setActiveStep(activeStep + 1)
      }
    }, TOUR_STEP_DURATION)
    return () => window.clearTimeout(timer)
  }, [activeStep, isPlaying])

  useEffect(() => {
    const pauseWhenHidden = () => { if (document.hidden) setIsPlaying(false) }
    document.addEventListener("visibilitychange", pauseWhenHidden)
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden)
  }, [])

  const overview = () => {
    setIsPlaying(false)
    setIsComplete(false)
    setActiveStep(null)
  }

  const selectStep = (index: number) => {
    setIsPlaying(false)
    setIsComplete(false)
    setActiveStep(index)
  }

  const togglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false)
      return
    }
    if (activeStep === null || isComplete) {
      setActiveStep(0)
      setIsComplete(false)
    }
    setIsPlaying(true)
  }

  const playLabel = isPlaying ? "Jeda alur" : isComplete ? "Putar ulang" : activeStep === null ? "Putar alur" : "Lanjutkan alur"

  return (
    <section id="alur-kerja" aria-labelledby="workflow-heading" className="brand-light-surface scroll-mt-32 border-b border-slate-200 bg-white py-12 sm:py-20 lg:scroll-mt-20" onKeyDown={event => { if (event.key === "Escape") overview() }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold text-primary">Cara kerja {APP_NAME}</p>
          <h2 id="workflow-heading" className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">Ikuti satu pesanan,<br className="hidden sm:block" /> dari kasir sampai laporan.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">Lihat seluruh usaha dalam satu gambar. Putar alurnya untuk mengikuti apa yang terjadi di tiap bagian.</p>
        </div>

        <div className="tour-board">
          <div className="tour-topbar">
            <div>
              <p className="text-sm font-bold text-slate-900">Satu pesanan, semua bagian terhubung.</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">Contoh: 2 porsi nasi ayam, dibuat saat dipesan.</p>
            </div>
            <button type="button" onClick={togglePlayback} className="tour-play" aria-pressed={isPlaying}>
              {isPlaying ? <Pause aria-hidden="true" className="size-4" /> : isComplete ? <RotateCcw aria-hidden="true" className="size-4" /> : <Play aria-hidden="true" className="size-4" />}
              {playLabel}
            </button>
          </div>

          <div className="tour-stage" style={step ? { "--callout-x": step.panelX, "--callout-y": step.panelY } as CSSProperties : undefined}>
            <div className="tour-map">
              <img src="/images/ekatra-workflow-scene.webp" srcSet="/images/ekatra-workflow-scene-mobile.webp 768w, /images/ekatra-workflow-scene.webp 1200w" sizes="(min-width: 1280px) 1100px, (min-width: 1024px) calc(100vw - 96px), calc(100vw - 48px)" width={1200} height={800} loading="lazy" decoding="async" alt="Ilustrasi kedai dengan kasir di kiri depan, dapur di kiri belakang, rak bahan, area pengambilan makanan, dan meja pemilik di kanan" className="tour-map-image" />
              {step && <div aria-hidden="true" className="tour-spotlight" style={{ background: `radial-gradient(ellipse 23% 28% at ${step.x}% ${step.y}%, transparent 20%, rgba(248, 250, 252, 0.65) 100%)` }} />}
              <svg aria-hidden="true" className={cn("tour-paths", isPlaying && "tour-paths-playing")} viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs><marker id={arrowId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="m1 1 7 4-7 4" fill="none" stroke="context-stroke" strokeWidth="1.8" /></marker></defs>
                {STEPS.slice(1).map((item, index) => <g key={item.name}>
                  <path d={item.path} fill="none" stroke="white" strokeWidth="6" vectorEffect="non-scaling-stroke" opacity=".85" />
                  <path d={item.path} className={cn("tour-route", activeStep !== null && index + 1 <= activeStep && "tour-route-visited", activeStep === index + 1 && "tour-route-active")} fill="none" strokeWidth="2" vectorEffect="non-scaling-stroke" markerEnd={`url(#${arrowId})`} />
                </g>)}
              </svg>

              {STEPS.map((item, index) => {
                const selected = activeStep === index
                return <button key={item.name} type="button" onClick={() => selectStep(index)} style={{ left: `${item.x}%`, top: `${item.y}%` }} className={cn("tour-hotspot", selected && "tour-hotspot-active", activeStep !== null && index < activeStep && "tour-hotspot-visited")} aria-label={`Lihat tahap ${index + 1}: ${item.name}`} aria-pressed={selected} aria-controls={step ? "workflow-example" : undefined}>
                  <span className="tour-hotspot-number">{activeStep !== null && index < activeStep ? <Check aria-hidden="true" className="size-3.5" /> : index + 1}</span>
                  <span className="tour-hotspot-name">{item.name}</span>
                </button>
              })}
            </div>

            {step && <div id="workflow-example" role="region" aria-labelledby="workflow-detail-heading" className="tour-callout">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <p className="flex items-center gap-2 text-xs font-semibold text-primary"><step.icon aria-hidden="true" className="size-4" />Langkah {activeStep! + 1} / {STEPS.length} · {step.name}</p>
                <button type="button" onClick={overview} aria-label="Tutup penjelasan" className="-my-1 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><X aria-hidden="true" className="size-4" /></button>
              </div>
              <h3 id="workflow-detail-heading" className="mt-4 text-lg font-bold leading-snug tracking-tight text-slate-900">{step.heading}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
              <dl className="mt-4 space-y-2">
                {step.rows.map(row => <div key={row.label} className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs leading-relaxed"><dt className="text-slate-500">{row.label}</dt><dd className="font-semibold text-slate-800">{row.value}</dd></div>)}
              </dl>
              <div className={cn("mt-4 rounded-xl px-4 py-3", activeStep === STEPS.length - 1 ? "bg-emerald-50" : "bg-indigo-50")}>
                <p className="text-xs text-slate-600">{step.resultLabel}</p>
                <p className={cn("mt-1 text-xl font-extrabold tracking-tight", activeStep === STEPS.length - 1 ? "text-emerald-800" : "text-primary")}>{step.result}</p>
              </div>
            </div>}
          </div>

          <div className="tour-bottom">
            <ol aria-label="Tahapan tur usaha" className="tour-step-list">
              {STEPS.map((item, index) => <li key={item.name}>
                <button id={`workflow-step-${index}`} type="button" aria-label={`${index + 1}. ${item.name}`} aria-pressed={activeStep === index} aria-controls={step ? "workflow-example" : undefined} onClick={() => selectStep(index)} className={cn("tour-step-button", activeStep === index && "tour-step-button-active")}>
                  <item.icon aria-hidden="true" className="size-4 shrink-0" /><span>{item.name}</span>
                </button>
              </li>)}
            </ol>

            <div className="tour-transport">
              <p className="min-w-0 text-xs leading-relaxed text-slate-600" role="status">{isComplete ? "Alur selesai. Penjualan Rp 50.000 − biaya Rp 24.000 = laba kotor Rp 26.000." : step ? `${activeStep! + 1} dari ${STEPS.length} · ${isPlaying ? "Berjalan otomatis. Jeda untuk membaca lebih lama." : step.outcome}` : "Mulai dengan Putar alur, atau pilih salah satu titik pada gambar."}</p>
              <div className="flex shrink-0 items-center gap-1">
                {activeStep !== null && <button type="button" onClick={overview} className="tour-nav-button" aria-label="Lihat seluruh alur"><RotateCcw aria-hidden="true" className="size-4" /></button>}
                <button type="button" onClick={() => selectStep((activeStep ?? 0) - 1)} disabled={activeStep === null || activeStep === 0} className="tour-nav-button" aria-label="Sebelumnya"><ChevronLeft aria-hidden="true" className="size-4" /></button>
                <button type="button" onClick={() => { if (activeStep === STEPS.length - 1) { setIsPlaying(false); setIsComplete(true) } else selectStep(activeStep === null ? 0 : activeStep + 1) }} disabled={isComplete} className="tour-nav-button" aria-label={activeStep === STEPS.length - 1 ? "Selesai" : "Berikutnya"}>{activeStep === STEPS.length - 1 ? <Check aria-hidden="true" className="size-4" /> : <ChevronRight aria-hidden="true" className="size-4" />}</button>
              </div>
            </div>
          </div>
        </div>

        <p className="mx-auto mt-5 max-w-3xl text-center text-xs leading-relaxed text-slate-600">Contoh ilustrasi dan angka simulasi. Alur ini memakai bahan dan resep yang sudah dicatat, untuk menu yang dibuat saat dipesan. Laba kotor belum dikurangi biaya usaha lain di luar HPP.</p>
        <div className="mt-6 text-center"><a href="/register" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-primary hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Mulai dari usaha Anda<ArrowRight aria-hidden="true" className="size-4" /></a></div>
      </div>
    </section>
  )
}
