import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { WORKFLOW_TOUR_STEPS } from "./workflow-tour-data"

const OVERVIEW_END = 0.08

export function useWorkflowScroll() {
  const trackRef = useRef<HTMLDivElement>(null)
  const currentStepRef = useRef<number | null>(null)
  const completeRef = useRef(false)
  const hasEntered = useRef(false)
  const completionScrollTop = useRef<number | null>(null)
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [dismissedStep, setDismissedStep] = useState<number | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!isComplete || !track) return
    // Keep the illustration in the same screen position when its scroll space collapses.
    track.style.height = "auto"
    const top = completionScrollTop.current
    completionScrollTop.current = null
    if (top !== null) window.scrollTo({ top, behavior: "instant" })
  }, [isComplete])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const header = document.querySelector("header")
    let frame = 0
    let needsMeasure = false
    let stickyTop = 0
    let distance = 1
    let hasMeasured = false

    const updateProgress = () => {
      if (completeRef.current) return
      const rect = track.getBoundingClientRect()
      const rawProgress = (stickyTop - rect.top) / distance
      if (rawProgress >= 0 && rawProgress < 1) hasEntered.current = true
      if (rawProgress >= 1 && !hasEntered.current) return
      if (rawProgress >= 1) {
        const frameTop = track.querySelector(".tour-scroll-sticky")?.getBoundingClientRect().top ?? stickyTop
        completionScrollTop.current = window.scrollY + rect.top - frameTop
        completeRef.current = true
        currentStepRef.current = null
        setActiveStep(null)
        setDismissedStep(null)
        setIsComplete(true)
        return
      }
      const progress = Math.max(0, Math.min(1, rawProgress))
      const stageProgress = Math.max(0, (progress - OVERVIEW_END) / (1 - OVERVIEW_END) * WORKFLOW_TOUR_STEPS.length)
      const nextStep = progress < OVERVIEW_END ? null : Math.min(WORKFLOW_TOUR_STEPS.length - 1, Math.floor(stageProgress))
      track.style.setProperty("--tour-route-progress", String(stageProgress % 1))
      if (nextStep !== currentStepRef.current) {
        currentStepRef.current = nextStep
        setActiveStep(nextStep)
        setDismissedStep(null)
      }
    }

    const measure = () => {
      const rect = track.getBoundingClientRect()
      const documentTop = window.scrollY + rect.top
      const previousProgress = hasMeasured ? (stickyTop - rect.top) / distance : -1
      const oldStickyTop = stickyTop
      const oldDistance = distance
      const headerHeight = header?.getBoundingClientRect().height ?? 0
      const viewportHeight = window.innerHeight
      stickyTop = headerHeight + 12
      const stickyHeight = Math.max(260, viewportHeight - headerHeight - 24)
      distance = Math.max(280, viewportHeight * 0.62) * (WORKFLOW_TOUR_STEPS.length + 0.5)
      track.style.setProperty("--tour-sticky-top", `${stickyTop}px`)
      track.style.setProperty("--tour-sticky-height", `${stickyHeight}px`)
      track.style.height = completeRef.current ? "auto" : `${stickyHeight + distance}px`
      if (!completeRef.current && previousProgress > 0 && previousProgress < 1 && (oldStickyTop !== stickyTop || oldDistance !== distance)) {
        window.scrollTo({ top: documentTop - stickyTop + distance * previousProgress, behavior: "instant" })
      }
      hasMeasured = true
      needsMeasure = false
      updateProgress()
    }

    const schedule = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        if (needsMeasure) measure()
        else updateProgress()
      })
    }
    const resize = () => { needsMeasure = true; schedule() }
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize)
    if (header) observer?.observe(header)
    measure()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", resize)
    return () => {
      window.cancelAnimationFrame(frame)
      observer?.disconnect()
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", resize)
    }
  }, [])

  const selectStep = (index: number) => {
    const track = trackRef.current
    if (!track) return
    setDismissedStep(null)
    if (completeRef.current) {
      currentStepRef.current = index
      setActiveStep(index)
      return
    }
    const stickyTop = Number.parseFloat(track.style.getPropertyValue("--tour-sticky-top"))
    const stickyHeight = Number.parseFloat(track.style.getPropertyValue("--tour-sticky-height"))
    const distance = track.offsetHeight - stickyHeight
    const progress = OVERVIEW_END + (index + 0.5) / WORKFLOW_TOUR_STEPS.length * (1 - OVERVIEW_END)
    window.scrollTo({
      top: window.scrollY + track.getBoundingClientRect().top - stickyTop + distance * progress,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    })
  }

  return {
    trackRef,
    activeStep,
    isComplete,
    panelVisible: activeStep !== null && dismissedStep !== activeStep,
    dismissPanel: () => setDismissedStep(activeStep),
    selectStep,
  }
}
