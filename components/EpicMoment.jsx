"use client"

import { useEffect } from "react"

/**
 * ══════════════════════════════════════════════
 *  EpicMoment — Overlay para eventos especiales
 *  Se monta sobre toda la UI como un portal visual.
 *  Se auto-descarta después de 2.6s llamando onDone.
 *
 *  Uso:
 *    <EpicMoment
 *      event={{ type: "levelComplete", data: { subtitle: "100% correcto" } }}
 *      onDone={() => setEpicEvent(null)}
 *    />
 * ══════════════════════════════════════════════
 */

const CONFIGS = {
  levelComplete: {
    icon:     "🏆",
    title:    "¡Nivel Completado!",
    color:    "#58cc02",
    glow:     "rgba(88,204,2,0.55)",
    rings:    2,
    particles: 18,
  },
  rankUp: {
    icon:     "👑",
    title:    "¡Nuevo Rango!",
    color:    "#ffd700",
    glow:     "rgba(255,215,0,0.6)",
    rings:    3,
    particles: 22,
  },
  missionComplete: {
    icon:     "✅",
    title:    "¡Misión Completada!",
    color:    "#1cb0f6",
    glow:     "rgba(28,176,246,0.55)",
    rings:    2,
    particles: 14,
  },
  comboMax: {
    icon:     "🔥",
    title:    "¡COMBO MÁXIMO!",
    color:    "#ffc800",
    glow:     "rgba(255,200,0,0.55)",
    rings:    2,
    particles: 16,
  },
  unlock: {
    icon:     "🔓",
    title:    "¡Desbloqueado!",
    color:    "#c084fc",
    glow:     "rgba(192,132,252,0.55)",
    rings:    2,
    particles: 14,
  },
  perfectRun: {
    icon:     "⭐",
    title:    "¡Sin errores!",
    color:    "#ffd700",
    glow:     "rgba(255,215,0,0.6)",
    rings:    3,
    particles: 20,
  },
}

export default function EpicMoment({ event, onDone }) {
  // Auto-dismiss
  useEffect(() => {
    if (!event) return
    const t = setTimeout(onDone, 2650)
    return () => clearTimeout(t)
  }, [event, onDone])

  if (!event) return null

  const cfg = CONFIGS[event.type] ?? CONFIGS.levelComplete
  const title   = event.data?.title    ?? cfg.title
  const subtitle = event.data?.subtitle ?? null

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999 }}
      aria-live="polite"
      aria-label={title}
    >
      {/* ── Backdrop glow radial ── */}
      <div
        className="absolute inset-0 epic-bg"
        style={{
          background: `radial-gradient(ellipse 55% 55% at 50% 50%, ${cfg.glow} 0%, transparent 70%)`,
        }}
      />

      {/* ── Expanding rings ── */}
      {Array.from({ length: cfg.rings }, (_, i) => (
        <div
          key={i}
          className="absolute epic-ring"
          style={{
            top: "50%", left: "50%",
            width: 100, height: 100,
            marginTop: -50, marginLeft: -50,
            borderRadius: "50%",
            border: `${i === 0 ? 2 : 1}px solid ${cfg.color}${i === 0 ? "cc" : "55"}`,
            animationDelay: `${i * 0.18}s`,
          }}
        />
      ))}

      {/* ── Central content ── */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center epic-pop"
        style={{ gap: "12px" }}
      >
        <div style={{ fontSize: "88px", lineHeight: 1, filter: `drop-shadow(0 0 20px ${cfg.glow})` }}>
          {cfg.icon}
        </div>
        <p
          className="font-extrabold text-center leading-tight"
          style={{
            fontSize: "clamp(28px, 6vw, 42px)",
            color: cfg.color,
            textShadow: `0 0 48px ${cfg.glow}, 0 0 24px ${cfg.glow}, 0 2px 0 rgba(0,0,0,0.6)`,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </p>
        {subtitle && (
          <p
            className="text-lg font-semibold"
            style={{ color: "rgba(255,255,255,0.7)", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* ── Particle burst desde el centro ── */}
      <div
        className="absolute"
        style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
      >
        {Array.from({ length: cfg.particles }, (_, i) => {
          const size = 7 + (i % 5) * 3
          return (
            <div
              key={i}
              className="absolute animate-particle"
              style={{
                width:  size,
                height: size,
                borderRadius: i % 3 === 0 ? "2px" : "50%",
                background: cfg.color,
                "--ang": `${(360 / cfg.particles) * i}deg`,
                boxShadow: `0 0 10px ${cfg.glow}`,
                top: 0, left: 0,
                marginTop: -size / 2,
                marginLeft: -size / 2,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
