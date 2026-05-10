/**
 * getFrase(contexto)
 *
 * Devuelve la frase más relevante para el búho según el estado del usuario.
 * Se evalúa por prioridad: lo más urgente primero.
 *
 * @param {Object} ctx
 * @param {number} ctx.diasSinEntrar   - Días desde la última lección completada
 * @param {number} ctx.racha           - Días de racha actual
 * @param {number} ctx.vidas           - Vidas disponibles (0-5)
 * @param {number} ctx.combo           - Respuestas correctas seguidas (solo en juego)
 * @param {boolean} ctx.terminoNivel   - Acaba de completar un nivel
 * @param {boolean} ctx.falloVarias    - Falló 2+ veces seguidas en juego
 * @param {number}  ctx.xp             - XP total acumulado
 */
export function getFrase(ctx = {}) {
  const {
    diasSinEntrar = 0,
    racha = 0,
    vidas = 5,
    combo = 0,
    terminoNivel = false,
    falloVarias = false,
    xp = 0,
  } = ctx

  // ── Prioridad 1: vidas críticas (más urgente) ──
  if (vidas === 0) {
    return "😢 Sin vidas por ahora. Descansa y vuelve en 30 min, ¡yo te espero aquí!"
  }
  if (vidas === 1) {
    return "⚠️ ¡Solo te queda 1 vida! Piénsalo bien antes de responder."
  }

  // ── Prioridad 2: ausencia larga ──
  if (diasSinEntrar >= 7) {
    return "😱 ¡Una semana sin contabilidad! Tus conocimientos te están esperando..."
  }
  if (diasSinEntrar >= 3) {
    return "😢 ¡Te extrañé! Tus neuronas contables se están oxidando. ¡Volvamos!"
  }
  if (diasSinEntrar === 2) {
    return "👀 Dos días sin entrar... tu racha está en peligro. ¡Entra ya!"
  }

  // ── Prioridad 3: combo en juego (se pasa desde lecciones/page.jsx) ──
  if (combo >= 5) {
    return `🔥 ¡${combo} correctas seguidas! ¡Eres una máquina contable!`
  }
  if (combo >= 3) {
    return `🎯 ¡Combo x${combo}! Sigue así, vas perfectísimo.`
  }

  // ── Prioridad 4: errores seguidos en juego ──
  if (falloVarias) {
    return "😅 Tranquilo, Luca Pacioli tampoco lo entendió a la primera. ¡Tú puedes!"
  }

  // ── Prioridad 5: celebración de nivel ──
  if (terminoNivel) {
    return "🎉 ¡Nivel completado! Pacioli estaría muy orgulloso de ti. 📚"
  }

  // ── Prioridad 6: racha activa ──
  if (racha >= 7) {
    return `🔥 ¡${racha} días seguidos! Eres absolutamente imparable.`
  }
  if (racha >= 3) {
    return `💪 ¡${racha} días de racha! No la pierdas hoy.`
  }
  if (racha === 1) {
    return "✅ ¡Buen comienzo! Vuelve mañana para construir tu racha."
  }

  // ── Prioridad 7: hitos de XP ──
  if (xp >= 300) {
    return "👑 ¡Maestro contable! Ya no sé qué más enseñarte... ¿o sí? 😏"
  }
  if (xp >= 240) {
    return "💠 ¡Diamante! Estás entre los mejores contadores de ContaLearn."
  }
  if (xp >= 120) {
    return "🥇 ¡Rango Oro! La partida doble ya no te asusta para nada."
  }

  // ── Prioridad 8: frases motivacionales aleatorias (primer acceso o sin contexto) ──
  const generales = [
    "¡Hola! ¿Listo para hacer que los débitos y créditos cuadren hoy? 💪",
    "La contabilidad es el lenguaje de los negocios. ¡Apréndelo conmigo! 📊",
    "Cada lección te acerca más a ser un contador de élite. ¡Vamos! 🚀",
    "¿Sabías que Luca Pacioli inventó la partida doble en 1494? ¡Tú la vas a dominar! 🦉",
    "El balance siempre cuadra... ¡igual que tu dedicación! ⚖️",
    "Activo = Pasivo + Patrimonio. Fácil, ¿verdad? Hoy lo vas a demostrar. 🎯",
    "Un contador sin práctica es como un balance sin cuadrar. ¡Practiquemos! 📝",
  ]
  return generales[Math.floor(Math.random() * generales.length)]
}

/**
 * getDiasDesdeUltimaLeccion(fecha)
 *
 * Calcula cuántos días han pasado desde la última lección.
 * @param {string|null} fechaISO - valor de ultima_leccion_fecha del usuario
 * @returns {number} días transcurridos (0 = hoy, 1 = ayer, etc.)
 */
export function getDiasDesdeUltimaLeccion(fechaISO) {
  if (!fechaISO) return 999 // nunca ha jugado
  const hoy = new Date()
  const ultima = new Date(fechaISO)
  // Comparar solo fechas (sin hora)
  hoy.setHours(0, 0, 0, 0)
  ultima.setHours(0, 0, 0, 0)
  return Math.floor((hoy - ultima) / (1000 * 60 * 60 * 24))
}
