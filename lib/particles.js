/**
 * ══════════════════════════════════════════════
 *  ContaLearn — Particle System
 *  Presets centralizados para todos los efectos.
 *  Úsalo con <Particles preset="combo" /> en lugar
 *  de hardcodear partículas en cada componente.
 * ══════════════════════════════════════════════
 */

/** Formas disponibles */
export const SHAPES = {
  circle: "50%",
  square: "2px",
  diamond: "2px",   // square rotated 45°
}

/** Presets de partículas por evento */
export const PRESETS = {

  /** Acierto con combo */
  combo: {
    count:   14,
    colors:  ["#58cc02","#ffc800","#ff4b4b","#1cb0f6","#c084fc","#f59e0b"],
    sizeMin:  6,
    sizeMax: 16,
    speed:   130,
    dur:    0.75,
    shape:  "circle",
    spread:  1.0,   // multiplicador de dispersión angular
  },

  /** Ganar XP (pequeño) */
  xpGain: {
    count:   8,
    colors:  ["#1cb0f6","#58cc02","#ffffff","#7fff3a"],
    sizeMin:  4,
    sizeMax: 10,
    speed:    90,
    dur:    0.60,
    shape:  "circle",
    spread:  0.8,
  },

  /** Subir de rango — épico */
  rankUp: {
    count:   26,
    colors:  ["#ffd700","#fff176","#ffa500","#ffffff","#f59e0b"],
    sizeMin:  6,
    sizeMax: 20,
    speed:   180,
    dur:    1.05,
    shape:  "circle",
    spread:  1.2,
  },

  /** Nivel completado */
  levelComplete: {
    count:   20,
    colors:  ["#58cc02","#ffd700","#1cb0f6","#c084fc","#7fff3a"],
    sizeMin:  5,
    sizeMax: 18,
    speed:   160,
    dur:    0.95,
    shape:  "circle",
    spread:  1.1,
  },

  /** Error / incorrecto */
  error: {
    count:   8,
    colors:  ["#ff4b4b","#ff8888","#ff0000"],
    sizeMin:  4,
    sizeMax: 10,
    speed:    70,
    dur:    0.50,
    shape:  "square",
    spread:  0.6,
  },

  /** Logro desbloqueado */
  achievement: {
    count:   18,
    colors:  ["#ffd700","#c084fc","#1cb0f6","#ffffff","#58cc02"],
    sizeMin:  5,
    sizeMax: 14,
    speed:   140,
    dur:    0.85,
    shape:  "circle",
    spread:  1.0,
  },

  /** Confetti premium */
  confetti: {
    count:   32,
    colors:  ["#58cc02","#ffc800","#ff4b4b","#1cb0f6","#c084fc","#f59e0b","#ffffff"],
    sizeMin:  4,
    sizeMax: 14,
    speed:   200,
    dur:    1.20,
    shape:  "square",
    spread:  1.4,
  },

  /** Misión completada */
  mission: {
    count:   16,
    colors:  ["#1cb0f6","#58cc02","#ffd700"],
    sizeMin:  5,
    sizeMax: 13,
    speed:   120,
    dur:    0.80,
    shape:  "circle",
    spread:  1.0,
  },
}

/**
 * Genera un array de items de partículas con valores aleatorios.
 * Se llama en el cliente (no en SSR) para evitar hydration mismatch.
 * @param {string} presetKey - Key del preset
 * @param {number} [countOverride] - Sobrescribir cantidad
 * @returns {Array} items
 */
export function generateParticles(presetKey, countOverride) {
  const p = PRESETS[presetKey] ?? PRESETS.combo
  const count = countOverride ?? p.count

  return Array.from({ length: count }, (_, i) => {
    const baseAng = (360 / count) * i * p.spread
    const jitter  = (Math.random() - 0.5) * 22
    return {
      id:    i,
      ang:   baseAng + jitter,
      size:  p.sizeMin + Math.random() * (p.sizeMax - p.sizeMin),
      color: p.colors[i % p.colors.length],
      speed: p.speed * (0.65 + Math.random() * 0.7),
      dur:   p.dur   * (0.75 + Math.random() * 0.5),
      shape: p.shape,
    }
  })
}
