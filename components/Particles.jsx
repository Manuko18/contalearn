"use client"

import { useEffect, useState } from "react"
import { generateParticles, SHAPES } from "../lib/particles"

/**
 * ══════════════════════════════════════════════
 *  Particles — Componente de partículas reutilizable
 *
 *  Uso 1 — mount-to-play (más simple):
 *    {show && <Particles key={key} preset="combo" />}
 *    // Montar = disparar. Cambia `key` para retriggerar.
 *
 *  Uso 2 — posición absoluta:
 *    <Particles preset="rankUp" x={mouseX} y={mouseY} fixed />
 *
 *  Props:
 *    preset   → string (key de PRESETS en lib/particles.js)
 *    count    → override de cantidad
 *    x, y     → posición del centro (default: 50vw / 50vh)
 *    fixed    → si true, usa position:fixed; si no, absolute
 * ══════════════════════════════════════════════
 */
export default function Particles({
  preset = "combo",
  count,
  x = "50%",
  y = "50%",
  fixed = true,
}) {
  // useState + useEffect evitan hydration mismatch con Math.random():
  // el array vacío se renderiza en servidor; en cliente el effect lo puebla.
  const [items, setItems] = useState([])
  useEffect(() => {
    // setTimeout(0) evita llamar setState síncronamente dentro del efecto
    const t = setTimeout(() => setItems(generateParticles(preset, count)), 0)
    return () => clearTimeout(t)
    // Solo se genera al montar; preset/count no cambian durante la vida del componente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (items.length === 0) return null

  return (
    <div
      style={{
        position: fixed ? "fixed" : "absolute",
        top: y,
        left: x,
        zIndex: 200,
        pointerEvents: "none",
        transform: "translate(-50%, -50%)",
      }}
      aria-hidden
    >
      {items.map((p) => (
        <div
          key={p.id}
          className="absolute animate-particle"
          style={{
            width:        p.size,
            height:       p.size,
            borderRadius: SHAPES[p.shape] ?? "50%",
            transform:    p.shape === "diamond" ? "rotate(45deg)" : undefined,
            background:   p.color,
            "--ang":      `${p.ang}deg`,
            "--tx":       `${p.speed}px`,
            animationDuration: `${p.dur}s`,
            boxShadow:    `0 0 ${p.size * 1.4}px ${p.color}99`,
            top:  -p.size / 2,
            left: -p.size / 2,
          }}
        />
      ))}
    </div>
  )
}
