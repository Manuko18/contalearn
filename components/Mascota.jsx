"use client"

import { useEffect, useState, useRef } from "react"

// ── Mapeo de estados legacy ──
const MAPA = {
  feliz:      "idle",
  hablando:   "hablando",
  celebrando: "celebrando",
  triste:     "triste",
  pensando:   "pensando",
}

// ── Config visual por estado ──
const CFG = {
  idle: {
    core:  ["#58cc02", "#0d2200"],
    glow:  "#58cc02",
    ring:  "#58cc02",
    eye:   "#ffffff",
    dur:   [8, 13, 18],
    aura:  0.18,
    clase: "conti-float",
  },
  hablando: {
    core:  ["#7fff1a", "#2a5500"],
    glow:  "#90ff20",
    ring:  "#80ff10",
    eye:   "#ffffff",
    dur:   [4, 6.5, 9],
    aura:  0.32,
    clase: "conti-float",
  },
  celebrando: {
    core:  ["#ffd700", "#8b3a00"],
    glow:  "#ffd700",
    ring:  "#ffcc00",
    eye:   "#ffffff",
    dur:   [1.8, 2.8, 4],
    aura:  0.6,
    clase: "animate-bounce",
  },
  triste: {
    core:  ["#4a9eff", "#050f2e"],
    glow:  "#4a9eff",
    ring:  "#2a5acc",
    eye:   "#aaccff",
    dur:   [18, 26, 34],
    aura:  0.09,
    clase: "conti-float",
  },
  pensando: {
    core:  ["#c084fc", "#2e0d66"],
    glow:  "#c084fc",
    ring:  "#a855f7",
    eye:   "#e9d5ff",
    dur:   [6, 9, 13],
    aura:  0.28,
    clase: "conti-float",
  },
  error: {
    core:  ["#ff4b4b", "#550000"],
    glow:  "#ff4b4b",
    ring:  "#ff2222",
    eye:   "#ffffff",
    dur:   [0.8, 1.2, 1.7],
    aura:  0.5,
    clase: "animate-shake",
  },
  sinVidas: {
    core:  ["#3a3a3a", "#111111"],
    glow:  "#333333",
    ring:  "#222222",
    eye:   "#444444",
    dur:   [30, 42, 55],
    aura:  0.04,
    clase: "",
  },
  maestro: {
    core:  ["#ffd700", "#3a7a00"],
    glow:  "#ffd700",
    ring:  "#ffd700",
    eye:   "#ffffff",
    dur:   [1.5, 2.2, 3.2],
    aura:  0.7,
    clase: "conti-float",
  },
  racha: {
    core:  ["#ff8c00", "#6b1a00"],
    glow:  "#ff8c00",
    ring:  "#ff6600",
    eye:   "#ffffff",
    dur:   [3, 5, 7],
    aura:  0.45,
    clase: "conti-float",
  },
}

// ── Ojos minimalistas por estado ──
function Ojos({ estado, color }) {
  switch (estado) {
    case "celebrando":
      return (
        <>
          <path d="M50,60 Q54,55 58,60" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
          <path d="M62,60 Q66,55 70,60" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
        </>
      )
    case "triste":
      return (
        <>
          <path d="M50,57 Q54,62 58,57" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
          <path d="M62,57 Q66,62 70,57" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        </>
      )
    case "pensando":
      return (
        <>
          <rect x="50" y="58.5" width="8" height="2.5" rx="1.25" fill={color} opacity="0.9"/>
          <rect x="62" y="59.2" width="8" height="1.6" rx="0.8"  fill={color} opacity="0.55"/>
        </>
      )
    case "error":
      return (
        <>
          <path d="M50,56 L58,64 M58,56 L50,64" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
          <path d="M62,56 L70,64 M70,56 L62,64" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
        </>
      )
    case "sinVidas":
      return (
        <>
          <circle cx="54" cy="60" r="1.6" fill={color} opacity="0.35"/>
          <circle cx="66" cy="60" r="1.6" fill={color} opacity="0.35"/>
        </>
      )
    default: // idle, hablando, maestro, racha
      return (
        <>
          <rect x="50" y="58.5" width="8" height="2.5" rx="1.25" fill={color} opacity="0.92"/>
          <rect x="62" y="58.5" width="8" height="2.5" rx="1.25" fill={color} opacity="0.92"/>
          <circle cx="54" cy="59.75" r="1.1" fill="white" opacity="0.55"/>
          <circle cx="66" cy="59.75" r="1.1" fill="white" opacity="0.55"/>
        </>
      )
  }
}

// ── Nivel de evolución según XP ──
function getEvolutionLevel(xp) {
  if (xp >= 300) return 5
  if (xp >= 240) return 4
  if (xp >= 180) return 3
  if (xp >= 120) return 2
  if (xp >= 60)  return 1
  return 0
}

export default function Mascota({ estado = "idle", size = 160, mensaje = null, xp = 0 }) {
  const [boca, setBoca]   = useState(false)
  const [hover, setHover] = useState(false)
  const [tilt, setTilt]   = useState({ x: 0, y: 0 })
  const ref = useRef(null)

  // Boca pulsando al hablar
  useEffect(() => {
    if (estado !== "hablando") {
      // Diferir para no llamar setState síncronamente dentro del efecto
      const t = setTimeout(() => setBoca(false), 0)
      return () => clearTimeout(t)
    }
    const iv = setInterval(() => setBoca(b => !b), 340)
    return () => clearInterval(iv)
  }, [estado])

  // Seguimiento del cursor para tilt 3D
  const onMouseMove = (e) => {
    if (!ref.current) return
    const r  = ref.current.getBoundingClientRect()
    const dx = (e.clientX - (r.left + r.width  / 2)) / (r.width  / 2)
    const dy = (e.clientY - (r.top  + r.height / 2)) / (r.height / 2)
    setTilt({ x: dy * -12, y: dx * 12 })
  }

  const key  = MAPA[estado] || estado
  const c    = CFG[key] || CFG.idle
  const uid  = key
  const evo  = getEvolutionLevel(xp)

  // Anillos más rápidos al hover
  const dur = hover
    ? c.dur.map(d => `${(d * 0.28).toFixed(1)}s`)
    : c.dur.map(d => `${d}s`)

  // ── Holographic scanlines period (varía por estado) ──
  const shimmerDur = key === "maestro" ? "3.5s" : key === "celebrando" ? "2s" : "5s"

  return (
    <div className="flex flex-col items-center gap-3">

      {/* Wrapper con tilt 3D */}
      <div
        ref={ref}
        className={c.clase}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => { setHover(false); setTilt({ x: 0, y: 0 }) }}
        onMouseMove={onMouseMove}
        style={{
          width: size,
          height: size,
          transform: `perspective(500px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hover ? 1.06 : 1})`,
          transition: hover ? "transform 0.08s ease" : "transform 0.45s cubic-bezier(.25,.46,.45,.94)",
          cursor: "pointer",
        }}
      >
        <svg
          viewBox="0 0 120 120"
          width={size}
          height={size}
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: "visible" }}
        >
          <defs>
            {/* ── Glow multicapa ── */}
            <filter id={`gd-${uid}`} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="7"   result="b1"/>
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="b2"/>
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="b3"/>
              <feMerge>
                <feMergeNode in="b1"/>
                <feMergeNode in="b2"/>
                <feMergeNode in="b3"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Glow leve detalles */}
            <filter id={`gs-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
              <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>

            {/* ── Holographic: scanlines pattern ── */}
            <pattern id={`sl-${uid}`} x="0" y="0" width="120" height="2.4" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="120" height="0.75" fill="#000000" opacity="0.2"/>
            </pattern>

            {/* Nucleus clipPath (para shimmer) */}
            <clipPath id={`nc-${uid}`}>
              <circle cx="60" cy="60" r="21"/>
            </clipPath>

            {/* Gradiente principal del núcleo */}
            <radialGradient id={`cg-${uid}`} cx="32%" cy="25%" r="72%">
              <stop offset="0%"   stopColor={c.core[0]} stopOpacity="1"/>
              <stop offset="40%"  stopColor={c.core[0]} stopOpacity="0.7"/>
              <stop offset="100%" stopColor={c.core[1]} stopOpacity="1"/>
            </radialGradient>

            {/* Gradiente inner glow */}
            <radialGradient id={`ig-${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor={c.glow} stopOpacity="0.55"/>
              <stop offset="55%"  stopColor={c.glow} stopOpacity="0.15"/>
              <stop offset="100%" stopColor={c.glow} stopOpacity="0"/>
            </radialGradient>

            {/* Gradiente aura exterior */}
            <radialGradient id={`ag-${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor={c.glow} stopOpacity={c.aura}/>
              <stop offset="55%"  stopColor={c.glow} stopOpacity={c.aura * 0.3}/>
              <stop offset="100%" stopColor={c.glow} stopOpacity="0"/>
            </radialGradient>

            {/* Halo hover */}
            <radialGradient id={`hv-${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor={c.glow} stopOpacity={hover ? 0.28 : 0}/>
              <stop offset="100%" stopColor={c.glow} stopOpacity="0"/>
            </radialGradient>
          </defs>

          {/* ════ AURA EXTERIOR pulsante ════ */}
          <circle cx="60" cy="60" r="56" fill={`url(#ag-${uid})`} className="conti-aura"/>

          {/* Halo hover extra */}
          <circle cx="60" cy="60" r="58" fill={`url(#hv-${uid})`}/>

          {/* ════ ANILLO 1 — ecuatorial ════ */}
          <g>
            <ellipse cx="60" cy="60" rx="43" ry="11"
              fill="none" stroke={c.ring} strokeWidth="1.2" opacity={hover ? 0.85 : 0.6}/>
            <circle cx="103" cy="60" r="3.5" fill={c.glow} opacity="0.95" filter={`url(#gs-${uid})`}/>
            <animateTransform attributeName="transform" type="rotate"
              from="0 60 60" to="360 60 60" dur={dur[0]} repeatCount="indefinite"/>
          </g>

          {/* ════ ANILLO 2 — inclinado 65° ════ */}
          <g transform="rotate(65 60 60)">
            <g>
              <ellipse cx="60" cy="60" rx="37" ry="9.5"
                fill="none" stroke={c.ring} strokeWidth="0.9" opacity={hover ? 0.65 : 0.42}/>
              <circle cx="97" cy="60" r="2.8" fill={c.glow} opacity="0.85" filter={`url(#gs-${uid})`}/>
              <animateTransform attributeName="transform" type="rotate"
                from="0 60 60" to="-360 60 60" dur={dur[1]} repeatCount="indefinite"/>
            </g>
          </g>

          {/* ════ ANILLO 3 — inclinado 130° ════ */}
          <g transform="rotate(130 60 60)">
            <g>
              <ellipse cx="60" cy="60" rx="31" ry="7.8"
                fill="none" stroke={c.ring} strokeWidth="0.7" opacity={hover ? 0.5 : 0.28}/>
              <circle cx="91" cy="60" r="2.2" fill={c.glow} opacity="0.7"/>
              <animateTransform attributeName="transform" type="rotate"
                from="0 60 60" to="360 60 60" dur={dur[2]} repeatCount="indefinite"/>
            </g>
          </g>

          {/* ════ ANILLO 4 — EVO 1+ (cyan, rx=48) ════ */}
          {evo >= 1 && (
            <g transform="rotate(30 60 60)">
              <g>
                <ellipse cx="60" cy="60" rx="48" ry="10"
                  fill="none" stroke="#1cb0f6" strokeWidth="0.8"
                  strokeDasharray="6 4"
                  opacity={hover ? 0.65 : 0.38}/>
                <circle cx="108" cy="60" r="2.8" fill="#1cb0f6" opacity="0.9" filter={`url(#gs-${uid})`}/>
                <animateTransform attributeName="transform" type="rotate"
                  from="0 60 60" to="-360 60 60" dur="22s" repeatCount="indefinite"/>
              </g>
            </g>
          )}

          {/* ════ ANILLO 5 — EVO 2+ (blue, rx=51) ════ */}
          {evo >= 2 && (
            <g transform="rotate(85 60 60)">
              <g>
                <ellipse cx="60" cy="60" rx="51" ry="9.2"
                  fill="none" stroke="#4a9eff" strokeWidth="0.65"
                  strokeDasharray="3 6"
                  opacity={hover ? 0.5 : 0.28}/>
                <circle cx="111" cy="60" r="2.2" fill="#4a9eff" opacity="0.8" filter={`url(#gs-${uid})`}/>
                <animateTransform attributeName="transform" type="rotate"
                  from="0 60 60" to="360 60 60" dur="29s" repeatCount="indefinite"/>
              </g>
            </g>
          )}

          {/* ════ ANILLO 6 — EVO 3+ (purple, rx=54) ════ */}
          {evo >= 3 && (
            <g transform="rotate(155 60 60)">
              <g>
                <ellipse cx="60" cy="60" rx="54" ry="8.5"
                  fill="none" stroke="#c084fc" strokeWidth="0.55"
                  strokeDasharray="2 5"
                  opacity={hover ? 0.45 : 0.22}/>
                <circle cx="114" cy="60" r="1.8" fill="#c084fc" opacity="0.75"/>
                <animateTransform attributeName="transform" type="rotate"
                  from="0 60 60" to="-360 60 60" dur="36s" repeatCount="indefinite"/>
              </g>
            </g>
          )}

          {/* ════ ANILLO 7 — EVO 4+ (golden, rx=57, dual dot) ════ */}
          {evo >= 4 && (
            <g transform="rotate(210 60 60)">
              <g>
                <ellipse cx="60" cy="60" rx="57" ry="7.8"
                  fill="none" stroke="#ffd700" strokeWidth="0.5"
                  strokeDasharray="1.5 7"
                  opacity={hover ? 0.55 : 0.3}/>
                <circle cx="117" cy="60" r="1.6" fill="#ffd700" opacity="0.9" filter={`url(#gs-${uid})`}/>
                <circle cx="3"   cy="60" r="1.2" fill="#ffd700" opacity="0.6"/>
                <animateTransform attributeName="transform" type="rotate"
                  from="0 60 60" to="360 60 60" dur="44s" repeatCount="indefinite"/>
              </g>
            </g>
          )}

          {/* ════ SÍMBOLOS FINANCIEROS ORBITANDO — EVO 5 (maestro) ════
               Patrón: la rotación es alrededor de (60,60).
               El texto está en x=60, y=60-R → orbita a radio R del centro.
               ════ */}
          {evo >= 5 && (
            <>
              {/* ∑ — radio 53, órbita 18s sentido horario */}
              <g opacity={hover ? 0.88 : 0.68} filter={`url(#gs-${uid})`}>
                <text x="60" y="7" fontSize="9" fontWeight="800"
                  fill="#ffd700" textAnchor="middle" dominantBaseline="middle">∑</text>
                <animateTransform attributeName="transform" type="rotate"
                  from="0 60 60" to="360 60 60" dur="18s" repeatCount="indefinite"/>
              </g>

              {/* % — radio 53, empieza 120°, órbita 24s antihorario */}
              <g opacity={hover ? 0.82 : 0.62} filter={`url(#gs-${uid})`}>
                <text x="60" y="7" fontSize="8" fontWeight="800"
                  fill="#c084fc" textAnchor="middle" dominantBaseline="middle">%</text>
                <animateTransform attributeName="transform" type="rotate"
                  from="120 60 60" to="-240 60 60" dur="24s" repeatCount="indefinite"/>
              </g>

              {/* $ — radio 53, empieza 240°, órbita 30s horario */}
              <g opacity={hover ? 0.82 : 0.60} filter={`url(#gs-${uid})`}>
                <text x="60" y="7" fontSize="9" fontWeight="800"
                  fill="#1cb0f6" textAnchor="middle" dominantBaseline="middle">$</text>
                <animateTransform attributeName="transform" type="rotate"
                  from="240 60 60" to="600 60 60" dur="30s" repeatCount="indefinite"/>
              </g>
            </>
          )}

          {/* ════ HALO PRE-NÚCLEO (profundidad extra) ════ */}
          <circle cx="60" cy="60" r="26" fill={c.glow} opacity="0.06" filter={`url(#gd-${uid})`}/>

          {/* ════ NÚCLEO PRINCIPAL ════ */}
          <circle cx="60" cy="60" r="21"
            fill={`url(#cg-${uid})`}
            filter={`url(#gd-${uid})`}
            className="conti-breathe"/>

          {/* ════ ENERGÍA INTERNA ════ */}
          <circle cx="60" cy="60" r="15" fill={`url(#ig-${uid})`}/>
          <circle cx="60" cy="60" r="7"  fill={c.glow} opacity="0.18"/>
          <circle cx="60" cy="60" r="3"  fill={c.glow} opacity="0.35"/>

          {/* ════ HOLOGRAPHIC — Scanlines overlay ════ */}
          <circle cx="60" cy="60" r="21" fill={`url(#sl-${uid})`} opacity="0.18"/>

          {/* ════ HOLOGRAPHIC — Chromatic aberration (RGB split sutil) ════ */}
          <circle cx="58.8" cy="60" r="20.5" fill="none"
            stroke="rgba(28,176,246,0.11)" strokeWidth="2"/>
          <circle cx="61.2" cy="60" r="20.5" fill="none"
            stroke="rgba(255,75,146,0.08)" strokeWidth="2"/>

          {/* ════ HOLOGRAPHIC — Shimmer line ════ */}
          {(key === "idle" || key === "hablando" || key === "maestro" || key === "racha") && (
            <g clipPath={`url(#nc-${uid})`} opacity={hover ? 0.5 : 0.28}>
              <rect x="59.5" y="39" width="2" height="42" rx="1" fill="white">
                <animateTransform attributeName="transform" type="translate"
                  from="-24 0" to="24 0" dur={shimmerDur} repeatCount="indefinite"/>
              </rect>
            </g>
          )}

          {/* ════ ANILLO DE ESCANEO INTERNO ════ */}
          <g>
            <circle cx="60" cy="60" r="14"
              fill="none" stroke={c.ring}
              strokeWidth="0.6" strokeDasharray="3.5 3"
              opacity="0.35"/>
            <animateTransform attributeName="transform" type="rotate"
              from="0 60 60" to="360 60 60" dur="5s" repeatCount="indefinite"/>
          </g>

          {/* ════ HIGHLIGHTS 3D ════ */}
          <ellipse cx="53" cy="51" rx="7.5" ry="4.5"
            fill="white" opacity="0.13" transform="rotate(-28 53 51)"/>
          <ellipse cx="55" cy="49" rx="3.5" ry="2"
            fill="white" opacity="0.22" transform="rotate(-28 55 49)"/>
          <circle cx="52" cy="49" r="1.5" fill="white" opacity="0.3"/>

          {/* ════ OJOS LED MINIMALISTAS ════ */}
          <Ojos estado={key} color={c.eye}/>

          {/* ════ BOCA DE ENERGÍA (solo hablando) ════ */}
          {key === "hablando" && (
            <rect
              x={boca ? 49 : 52} y="66"
              width={boca ? 22 : 16} height="2.5" rx="1.25"
              fill={c.ring} opacity="0.85"
            />
          )}

          {/* ════ MICRO DATOS FLOTANTES ════ */}
          {(key === "idle" || key === "hablando" || key === "maestro") && (
            <g opacity={hover ? 0.6 : 0.35} filter={`url(#gs-${uid})`}>
              <g>
                <rect x="83" y="25" width="3.5" height="8"  rx="1" fill={c.ring}/>
                <rect x="88" y="21" width="3.5" height="12" rx="1" fill={c.ring}/>
                <rect x="93" y="27" width="3.5" height="6"  rx="1" fill={c.ring}/>
                <animateTransform attributeName="transform" type="rotate"
                  from="0 60 60" to="360 60 60" dur="32s" repeatCount="indefinite"/>
              </g>
              <g>
                <path d="M22,82 L27,77 L32,79 L37,73 L42,74"
                  fill="none" stroke={c.ring} strokeWidth="1.4"
                  strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="42" cy="74" r="1.8" fill={c.glow}/>
                <animateTransform attributeName="transform" type="rotate"
                  from="0 60 60" to="-360 60 60" dur="38s" repeatCount="indefinite"/>
              </g>
            </g>
          )}

          {/* ════ EFECTOS POR ESTADO ════ */}

          {key === "celebrando" && (<>
            <text x="8"  y="24" fontSize="12" opacity="0.95">✨</text>
            <text x="90" y="18" fontSize="11" opacity="0.9">⭐</text>
            <text x="92" y="92" fontSize="10" opacity="0.85">✨</text>
            <text x="5"  y="92" fontSize="10" opacity="0.85">🌟</text>
            <circle cx="60" cy="60" r="28" fill="none"
              stroke="#ffd700" strokeWidth="1.2" opacity="0.25" strokeDasharray="4 6"/>
          </>)}

          {key === "maestro" && (
            <g filter={`url(#gs-${uid})`}>
              <path d="M50,31 L53,39 L60,34 L67,39 L70,31 L66,37 L60,35 L54,37 Z"
                fill="#ffd700" opacity="0.95"/>
              <circle cx="50" cy="31" r="2.2" fill="#ffd700"/>
              <circle cx="70" cy="31" r="2.2" fill="#ffd700"/>
              <circle cx="60" cy="33" r="1.8" fill="#fffacc"/>
            </g>
          )}

          {key === "pensando" && (
            <text x="79" y="25" fontSize="17"
              fill={c.glow} fontWeight="bold" opacity="0.85"
              filter={`url(#gs-${uid})`}>?</text>
          )}

          {key === "triste" && (<>
            <ellipse cx="52" cy="68" rx="1.6" ry="3.2" fill="#4a9eff" opacity="0.6"/>
            <ellipse cx="68" cy="69" rx="1.6" ry="3.2" fill="#4a9eff" opacity="0.42"/>
          </>)}

          {key === "racha" && (<>
            <text x="4"  y="28" fontSize="13" opacity="0.9">🔥</text>
            <text x="92" y="28" fontSize="13" opacity="0.9">🔥</text>
          </>)}

          {key === "error" && (
            <circle cx="60" cy="60" r="25" fill="none"
              stroke="#ff4b4b" strokeWidth="1.2" opacity="0.35" strokeDasharray="3 4"/>
          )}

          {/* Línea de escaneo horizontal (idle/maestro) */}
          {(key === "idle" || key === "maestro") && (
            <line x1="39" y1="60" x2="81" y2="60"
              stroke={c.ring} strokeWidth="0.5" opacity="0.2" strokeDasharray="2 3"/>
          )}

          {/* Sombra base */}
          <ellipse cx="60" cy="113" rx="20" ry="3" fill="rgba(0,0,0,0.15)"/>
        </svg>
      </div>

      {/* ════ BURBUJA DE MENSAJE ════ */}
      {mensaje && (
        <div className="relative max-w-xs w-full animate-pop-in">
          <div
            className="rounded-2xl px-4 py-3 text-sm font-semibold text-white text-center leading-snug"
            style={{
              background: "rgba(31,45,53,0.9)",
              border: `1.5px solid ${c.ring}44`,
              boxShadow: `0 0 20px ${c.glow}22, 0 2px 12px rgba(0,0,0,0.4)`,
              backdropFilter: "blur(8px)",
            }}
          >
            {mensaje}
          </div>
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45"
            style={{ background: c.ring, boxShadow: `0 0 10px ${c.glow}88` }}/>
        </div>
      )}
    </div>
  )
}
