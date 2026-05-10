/**
 * ══════════════════════════════════════════════
 *  ContaLearn — Motion System
 *  Duraciones, easings y helpers centralizados.
 *  Úsalo en TODOS los componentes para lograr
 *  consistencia visual AAA en toda la app.
 * ══════════════════════════════════════════════
 */

/** Duraciones en milisegundos */
export const DUR = {
  instant:   80,
  fast:     150,
  normal:   280,
  slow:     420,
  cinematic: 750,
}

/**
 * Curvas de aceleración (cubic-bezier).
 * Elige según el tipo de movimiento:
 *  - spring → entradas con rebote natural
 *  - smooth → multipropósito
 *  - snappy → combos, feedback inmediato
 *  - gentle → fondos, transiciones suaves
 *  - apple  → estilo Apple, elegante
 */
export const EASE = {
  spring:  "cubic-bezier(.16,1,.3,1)",
  smooth:  "cubic-bezier(.4,0,.2,1)",
  snappy:  "cubic-bezier(.36,.07,.19,.97)",
  gentle:  "ease-in-out",
  enter:   "cubic-bezier(0,0,.2,1)",
  exit:    "cubic-bezier(.4,0,1,1)",
  apple:   "cubic-bezier(.25,.46,.45,.94)",
}

/**
 * Genera un string de CSS `transition`.
 * @example tr("opacity")               → "opacity 280ms cubic-bezier(.4,0,.2,1)"
 * @example tr("transform", DUR.fast)   → "transform 150ms ..."
 */
export function tr(prop, dur = DUR.normal, ease = EASE.smooth) {
  return `${prop} ${dur}ms ${ease}`
}

/**
 * Genera múltiples transitions separadas por coma.
 * @example trs(["opacity"], ["transform", DUR.fast, EASE.spring])
 */
export function trs(...props) {
  return props.map(([p, d, e]) => tr(p, d ?? DUR.normal, e ?? EASE.smooth)).join(", ")
}

/** Delays de stagger para listas animadas */
export const STAGGER = {
  xs:  40,
  sm:  70,
  md: 100,
  lg: 150,
}

/** Timings de glow y pulso (en ms) */
export const GLOW_TIMING = {
  pulse:   3500,
  breathe: 2800,
  aura:    3200,
  hover:    200,
  click:     80,
}
