/**
 * ContaLearn — Ambient Sound System v4 "Lo-fi Gaming"
 * Arpeggio pentatónico lento estilo indie/RPG. Bajo suave de fondo.
 * Loop infinito con scheduler de Web Audio API (sin drift).
 */

let _ctx        = null
let _active     = false
let _schedulerId = null
let _nextNoteTime = 0
let _noteIndex   = 0
let _bassNodes   = []

// Pentatónico menor de La: A2 C3 D3 E3 G3 A3 G3 E3
const PATTERN = [110, 130.8, 146.8, 164.8, 196, 220, 196, 164.8]
const NOTE_INTERVAL = 0.52   // segundos entre notas (≈115 BPM feel, lento)
const LOOK_AHEAD    = 0.1    // segundos de anticipación del scheduler
const SCHEDULE_MS   = 60     // ms entre llamadas al scheduler

function getCtx() {
  if (typeof window === "undefined") return null
  try {
    if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (_ctx.state === "suspended") _ctx.resume()
    return _ctx
  } catch { return null }
}

/** Toca una nota del arpeggio en el tiempo indicado */
function scheduleNote(ctx, freq, when, masterVol) {
  const osc  = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.type = "sine"
  osc.frequency.setValueAtTime(freq, when)
  // Octava alta muy suave para brillo
  const osc2  = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.connect(gain2)
  gain2.connect(ctx.destination)
  osc2.type = "triangle"
  osc2.frequency.setValueAtTime(freq * 2, when)

  const vol  = masterVol
  const vol2 = masterVol * 0.18

  // Envolvente suave: ataque lento, caída larga
  gain.gain.setValueAtTime(0, when)
  gain.gain.linearRampToValueAtTime(vol, when + 0.12)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + NOTE_INTERVAL * 1.6)

  gain2.gain.setValueAtTime(0, when)
  gain2.gain.linearRampToValueAtTime(vol2, when + 0.15)
  gain2.gain.exponentialRampToValueAtTime(0.0001, when + NOTE_INTERVAL * 1.4)

  osc.start(when)
  osc.stop(when + NOTE_INTERVAL * 2)
  osc2.start(when)
  osc2.stop(when + NOTE_INTERVAL * 2)
}

/** Scheduler: programa notas con anticipación para evitar glitches */
function scheduler(ctx, masterVol) {
  while (_nextNoteTime < ctx.currentTime + LOOK_AHEAD) {
    const freq = PATTERN[_noteIndex % PATTERN.length]
    scheduleNote(ctx, freq, _nextNoteTime, masterVol)
    _nextNoteTime += NOTE_INTERVAL
    _noteIndex++
  }
  _schedulerId = setTimeout(() => scheduler(ctx, masterVol), SCHEDULE_MS)
}

/** Crea el bajo continuo de fondo */
function createBass(ctx, masterVol) {
  const osc  = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = "sine"
  osc.frequency.setValueAtTime(55, ctx.currentTime)   // A1
  gain.gain.setValueAtTime(0, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(masterVol * 0.7, ctx.currentTime + 4)
  osc.start()
  return { osc, gain }
}

export function startAmbient() {
  if (_active) return
  const ctx = getCtx()
  if (!ctx) return
  _active = true

  const masterVol = 0.028

  // Bajo de fondo
  _bassNodes = [createBass(ctx, masterVol)]

  // Arpeggio — empieza con pequeño delay para que entre el bajo primero
  _nextNoteTime = ctx.currentTime + 1.5
  _noteIndex    = 0
  scheduler(ctx, masterVol * 0.9)
}

export function stopAmbient() {
  if (!_active) return
  _active = false

  clearTimeout(_schedulerId)
  _schedulerId = null

  if (_ctx) {
    _bassNodes.forEach(({ gain, osc }) => {
      try {
        gain.gain.linearRampToValueAtTime(0, _ctx.currentTime + 1.5)
        osc.stop(_ctx.currentTime + 1.6)
      } catch {}
    })
  }
  _bassNodes = []
}

export function isAmbientActive() { return _active }
export { startAmbient as start, stopAmbient as stop }
