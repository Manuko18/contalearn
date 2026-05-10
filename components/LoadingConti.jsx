"use client"

/**
 * Pantalla de carga premium — mini Conti Core ensamblándose
 * con anillos orbitando y puntos animados.
 */
export default function LoadingConti({ texto = "Cargando..." }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8"
      style={{ background: "transparent" }}
    >
      {/* Mini Conti Core */}
      <div className="relative">
        <svg viewBox="0 0 80 80" width="88" height="88" aria-hidden>
          <defs>
            {/* Glow filter */}
            <filter id="lc-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="5" result="b1" />
              <feGaussianBlur stdDeviation="2.5" result="b2" />
              <feMerge>
                <feMergeNode in="b1" />
                <feMergeNode in="b2" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Nucleus gradient */}
            <radialGradient id="lc-core" cx="50%" cy="40%" r="55%">
              <stop offset="0%"   stopColor="#7fff3a" />
              <stop offset="45%"  stopColor="#58cc02" />
              <stop offset="100%" stopColor="#1f4a00" />
            </radialGradient>

            {/* Inner orb */}
            <radialGradient id="lc-orb" cx="42%" cy="38%" r="55%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#58cc02" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Outer halo */}
          <circle cx="40" cy="40" r="22" fill="none" stroke="#58cc02" strokeWidth="0.5" opacity="0.2">
            <animate attributeName="r"       values="22;26;22"      dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.2;0.05;0.2"  dur="2.5s" repeatCount="indefinite" />
          </circle>

          {/* Ring 1 — equatorial */}
          <g>
            <ellipse cx="40" cy="40" rx="34" ry="10" fill="none"
              stroke="#58cc02" strokeWidth="1.5" opacity="0.55" strokeDasharray="8 5">
              <animateTransform attributeName="transform" type="rotate"
                from="0 40 40" to="360 40 40" dur="2.4s" repeatCount="indefinite" />
            </ellipse>
          </g>

          {/* Ring 2 — 65° */}
          <g transform="rotate(65 40 40)">
            <ellipse cx="40" cy="40" rx="31" ry="10" fill="none"
              stroke="#1cb0f6" strokeWidth="1" opacity="0.5" strokeDasharray="6 6">
              <animateTransform attributeName="transform" type="rotate"
                from="360 40 40" to="0 40 40" dur="3.1s" repeatCount="indefinite" />
            </ellipse>
          </g>

          {/* Ring 3 — 130° */}
          <g transform="rotate(130 40 40)">
            <ellipse cx="40" cy="40" rx="28" ry="9" fill="none"
              stroke="#c084fc" strokeWidth="1" opacity="0.4" strokeDasharray="5 7">
              <animateTransform attributeName="transform" type="rotate"
                from="0 40 40" to="360 40 40" dur="3.9s" repeatCount="indefinite" />
            </ellipse>
          </g>

          {/* Nucleus */}
          <circle cx="40" cy="40" r="15" fill="url(#lc-core)" filter="url(#lc-glow)">
            <animate attributeName="r" values="15;16.5;15" dur="2s" repeatCount="indefinite" />
          </circle>

          {/* Inner orb */}
          <circle cx="40" cy="40" r="7" fill="url(#lc-orb)" opacity="0.6">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="1.6s" repeatCount="indefinite" />
          </circle>

          {/* Scan ring */}
          <circle cx="40" cy="40" r="10" fill="none"
            stroke="#58cc02" strokeWidth="0.6" strokeDasharray="4 4" opacity="0.4">
            <animateTransform attributeName="transform" type="rotate"
              from="0 40 40" to="360 40 40" dur="4s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      {/* Texto + dots */}
      <div className="flex flex-col items-center gap-3">
        <p
          className="text-sm font-bold tracking-widest uppercase"
          style={{ color: "#94a3b8", letterSpacing: "0.15em" }}
        >
          {texto}
        </p>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: "var(--color-primary)",
                animation: `dot-pulse 1.2s ease-in-out ${i * 0.22}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
