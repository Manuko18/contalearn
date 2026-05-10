/**
 * ══════════════════════════════════════════════
 *  ContaLearn — Audio System
 *  Síntesis de sonidos UI premium con Web Audio API.
 *  Singleton: un único AudioContext reutilizable.
 *  Sin archivos externos. Puro synth matemático.
 * ══════════════════════════════════════════════
 */

let _ctx = null
let _vol = 0.38   // Volumen master (0–1)

/** Obtiene (o crea) el AudioContext singleton */
function getCtx() {
  if (typeof window === "undefined") return null
  try {
    if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (_ctx.state === "suspended") _ctx.resume()
    return _ctx
  } catch { return null }
}

export function setVolume(v) { _vol = Math.max(0, Math.min(1, v)) }
export function getVolume() { return _vol }

/**
 * Oscilador con envolvente (AD simplificado).
 * @param {AudioContext} ctx
 * @param {object} opts
 */
function osc(ctx, {
  freq,
  type    = "sine",
  vol     = 0.3,
  start   = 0,       // segundos desde ahora
  dur     = 0.25,    // duración en segundos
  freqEnd = null,    // portamento destino (opcional)
}) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.connect(g)
  g.connect(ctx.destination)

  o.type = type
  o.frequency.setValueAtTime(freq, ctx.currentTime + start)
  if (freqEnd !== null) {
    o.frequency.linearRampToValueAtTime(freqEnd, ctx.currentTime + start + dur)
  }

  const v = Math.max(0.0001, vol * _vol)
  g.gain.setValueAtTime(0, ctx.currentTime + start)
  g.gain.linearRampToValueAtTime(v, ctx.currentTime + start + 0.007)
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur)

  o.start(ctx.currentTime + start)
  o.stop(ctx.currentTime + start + dur + 0.02)
}

/** Wrapper seguro: el error de audio nunca bloquea la UI */
function play(fn) {
  const ctx = getCtx()
  if (!ctx) return
  try { fn(ctx) } catch {}
}

// Escala musical Do–Re–Mi–Fa–Sol–La–Si–Do
const ESCALA = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50]

/** ══ Catálogo de sonidos de ContaLearn ══ */
export const sound = {

  /** Click suave de UI (botones, tabs) */
  click() {
    play(ctx => {
      osc(ctx, { freq: 1600, type: "sine", vol: 0.06, dur: 0.05 })
    })
  },

  /**
   * Respuesta correcta.
   * La nota asciende con el combo (Do→Re→Mi→...)
   * Desde combo 3 agrega armónico.
   */
  correct(combo = 1) {
    play(ctx => {
      const idx  = Math.min(combo - 1, ESCALA.length - 1)
      const freq = ESCALA[idx]
      osc(ctx, { freq, type: "sine", vol: 0.32, dur: 0.48 })
      if (combo >= 3) {
        osc(ctx, { freq: freq * 1.5, type: "triangle", vol: 0.13, start: 0.05, dur: 0.52 })
      }
      if (combo >= 6) {
        osc(ctx, { freq: freq * 2,   type: "sine",     vol: 0.07, start: 0.10, dur: 0.55 })
      }
    })
  },

  /** Respuesta incorrecta / tiempo agotado */
  incorrect() {
    play(ctx => {
      osc(ctx, { freq: 300, freqEnd: 180, type: "sine", vol: 0.26, dur: 0.38 })
    })
  },

  /**
   * Pulso de combo (hit visual).
   * Se vuelve más gordo con n.
   */
  combo(n = 3) {
    play(ctx => {
      const base = 380 + n * 52
      osc(ctx, { freq: base,        type: "sine",     vol: 0.27, dur: 0.22 })
      osc(ctx, { freq: base * 1.25, type: "triangle", vol: 0.13, start: 0.08, dur: 0.32 })
      osc(ctx, { freq: base * 1.5,  type: "sine",     vol: 0.09, start: 0.16, dur: 0.42 })
    })
  },

  /** Nuevo rango — arpeggio épico + acorde cálido */
  rankUp() {
    play(ctx => {
      const notes = [523, 659, 784, 988, 1047]
      notes.forEach((freq, i) => {
        osc(ctx, { freq, type: "sine", vol: 0.24, start: i * 0.1, dur: 0.48 })
      })
      // Acorde sostenido final (como un synth pad)
      osc(ctx, { freq: 523, type: "triangle", vol: 0.14, start: 0.52, dur: 1.1 })
      osc(ctx, { freq: 659, type: "triangle", vol: 0.11, start: 0.52, dur: 1.1 })
      osc(ctx, { freq: 784, type: "triangle", vol: 0.09, start: 0.52, dur: 1.1 })
    })
  },

  /** Misión completada — 3 notas limpias */
  missionComplete() {
    play(ctx => {
      [784, 988, 1175].forEach((freq, i) => {
        osc(ctx, { freq, type: "sine", vol: 0.22, start: i * 0.12, dur: 0.46 })
      })
    })
  },

  /** Nivel completado — fanfarria de 5 notas + acorde */
  levelComplete() {
    play(ctx => {
      [523, 659, 784, 988, 1047].forEach((freq, i) => {
        osc(ctx, { freq, type: "sine", vol: 0.23, start: i * 0.09, dur: 0.5 })
      })
      osc(ctx, { freq: 523, type: "triangle", vol: 0.12, start: 0.54, dur: 1.2 })
      osc(ctx, { freq: 784, type: "triangle", vol: 0.10, start: 0.54, dur: 1.2 })
    })
  },

  /** Vida recuperada — tono ascendente curativo */
  lifeRecover() {
    play(ctx => {
      osc(ctx, { freq: 440, freqEnd: 660, type: "sine", vol: 0.18, dur: 0.52 })
      osc(ctx, { freq: 660, type: "sine", vol: 0.13, start: 0.44, dur: 0.42 })
    })
  },

  /** Bienvenida al login diario */
  dailyLogin() {
    play(ctx => {
      [523, 659, 784].forEach((freq, i) => {
        osc(ctx, { freq, type: "sine", vol: 0.18, start: i * 0.14, dur: 0.52 })
      })
    })
  },

  /** Desbloquear sub-nivel */
  unlock() {
    play(ctx => {
      osc(ctx, { freq: 440, freqEnd: 880, type: "sine",     vol: 0.2,  dur: 0.34 })
      osc(ctx, { freq: 880,               type: "triangle", vol: 0.12, start: 0.30, dur: 0.42 })
    })
  },
}
