/**
 * ══════════════════════════════════════════════
 *  ContaLearn — Achievement System
 *  Logros con rareza, condiciones y storage en localStorage.
 *  NO requiere tabla extra en Supabase.
 * ══════════════════════════════════════════════
 */

/** Rareza visual */
export const RARITY = {
  common:    { label: "Común",     color: "#94a3b8", glow: "rgba(148,163,184,0.3)" },
  uncommon:  { label: "Poco común",color: "#58cc02", glow: "rgba(88,204,2,0.35)"   },
  rare:      { label: "Raro",      color: "#1cb0f6", glow: "rgba(28,176,246,0.4)"  },
  epic:      { label: "Épico",     color: "#c084fc", glow: "rgba(192,132,252,0.45)"},
  legendary: { label: "Legendario",color: "#ffd700", glow: "rgba(255,215,0,0.55)"  },
}

/** Catálogo de logros */
export const ACHIEVEMENTS = [
  // ── Progreso ──
  {
    id:     "first_xp",
    name:   "Primer Paso",
    desc:   "Gana tus primeros 10 XP",
    icon:   "🎓",
    rarity: "common",
    check:  d => d.xp >= 10,
  },
  {
    id:     "xp_100",
    name:   "Centenario",
    desc:   "Alcanza 100 XP",
    icon:   "💯",
    rarity: "uncommon",
    check:  d => d.xp >= 100,
  },
  {
    id:     "xp_200",
    name:   "Experto Contable",
    desc:   "Alcanza 200 XP",
    icon:   "🧠",
    rarity: "rare",
    check:  d => d.xp >= 200,
  },
  {
    id:     "xp_300",
    name:   "Maestro Contable",
    desc:   "Alcanza el rango Maestro",
    icon:   "👑",
    rarity: "legendary",
    check:  d => d.xp >= 300,
  },

  // ── Combos ──
  {
    id:     "combo_3",
    name:   "En Racha",
    desc:   "3 respuestas correctas seguidas",
    icon:   "🔥",
    rarity: "common",
    check:  d => d.maxCombo >= 3,
  },
  {
    id:     "combo_5",
    name:   "Combo Maestro",
    desc:   "5 correctas sin fallar",
    icon:   "⚡",
    rarity: "uncommon",
    check:  d => d.maxCombo >= 5,
  },
  {
    id:     "combo_8",
    name:   "Imparable",
    desc:   "8 correctas seguidas",
    icon:   "💥",
    rarity: "rare",
    check:  d => d.maxCombo >= 8,
  },

  // ── Rachas diarias ──
  {
    id:     "racha_3",
    name:   "Constante",
    desc:   "3 días de racha",
    icon:   "📅",
    rarity: "common",
    check:  d => d.racha >= 3,
  },
  {
    id:     "racha_7",
    name:   "Racha de Fuego",
    desc:   "7 días consecutivos",
    icon:   "🔥",
    rarity: "rare",
    check:  d => d.racha >= 7,
  },
  {
    id:     "racha_30",
    name:   "Leyenda Viviente",
    desc:   "30 días de racha",
    icon:   "🏅",
    rarity: "epic",
    check:  d => d.racha >= 30,
  },

  // ── Sesiones ──
  {
    id:     "perfect_run",
    name:   "Perfeccionista",
    desc:   "100% de precisión en una sesión",
    icon:   "⭐",
    rarity: "uncommon",
    check:  d => d.perfectSessions >= 1,
  },
  {
    id:     "speed_demon",
    name:   "Velocista",
    desc:   "Responde sin perder ninguna vida",
    icon:   "⚡",
    rarity: "rare",
    check:  d => d.cleanSessions >= 1,
  },
]

const STORAGE_KEY = "cl_achievements_v2"

/** Devuelve array de IDs desbloqueados */
export function getUnlocked() {
  if (typeof localStorage === "undefined") return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") } catch { return [] }
}

/**
 * Chequea nuevos logros y los guarda.
 * @param {object} data - { xp, racha, maxCombo, perfectSessions, cleanSessions }
 * @returns {Achievement[]} - logros recién desbloqueados
 */
export function checkNewAchievements(data) {
  if (typeof localStorage === "undefined") return []
  const unlocked = getUnlocked()
  const newly = []

  for (const ach of ACHIEVEMENTS) {
    if (!unlocked.includes(ach.id) && ach.check(data)) {
      unlocked.push(ach.id)
      newly.push({ ...ach, rarityInfo: RARITY[ach.rarity] })
    }
  }

  if (newly.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked))
  return newly
}

/** Retorna todos los logros enriquecidos con estado desbloqueado */
export function getAllAchievements() {
  const unlocked = getUnlocked()
  return ACHIEVEMENTS.map(a => ({
    ...a,
    rarityInfo: RARITY[a.rarity],
    unlocked:   unlocked.includes(a.id),
  }))
}
