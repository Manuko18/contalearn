"use client"

import { useEffect, useRef } from "react"

/**
 * ══════════════════════════════════════════════
 *  FondoDinamico — Canvas reactivo
 *  Escucha CustomEvents "conti-event" emitidos
 *  desde lecciones.jsx y reacciona visualmente.
 *
 *  Eventos:  { type: "combo"|"error"|"rankup"|"levelComplete"|"normal" }
 * ══════════════════════════════════════════════
 */

const BASE = {
  particles: 38,
  gridLines: 6,
  floatSymbols: ["$", "%", "+", "−", "×", "≈", "∑", "π", "Δ", "∞"],
  symbolCount: 14,
}

// Paleta por modo
const MODES = {
  normal:        { pColor: "rgba(88,204,2,",   pColor2: "rgba(28,176,246,", pAlpha: 0.45, speedMult: 1,   connectDist: 130, connectAlpha: 0.10 },
  combo:         { pColor: "rgba(88,204,2,",   pColor2: "rgba(127,255,26,", pAlpha: 0.75, speedMult: 2.2, connectDist: 170, connectAlpha: 0.20 },
  error:         { pColor: "rgba(255,75,75,",  pColor2: "rgba(255,120,120,",pAlpha: 0.55, speedMult: 1.3, connectDist: 100, connectAlpha: 0.08 },
  rankup:        { pColor: "rgba(255,215,0,",  pColor2: "rgba(255,165,0,",  pAlpha: 0.85, speedMult: 3.0, connectDist: 200, connectAlpha: 0.25 },
  levelComplete: { pColor: "rgba(88,204,2,",   pColor2: "rgba(255,215,0,",  pAlpha: 0.75, speedMult: 2.5, connectDist: 180, connectAlpha: 0.22 },
}

export default function FondoDinamico() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")

    let W = window.innerWidth
    let H = window.innerHeight
    canvas.width  = W
    canvas.height = H

    // ── Modo reactivo ──
    const modeRef = { type: "normal", until: 0 }

    const handleContiEvent = (e) => {
      const type = e.detail?.type ?? "normal"
      const dur  = type === "rankup" || type === "levelComplete" ? 4000 : 2500
      modeRef.type  = type
      modeRef.until = Date.now() + dur
    }
    window.addEventListener("conti-event", handleContiEvent)

    // ── Partículas ──
    const particles = Array.from({ length: BASE.particles }, () => ({
      x:   Math.random() * W,
      y:   Math.random() * H,
      r:   0.8 + Math.random() * 2,
      vx:  (Math.random() - 0.5) * 0.22,
      vy:  (Math.random() - 0.5) * 0.22,
      alt: Math.random() > 0.7, // usa color alternativo
      a:   0.25 + Math.random() * 0.4,
    }))

    // ── Símbolos flotantes ──
    const symbols = Array.from({ length: BASE.symbolCount }, () => ({
      x:   Math.random() * W,
      y:   Math.random() * H,
      vy: -(0.12 + Math.random() * 0.18),
      sym: BASE.floatSymbols[Math.floor(Math.random() * BASE.floatSymbols.length)],
      size: 9 + Math.random() * 8,
      a:   0.05 + Math.random() * 0.09,
    }))

    let raf

    function draw() {
      ctx.clearRect(0, 0, W, H)

      const now    = Date.now()
      const active = now < modeRef.until ? modeRef.type : "normal"
      const mode   = MODES[active] ?? MODES.normal

      // ── Grid sutil ──
      const xstep = W / BASE.gridLines
      const ystep = H / BASE.gridLines
      ctx.lineWidth = 0.5
      for (let i = 0; i <= BASE.gridLines; i++) {
        const alpha = 0.055 + (i % 2 === 0 ? 0.025 : 0)
        ctx.strokeStyle = `rgba(45,63,74,${alpha})`
        ctx.beginPath(); ctx.moveTo(i * xstep, 0);   ctx.lineTo(i * xstep, H); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(0, i * ystep);   ctx.lineTo(W, i * ystep); ctx.stroke()
      }

      // ── Overlay de modo (error = pulso rojo, rankup = dorado) ──
      if (active === "error") {
        const progress = 1 - (modeRef.until - now) / 2500
        const alpha    = Math.max(0, 0.07 - progress * 0.07)
        ctx.fillStyle = `rgba(255,75,75,${alpha})`
        ctx.fillRect(0, 0, W, H)
      }
      if (active === "rankup" || active === "levelComplete") {
        const progress = 1 - (modeRef.until - now) / 4000
        const alpha    = Math.max(0, 0.06 * Math.sin(progress * Math.PI))
        ctx.fillStyle = active === "rankup"
          ? `rgba(255,215,0,${alpha})`
          : `rgba(88,204,2,${alpha})`
        ctx.fillRect(0, 0, W, H)
      }

      // ── Conexiones entre partículas ──
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx   = particles[i].x - particles[j].x
          const dy   = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < mode.connectDist) {
            const alpha = (1 - dist / mode.connectDist) * mode.connectAlpha
            ctx.strokeStyle = mode.pColor + alpha + ")"
            ctx.lineWidth   = 0.55
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      // ── Partículas ──
      for (const p of particles) {
        const speed = mode.speedMult
        p.x += p.vx * speed
        p.y += p.vy * speed
        if (p.x < 0) p.x = W
        if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H
        if (p.y > H) p.y = 0

        const col   = p.alt ? mode.pColor2 : mode.pColor
        const alpha = Math.min(0.98, p.a * (active !== "normal" ? 1.5 : 1))

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = col + alpha + ")"
        ctx.fill()

        // micro glow
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 3.5, 0, Math.PI * 2)
        ctx.fillStyle = col + (alpha * 0.13) + ")"
        ctx.fill()
      }

      // ── Símbolos financieros flotantes ──
      for (const s of symbols) {
        s.y += s.vy * (active !== "normal" ? 1.4 : 1)
        if (s.y < -20) { s.y = H + 10; s.x = Math.random() * W }
        ctx.font      = `${s.size}px 'Courier New', monospace`
        ctx.fillStyle = mode.pColor + s.a + ")"
        ctx.fillText(s.sym, s.x, s.y)
      }

      raf = requestAnimationFrame(draw)
    }

    draw()

    const onResize = () => {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width  = W
      canvas.height = H
    }
    window.addEventListener("resize", onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("conti-event", handleContiEvent)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
      aria-hidden
    />
  )
}
