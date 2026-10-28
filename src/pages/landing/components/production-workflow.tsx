import { useId, type CSSProperties } from "react"
import { Check, X } from "lucide-react"
import { APP_NAME, cn } from "@/lib/utils"
import { WORKFLOW_TOUR_STEPS as STEPS } from "./workflow-tour-data"
import { useWorkflowScroll } from "./use-workflow-scroll"
import "./workflow-tour.css"

export function ProductionWorkflow() {
  const { trackRef, activeStep, isComplete, panelVisible, dismissPanel, selectStep } = useWorkflowScroll()
  const arrowId = useId()
  const step = activeStep === null ? null : STEPS[activeStep]

  return (
    <section id="alur-kerja" aria-labelledby="workflow-heading" className="workflow-tour-section brand-light-surface scroll-mt-32 border-b border-slate-200 py-12 sm:py-20 lg:scroll-mt-20" onKeyDown={event => { if (event.key === "Escape") dismissPanel() }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold text-primary">Cara kerja {APP_NAME}</p>
          <h2 id="workflow-heading" className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">Pesanan masuk, usaha tetap teratur.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">Kasir mencatat pesanan, dapur menyiapkan makanan. Ekatra menghubungkan pemakaian bahan dan biaya produksi dengan penjualan, agar Anda bisa melihat laba kotor setiap pesanan.</p>
        </div>

        <div ref={trackRef} className={cn("tour-scroll-track", isComplete && "tour-scroll-complete")}>
        <div className="tour-board tour-scroll-sticky">
          <div className="tour-stage" style={step ? { "--callout-x": step.panelX, "--callout-y": step.panelY } as CSSProperties : undefined}>
            <div className="tour-map">
              <img src="/images/ekatra-workflow-scene.webp" srcSet="/images/ekatra-workflow-scene-mobile.webp 768w, /images/ekatra-workflow-scene.webp 1200w" sizes="(min-width: 1280px) 1100px, (min-width: 1024px) calc(100vw - 96px), calc(100vw - 48px)" width={1200} height={800} loading="lazy" decoding="async" alt="Ilustrasi kedai dengan kasir di kiri depan, dapur di kiri belakang, rak bahan, area pengambilan makanan, dan meja pemilik di kanan" className="tour-map-image" />
              {step && <div aria-hidden="true" className="tour-spotlight" style={{ background: `radial-gradient(ellipse 23% 28% at ${step.x}% ${step.y}%, transparent 20%, rgba(248, 250, 252, 0.45) 100%)` }} />}
              <svg aria-hidden="true" className="tour-paths" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs><marker id={arrowId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="m1 1 7 4-7 4" fill="none" stroke="context-stroke" strokeWidth="1.8" /></marker></defs>
                {STEPS.slice(1).map((item, index) => <g key={item.name}>
                  <path d={item.path} fill="none" stroke="white" strokeWidth="6" vectorEffect="non-scaling-stroke" opacity=".85" />
                  <path d={item.path} className={cn("tour-route", (isComplete || activeStep !== null && index + 1 <= activeStep) && "tour-route-visited", activeStep === index + 1 && "tour-route-active")} fill="none" strokeWidth="2" vectorEffect="non-scaling-stroke" markerEnd={`url(#${arrowId})`} />
                </g>)}
              </svg>

              {STEPS.map((item, index) => {
                const selected = activeStep === index
                return <button key={item.name} type="button" onClick={() => selectStep(index)} style={{ left: `${item.x}%`, top: `${item.y}%` }} className={cn("tour-hotspot", selected && "tour-hotspot-active", (isComplete || activeStep !== null && index < activeStep) && "tour-hotspot-visited")} aria-label={`Lihat tahap ${index + 1}: ${item.name}`} aria-pressed={selected} aria-controls={panelVisible ? "workflow-example" : undefined}>
                  <span className="tour-hotspot-number">{isComplete || activeStep !== null && index < activeStep ? <Check aria-hidden="true" className="size-3.5" /> : index + 1}</span>
                  <span className="tour-hotspot-name">{item.name}</span>
                </button>
              })}
            </div>

            {step && panelVisible && <div id="workflow-example" role="region" aria-labelledby="workflow-detail-heading" className="tour-callout">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <p className="flex items-center gap-2 text-xs font-semibold text-primary"><step.icon aria-hidden="true" className="size-4" />Langkah {activeStep! + 1} / {STEPS.length} · {step.name}</p>
                <button type="button" onClick={dismissPanel} aria-label="Tutup penjelasan" className="-my-1 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><X aria-hidden="true" className="size-4" /></button>
              </div>
              <h3 id="workflow-detail-heading" className="mt-4 text-lg font-bold leading-snug tracking-tight text-slate-900">{step.heading}</h3>
              <p className="tour-description mt-2 text-sm leading-relaxed text-slate-600"><span className="tour-description-full">{step.description}</span><span className="tour-description-short">{step.summary}</span></p>
              <dl className="tour-example-rows mt-4 space-y-2">
                {step.rows.map(row => <div key={row.label} className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs leading-relaxed"><dt className="text-slate-500">{row.label}</dt><dd className="font-semibold text-slate-800">{row.value}</dd></div>)}
              </dl>
              <div className={cn("tour-result mt-4 rounded-xl px-4 py-3", activeStep === STEPS.length - 1 ? "bg-emerald-50" : "bg-indigo-50")}>
                <p className="text-xs text-slate-600">{step.resultLabel}</p>
                <p className={cn("mt-1 text-xl font-extrabold tracking-tight", activeStep === STEPS.length - 1 ? "text-emerald-800" : "text-primary")}>{step.result}</p>
                {activeStep === STEPS.length - 1 && <p className="mt-1 text-xs text-emerald-900">Rp 50.000 penjualan − Rp 24.000 biaya.</p>}
              </div>
            </div>}
            {activeStep === null && !isComplete && <p className="tour-overview-note">Gulir perlahan untuk melihat perjalanan satu pesanan di setiap bagian usaha.</p>}
          </div>

        </div>
        </div>

      </div>
    </section>
  )
}
