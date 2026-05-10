"use client"

import { useEffect, useRef, useState } from "react"

/**
 * ══════════════════════════════════════════════
 *  AchievementToast — Notificación de logro premium
 *
 *  Uso:
 *    const [queue, setQueue] = useState([])
 *    const [current, setCurrent] = useState(null)
 *
 *    // Cuando desbloqueas logros:
 *    setQueue(prev => [...prev, ...newAchs])
 *
 *    <AchievementToast
 *      achievement={current}
 *      queue={queue}
 *      onDequeue={(remaining) => { setCurrent(remaining[0] || null); setQueue(remaining.slice(1)) }}
 *    />
 * ══════════════════════════════════════════════
 */

export default function AchievementToast({ achievement, onDone }) {
  const [phase, setPhase] = useState("hidden") // hidden | enter | visible | exit

  // Ref para que el efecto lea siempre la versión más reciente de onDone
  // sin necesitar agregarla a las deps (evita re-ciclos por funciones inline).
  const onDoneRef = useRef(onDone)
  useEffect(() => { onDoneRef.current = onDone })

  useEffect(() => {
    if (!achievement) {
      // Diferir el setState para no llamarlo síncronamente dentro del efecto
      const t = setTimeout(() => setPhase("hidden"), 0)
      return () => clearTimeout(t)
    }

    // Secuencia: enter → visible → exit → done (todo diferido con setTimeout)
    const t0 = setTimeout(() => setPhase("enter"),   0)
    const t1 = setTimeout(() => setPhase("visible"), 50)
    const t2 = setTimeout(() => setPhase("exit"),    3800)
    const t3 = setTimeout(() => { setPhase("hidden"); onDoneRef.current?.() }, 4300)

    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [achievement])

  if (!achievement || phase === "hidden") return null

  const { rarityInfo } = achievement
  const color  = rarityInfo?.color  ?? "#58cc02"
  const glow   = rarityInfo?.glow   ?? "rgba(88,204,2,0.3)"
  const rLabel = rarityInfo?.label  ?? "Logro"

  const translateX = phase === "enter"   ? "100%"
                   : phase === "exit"    ? "110%"
                   : "0%"

  return (
    <div
      className="fixed right-4 top-20 z-[9998]"
      style={{
        transform:  `translateX(${translateX})`,
        transition: phase === "enter"
          ? "transform 0.45s cubic-bezier(.16,1,.3,1)"
          : "transform 0.35s cubic-bezier(.4,0,1,1)",
        maxWidth: "320px",
        width: "calc(100vw - 2rem)",
      }}
      role="alert"
      aria-live="polite"
    >
      <div
        style={{
          background:       "rgba(13,26,32,0.97)",
          backdropFilter:   "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border:           `1.5px solid ${color}50`,
          borderRadius:     "18px",
          padding:          "14px 16px",
          display:          "flex",
          alignItems:       "center",
          gap:              "14px",
          boxShadow:        `0 0 32px ${glow}, 0 8px 40px rgba(0,0,0,0.55)`,
        }}
      >
        {/* Badge icon */}
        <div
          style={{
            width:         52,
            height:        52,
            borderRadius:  "50%",
            background:    `${color}15`,
            border:        `2px solid ${color}`,
            display:       "flex",
            alignItems:    "center",
            justifyContent:"center",
            fontSize:      "24px",
            boxShadow:     `0 0 20px ${glow}`,
            flexShrink:    0,
            animation:     "achievement-pulse 1s ease-in-out 2",
          }}
        >
          {achievement.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize:      "9px",
              color,
              fontWeight:    700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom:  "3px",
            }}
          >
            🏆 {rLabel} · ¡Logro desbloqueado!
          </p>
          <p
            style={{
              fontSize:     "15px",
              fontWeight:   800,
              color:        "#ffffff",
              marginBottom: "2px",
              lineHeight:   1.2,
            }}
          >
            {achievement.name}
          </p>
          <p
            style={{
              fontSize: "11px",
              color:    "#94a3b8",
            }}
          >
            {achievement.desc}
          </p>
        </div>

        {/* Rarity glow bar */}
        <div
          style={{
            width:        3,
            alignSelf:    "stretch",
            borderRadius: "2px",
            background:   `linear-gradient(to bottom, ${color}, ${color}44)`,
            boxShadow:    `0 0 8px ${glow}`,
            flexShrink:   0,
          }}
        />
      </div>
    </div>
  )
}
