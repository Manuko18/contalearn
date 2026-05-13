/**
 * ══════════════════════════════════════════════
 *  ContaLearn — Rank Theme System
 *  Cada rango tiene su identidad visual propia.
 *  Los cambios son SUTILES: glow, bar, shadow.
 *  NO colores de fondo distintos ni UI arcoíris.
 * ══════════════════════════════════════════════
 */

export const RANK_THEMES = {
  bronce: {
    key:     "bronce",
    name:    "Bronce",
    emoji:   "🥉",
    min:      0,
    color:   "#cd7f32",
    glow:    "rgba(205,127,50,0.35)",
    aura:    "rgba(205,127,50,0.06)",
    bar:     "linear-gradient(90deg, #7a4a12, #cd7f32, #e8a060)",
    particle:"#cd7f32",
    shadow:  "0 0 18px rgba(205,127,50,0.22)",
    border:  "rgba(205,127,50,0.35)",
  },
  plata: {
    key:     "plata",
    name:    "Plata",
    emoji:   "🥈",
    min:      60,
    color:   "#b0b0b0",
    glow:    "rgba(176,176,176,0.3)",
    aura:    "rgba(176,176,176,0.05)",
    bar:     "linear-gradient(90deg, #686868, #b0b0b0, #d8d8d8)",
    particle:"#c0c0c0",
    shadow:  "0 0 18px rgba(176,176,176,0.2)",
    border:  "rgba(176,176,176,0.3)",
  },
  oro: {
    key:     "oro",
    name:    "Oro",
    emoji:   "🥇",
    min:     120,
    color:   "#ffd700",
    glow:    "rgba(255,215,0,0.4)",
    aura:    "rgba(255,215,0,0.07)",
    bar:     "linear-gradient(90deg, #8b6e00, #ffd700, #fff176)",
    particle:"#ffd700",
    shadow:  "0 0 22px rgba(255,215,0,0.28)",
    border:  "rgba(255,215,0,0.38)",
  },
  platino: {
    key:     "platino",
    name:    "Platino",
    emoji:   "💎",
    min:     180,
    color:   "#00d4aa",
    glow:    "rgba(0,212,170,0.38)",
    aura:    "rgba(0,212,170,0.07)",
    bar:     "linear-gradient(90deg, #006e58, #00d4aa, #7fffd4)",
    particle:"#00d4aa",
    shadow:  "0 0 22px rgba(0,212,170,0.28)",
    border:  "rgba(0,212,170,0.36)",
  },
  diamante: {
    key:     "diamante",
    name:    "Diamante",
    emoji:   "💠",
    min:     240,
    color:   "#60a5fa",
    glow:    "rgba(96,165,250,0.4)",
    aura:    "rgba(96,165,250,0.07)",
    bar:     "linear-gradient(90deg, #1d4ed8, #60a5fa, #bfdbfe)",
    particle:"#60a5fa",
    shadow:  "0 0 22px rgba(96,165,250,0.28)",
    border:  "rgba(96,165,250,0.36)",
  },
  maestro: {
    key:     "maestro",
    name:    "Maestro",
    emoji:   "👑",
    min:     300,
    color:   "#c084fc",
    glow:    "rgba(192,132,252,0.45)",
    aura:    "rgba(192,132,252,0.09)",
    bar:     "linear-gradient(90deg, #6b21a8, #c084fc, #f0abfc)",
    particle:"#c084fc",
    shadow:  "0 0 26px rgba(192,132,252,0.32)",
    border:  "rgba(192,132,252,0.38)",
  },
  gran_maestro: {
    key:     "gran_maestro",
    name:    "Gran Maestro",
    emoji:   "🔮",
    min:     500,
    color:   "#e879f9",
    glow:    "rgba(232,121,249,0.45)",
    aura:    "rgba(232,121,249,0.09)",
    bar:     "linear-gradient(90deg, #86198f, #e879f9, #f5d0fe)",
    particle:"#e879f9",
    shadow:  "0 0 28px rgba(232,121,249,0.34)",
    border:  "rgba(232,121,249,0.4)",
  },
  leyenda: {
    key:     "leyenda",
    name:    "Leyenda",
    emoji:   "⚡",
    min:     800,
    color:   "#fbbf24",
    glow:    "rgba(251,191,36,0.45)",
    aura:    "rgba(251,191,36,0.09)",
    bar:     "linear-gradient(90deg, #92400e, #fbbf24, #fef08a)",
    particle:"#fbbf24",
    shadow:  "0 0 28px rgba(251,191,36,0.34)",
    border:  "rgba(251,191,36,0.4)",
  },
  elite: {
    key:     "elite",
    name:    "Élite",
    emoji:   "🌟",
    min:     1200,
    color:   "#f472b6",
    glow:    "rgba(244,114,182,0.48)",
    aura:    "rgba(244,114,182,0.10)",
    bar:     "linear-gradient(90deg, #9d174d, #f472b6, #fbcfe8)",
    particle:"#f472b6",
    shadow:  "0 0 30px rgba(244,114,182,0.36)",
    border:  "rgba(244,114,182,0.42)",
  },
}

const ORDER = ["bronce", "plata", "oro", "platino", "diamante", "maestro", "gran_maestro", "leyenda", "elite"]

/** Devuelve el objeto de tema para el XP dado */
export function getRankTheme(xp = 0) {
  let key = "bronce"
  for (const k of ORDER) {
    if (xp >= RANK_THEMES[k].min) key = k
  }
  return RANK_THEMES[key]
}

/** Devuelve solo el key del rango */
export function getRankKey(xp = 0) {
  let key = "bronce"
  for (const k of ORDER) {
    if (xp >= RANK_THEMES[k].min) key = k
  }
  return key
}
