import { useEffect, useRef } from 'react'

export function SubscriptionConfetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!canvas || motion.matches || document.visibilityState === 'hidden') return
    const context = canvas.getContext('2d')
    if (!context) return

    const width = window.innerWidth
    const height = window.innerHeight
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = width * ratio
    canvas.height = height * ratio
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    context.scale(ratio, ratio)
    const theme = getComputedStyle(document.documentElement)
    const colors = [
      theme.getPropertyValue('--primary').trim() || '#4f46e5',
      theme.getPropertyValue('--success').trim() || '#16a34a',
      theme.getPropertyValue('--warning').trim() || '#d97706',
    ]
    const particles = Array.from({ length: width < 640 ? 48 : 72 }, (_, index) => ({
      x: width * (index % 2 === 0 ? 0.25 : 0.75),
      y: Math.min(height * 0.4, 320),
      vx: (Math.random() - 0.5) * 9,
      vy: -5 - Math.random() * 7,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.2,
      size: 4 + Math.random() * 4,
      color: colors[index % colors.length],
    }))
    let frame = 0
    let startedAt = 0
    let previousTime = 0
    const stop = () => {
      cancelAnimationFrame(frame)
      context.clearRect(0, 0, width, height)
      canvas.hidden = true
    }
    const draw = (time: number) => {
      if (!startedAt) startedAt = previousTime = time
      const elapsed = time - startedAt
      if (elapsed >= 2800) { stop(); return }
      const step = Math.min((time - previousTime) / 16.67, 2)
      previousTime = time
      context.clearRect(0, 0, width, height)
      context.globalAlpha = Math.min(1, (2800 - elapsed) / 600)
      for (const particle of particles) {
        particle.x += particle.vx * step
        particle.y += particle.vy * step
        particle.vy += 0.17 * step
        particle.rotation += particle.spin * step
        context.save()
        context.translate(particle.x, particle.y)
        context.rotate(particle.rotation)
        context.fillStyle = particle.color
        context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.55)
        context.restore()
      }
      frame = requestAnimationFrame(draw)
    }
    canvas.hidden = false
    frame = requestAnimationFrame(draw)
    const onVisibilityChange = () => { if (document.visibilityState === 'hidden') stop() }
    motion.addEventListener('change', stop)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('resize', stop)
    return () => {
      stop()
      motion.removeEventListener('change', stop)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('resize', stop)
    }
  }, [])

  return <canvas ref={canvasRef} hidden aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60]" />
}
