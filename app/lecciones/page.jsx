"use client"

import { useEffect, useMemo, useState, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"
import Mascota from "../../components/Mascota"
import { getFrase } from "../../lib/frases"
import LoadingConti from "../../components/LoadingConti"
import EpicMoment from "../../components/EpicMoment"
import AchievementToast from "../../components/AchievementToast"
import { sound } from "../../lib/audio"
import { checkNewAchievements } from "../../lib/achievements"
import { getRankKey, RANK_THEMES } from "../../lib/rankTheme"
import Particles from "../../components/Particles"

const TIEMPO_POR_PREGUNTA = 30

function mezclar(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

function mostrarRespuesta(val) {
  if (val === "true")  return "Verdadero"
  if (val === "false") return "Falso"
  return val
}

function Heart({ filled }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" style={{ flexShrink: 0 }}>
      <path
        d="M12 21s-7.5-4.5-9.5-9.5C1 7 4 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 3 0 6 3 4.5 7.5C19.5 16.5 12 21 12 21z"
        fill={filled ? "#ef4444" : "transparent"}
        stroke={filled ? "#ef4444" : "rgba(255,255,255,0.22)"}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function getOptionStyle(val, feedbackState, respuesta, correcta) {
  const isSelected = respuesta === val
  const isCorrect  = val === correcta
  if (feedbackState === "idle") {
    if (isSelected) return {
      bg: "rgba(6,182,212,0.1)", border: "#06b6d4", borderStyle: "solid",
      shadow: "0 0 0 1px rgba(6,182,212,0.3), 0 0 18px rgba(6,182,212,0.18)",
      letterBg: "rgba(6,182,212,0.25)", letterColor: "#67e8f9", opacity: 1,
    }
    return {
      bg: "#14213d", border: "rgba(255,255,255,0.14)", borderStyle: "solid",
      shadow: "0 4px 0 rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)",
      letterBg: "rgba(255,255,255,0.06)", letterColor: "#a4b1c6", opacity: 1,
    }
  }
  if (isSelected && isCorrect) return {
    bg: "linear-gradient(135deg, rgba(34,197,94,0.22), rgba(34,197,94,0.1))",
    border: "#22c55e", borderStyle: "solid",
    shadow: "0 0 0 1px rgba(34,197,94,0.3), 0 0 30px rgba(34,197,94,0.45)",
    letterBg: "#22c55e", letterColor: "#042713", opacity: 1,
    animation: "qs-correct-pulse 1.2s ease-out",
  }
  if (isSelected && !isCorrect) return {
    bg: "linear-gradient(135deg, rgba(239,68,68,0.22), rgba(239,68,68,0.1))",
    border: "#ef4444", borderStyle: "solid",
    shadow: "0 0 0 1px rgba(239,68,68,0.3), 0 0 22px rgba(239,68,68,0.4)",
    letterBg: "#ef4444", letterColor: "#2a0707", opacity: 1,
  }
  if (!isSelected && isCorrect) return {
    bg: "rgba(34,197,94,0.07)", border: "rgba(34,197,94,0.55)", borderStyle: "dashed",
    shadow: "none", letterBg: "rgba(34,197,94,0.18)", letterColor: "#4ade80",
    color: "#4ade80", opacity: 1,
  }
  return {
    bg: "#14213d", border: "rgba(255,255,255,0.08)", borderStyle: "solid",
    shadow: "0 2px 0 rgba(0,0,0,0.2)", letterBg: "rgba(255,255,255,0.04)",
    letterColor: "#6b7a93", opacity: 0.35,
  }
}

/** Despacha un evento al fondo dinámico y otros listeners */
function emitContiEvent(type) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("conti-event", { detail: { type } }))
  }
}

function LeccionInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nivelId = searchParams.get("nivel")
  const dificultadParam = 0

  const [user, setUser] = useState(null)
  const [nivel, setNivel] = useState(null)
  const [lecciones, setLecciones] = useState([])
  const [indice, setIndice] = useState(0)
  const [slideTeoria, setSlideTeoria] = useState(0)
  const [respuesta, setRespuesta] = useState("")
  const [estado, setEstado] = useState(null)
  const [xp, setXp] = useState(0)
  const [xpGanado, setXpGanado] = useState(0)
  const [vidas, setVidas] = useState(5)
  const [loading, setLoading] = useState(true)
  const [fase, setFase] = useState("teoria")
  const [hablandoVoz, setHablandoVoz] = useState(false)
  const [palabraActual, setPalabraActual] = useState(-1)
  const [tiempo, setTiempo] = useState(TIEMPO_POR_PREGUNTA)
  const [tiempos, setTiempos] = useState([])
  const [animacion, setAnimacion] = useState("")
  const [resultados, setResultados] = useState([])
  // transicionDif: siempre null (feature futura; el bloque JSX nunca se muestra)
  const transicionDif = null
  const [combo, setCombo] = useState(0)
  const [fallosSegidos, setFallosSegidos] = useState(0)
  const [mostrarCombo, setMostrarCombo] = useState(false)
  const [mostrarParticulas, setMostrarParticulas] = useState(false)
  // Refs para rastrear datos de la sesión (para misiones y logros)
  const maxComboRef     = useRef(0)
  const vidasInicialesRef = useRef(5)
  const preguntasRespRef  = useRef(0)   // preguntas respondidas (correcto + incorrecto)
  const xpSesionRef     = useRef(0)     // XP real ganado esta sesión (solo primeras veces)
  const [cargandoJuego, setCargandoJuego] = useState(false)
  const [errorJuego, setErrorJuego] = useState(null)
  const [dificultad, setDificultad] = useState("normal")
  const [botonListo, setBotonListo] = useState(false)
  const [botonFill, setBotonFill] = useState(0)
  const [showFloatXP, setShowFloatXP] = useState(false)
  const [epicEvent, setEpicEvent]     = useState(null)
  const [rankUpKey, setRankUpKey]     = useState(0)
  const [achQueue, setAchQueue]       = useState([])
  const [explicacionesIA, setExplicacionesIA] = useState([])
  const [cargandoIA, setCargandoIA] = useState(false)
  const [curAch, setCurAch]           = useState(null)
  const timerRef = useRef(null)
  const audioRef = useRef(null)
  const vozActivaRef = useRef(false)
  const dificultadSesionRef = useRef("facil")
  const vozIdRef = useRef(0)


  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      if (!nivelId) { router.push("/niveles"); return }
      setUser(user)

      const [{ data: nivelData }, { data: perfil }, { data: progresoNivel }] = await Promise.all([
        supabase.from("niveles").select("*").eq("id", nivelId).single(),
        supabase.from("users").select("xp_total, vidas").eq("id", user.id).maybeSingle(),
        supabase.from("progreso_nivel").select("dificultad").eq("user_id", user.id).eq("nivel_id", nivelId),
      ])
      const difs = new Set((progresoNivel || []).map(p => p.dificultad))
      const difInicial = difs.has("normal") ? "dificil" : difs.has("facil") ? "normal" : "facil"
      setDificultad(difInicial)

      if (!perfil) {
        await supabase.from("users").insert([{ id: user.id, email: user.email, xp_total: 0, racha_actual: 0, vidas: 5, ultima_vida_recargada: new Date().toISOString() }])
        setXp(0); setVidas(5)
        vidasInicialesRef.current = 5
      } else {
        setXp(perfil.xp_total ?? 0)
        setVidas(perfil.vidas ?? 5)
        vidasInicialesRef.current = perfil.vidas ?? 5
      }

      setNivel(nivelData)
      setLoading(false)
    }
    cargar()
  }, [router, nivelId])

  // Opciones mezcladas derivadas de la lección actual (useMemo evita estado+efecto extra)
  const opcionesMezcladas = useMemo(() => {
    const c = lecciones[indice]?.contenido_json
    return c?.opciones ? mezclar(c.opciones) : []
  }, [indice, lecciones])

  // Popup de combo: mostrar cuando sube a >= 2 y ocultar tras 1.4s
  useEffect(() => {
    if (combo < 2) return
    // setTimeout(0) para no llamar setState síncronamente dentro del efecto
    const t0 = setTimeout(() => { setMostrarCombo(true); setMostrarParticulas(true) }, 0)
    const t1 = setTimeout(() => setMostrarCombo(false),     1400)
    const t2 = setTimeout(() => setMostrarParticulas(false), 800)
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2) }
  }, [combo])

  // Parada agresiva (pause+cancel) al desmontar — navegación a otra página
  useEffect(() => {
    return () => pararVoz()
  }, [])

  // Parada agresiva al salir de teoría o quedarse sin vidas
  useEffect(() => {
    if (fase !== "teoria") pararVoz()
  }, [fase])
  useEffect(() => {
    if (vidas <= 0) pararVoz()
  }, [vidas])

  // Hablar al cambiar slide — cleanup usa solo cancel() para no bloquear el siguiente
  useEffect(() => {
    if (fase !== "teoria" || vidas <= 0) return
    const slides = nivel?.teoria_json || []
    const slide = slides[slideTeoria]
    if (!slide) return

    const ejecutarVoz = () => hablar(`${slide.titulo}. ${slide.contenido}`)
    if (window.speechSynthesis.getVoices().length > 0) {
      ejecutarVoz()
    } else {
      window.speechSynthesis.onvoiceschanged = () => { ejecutarVoz(); window.speechSynthesis.onvoiceschanged = null }
    }
    // Solo cancel aquí: el siguiente slide necesita poder hablar sin Chrome bloqueado
    return () => detenerVozGlobal()
  }, [slideTeoria, nivel])

  // Relleno progresivo del botón Siguiente (previene clicks ultra-rápidos)
  useEffect(() => {
    if (fase !== "teoria") return
    setBotonListo(false)
    setBotonFill(0)
    const t1 = setTimeout(() => setBotonFill(100), 50)       // inicia la transición CSS
    const t2 = setTimeout(() => setBotonListo(true), 1300)   // habilita el click
    return () => { clearTimeout(t1); clearTimeout(t2); setBotonListo(false); setBotonFill(0) }
  }, [slideTeoria, fase])

  useEffect(() => {
    if (fase !== "juego" || estado !== null) return
    // Diferir setTiempo para no llamar setState síncronamente dentro del efecto
    const tReset = setTimeout(() => setTiempo(TIEMPO_POR_PREGUNTA), 0)
    const inicio = Date.now()
    timerRef.current = setInterval(() => {
      setTiempo((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          const usado = Math.round((Date.now() - inicio) / 1000)
          setTiempos(prev => [...prev, usado])
          manejarTiempoAgotado()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { clearTimeout(tReset); clearInterval(timerRef.current) }
    // manejarTiempoAgotado es una function declaration (hoisted); aunque cambia en cada
    // render, el timer solo necesita reiniciarse por indice/fase/estado, no por ella.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, fase, estado])

  // Solo cancel — para transiciones entre slides (permite que el siguiente hable)
  function detenerVozGlobal() {
    if (!window.speechSynthesis) return
    vozActivaRef.current = false
    window.speechSynthesis.onvoiceschanged = null
    window.speechSynthesis.cancel()
  }

  // Pause + cancel — para salir de teoría, desmontar o quedarse sin vidas
  function pararVoz() {
    if (!window.speechSynthesis) return
    vozActivaRef.current = false
    window.speechSynthesis.onvoiceschanged = null
    window.speechSynthesis.pause()
    window.speechSynthesis.cancel()
  }

  function hablar(texto) {
    if (!window.speechSynthesis) return
    vozActivaRef.current = true
    const miId = ++vozIdRef.current
    window.speechSynthesis.pause()
    window.speechSynthesis.cancel()
    setPalabraActual(-1)

    const u = new SpeechSynthesisUtterance(texto)
    u.lang = "es-ES"
    u.rate = 0.88
    u.pitch = 1.0
    u.volume = 1

    const voces = window.speechSynthesis.getVoices()
    const voz = voces.find(v => v.name.includes("Google") && v.lang.startsWith("es")) ||
                voces.find(v => v.name === "Microsoft Sabina - Spanish (Mexico)") ||
                voces.find(v => v.name.includes("Sabina")) ||
                voces.find(v => v.name.includes("Raul")) ||
                voces.find(v => v.lang.startsWith("es"))
    if (voz) u.voice = voz

    u.onboundary = (e) => {
      if (e.name === "word") {
        const palabraIdx = texto.substring(0, e.charIndex).split(" ").length - 1
        setPalabraActual(palabraIdx)
      }
    }
    u.onstart = () => {
      if (vozIdRef.current !== miId || !vozActivaRef.current) {
        window.speechSynthesis.cancel()
        return
      }
      setHablandoVoz(true)
    }
    u.onend = () => { setHablandoVoz(false); setPalabraActual(-1) }
    u.onerror = () => { setHablandoVoz(false); setPalabraActual(-1) }

    // Solo habla si sigue siendo la llamada más reciente; resume() deshace el pause() anterior
    setTimeout(() => {
      if (vozIdRef.current !== miId || !vozActivaRef.current) return
      window.speechSynthesis.resume()
      window.speechSynthesis.speak(u)
    }, 200)
  }

  function detenerVoz() {
    vozActivaRef.current = false
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = null
      window.speechSynthesis.cancel()
    }
    setHablandoVoz(false)
    setPalabraActual(-1)
  }

  // function declaration → hoisted; disponible en el timer useEffect declarado antes
  async function manejarTiempoAgotado() {
    clearInterval(timerRef.current)
    const leccion = lecciones[indice]
    setEstado("tiempo")
    sound.incorrect()
    emitContiEvent("error")
    setAnimacion("incorrecto")
    setTimeout(() => setAnimacion(""), 500)
    const nuevasVidas = Math.max(vidas - 1, 0)
    setVidas(nuevasVidas)
    await supabase.from("users").update({ vidas: nuevasVidas }).eq("id", user.id)
    setResultados(prev => [...prev, {
      pregunta: leccion.contenido_json.pregunta,
      correcta: false,
      tuRespuesta: "⏱️ Tiempo agotado",
      respuestaCorrecta: mostrarRespuesta(leccion.contenido_json.respuesta_correcta),
      tiempo: TIEMPO_POR_PREGUNTA,
    }])
  }

  const actualizarRacha = async () => {
    const hoy = new Date().toISOString().split("T")[0]
    const { data: p } = await supabase.from("users").select("racha_actual, ultima_leccion_fecha").eq("id", user.id).maybeSingle()
    if (!p || p.ultima_leccion_fecha === hoy) return
    const ayer = new Date(); ayer.setDate(ayer.getDate() - 1)
    const nuevaRacha = p.ultima_leccion_fecha === ayer.toISOString().split("T")[0] ? (p.racha_actual || 0) + 1 : 1
    await supabase.from("users").update({ racha_actual: nuevaRacha, ultima_leccion_fecha: hoy }).eq("id", user.id)
  }

  const cargarPreguntasIA = async () => {
    dificultadSesionRef.current = dificultad   // captura dificultad antes de que cambie
    setCargandoJuego(true)
    const TOTAL = 10
    const storageKey = `vistas_nivel_${nivelId}`
    const dif = dificultad
    let vistas = JSON.parse(localStorage.getItem(storageKey) || "[]")

    // Mezclar tipos aleatoriamente para que el orden varíe cada sesión
    const baseTypes = ["multiple_choice", "verdadero_falso", "completar_espacio",
                       "multiple_choice", "verdadero_falso", "completar_espacio",
                       "multiple_choice", "verdadero_falso", "multiple_choice", "completar_espacio"]
    const tiposSesion = [...baseTypes].sort(() => Math.random() - 0.5)

    // Fetch secuencial — acumula IDs y textos para evitar repetidos en esta sesión
    const pqs = []
    const textosEnSesion = []
    for (let i = 0; i < TOTAL; i++) {
      try {
        const res = await fetch("/api/generar-leccion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nivelId,
            teoriaJson: nivel?.teoria_json || [],
            preguntasVistasIds: vistas,
            preguntasEnSesion: textosEnSesion,
            dificultad: dif,
            angulo: i,
            tipo: tiposSesion[i],
          }),
        })
        const { pregunta } = await res.json()
        if (pregunta) {
          pqs.push({
            id: `ia_${pregunta.id ?? Math.random()}`,
            bancoId: pregunta.id ?? null,
            esIA: true,
            tipo_ejercicio: pregunta.tipo || "multiple_choice",
            contenido_json: {
              pregunta: pregunta.pregunta,
              opciones: pregunta.opciones || [],
              respuesta_correcta: pregunta.respuesta_correcta,
              explicacion_error: pregunta.explicacion,
            },
          })
          textosEnSesion.push(pregunta.pregunta)
          if (pregunta.id) vistas = [...vistas, pregunta.id]
        }
      } catch {
        // pregunta individual falló — continuar con las demás
      }
    }

    localStorage.setItem(storageKey, JSON.stringify(vistas))

    if (pqs.length === 0) {
      setErrorJuego("No se pudo conectar con la IA. Verifica tu conexión e intenta de nuevo.")
      setCargandoJuego(false)
      return
    }

    setLecciones(mezclar(pqs))
    setCargandoJuego(false)
    setFase("juego")
  }

  const verificar = async () => {
    if (!respuesta) return
    clearInterval(timerRef.current)
    const tiempoUsado = TIEMPO_POR_PREGUNTA - tiempo
    setTiempos(prev => [...prev, tiempoUsado])

    const leccion = lecciones[indice]
    const c = leccion.contenido_json
    let correcta = false

    if (leccion.tipo_ejercicio === "multiple_choice") correcta = respuesta === c.respuesta_correcta
    if (leccion.tipo_ejercicio === "verdadero_falso") correcta = String(respuesta) === String(c.respuesta_correcta)
    if (leccion.tipo_ejercicio === "completar_espacio") correcta = respuesta.trim().toLowerCase() === c.respuesta_correcta.trim().toLowerCase()

    setEstado(correcta ? "correcto" : "incorrecto")
    setAnimacion(correcta ? "correcto" : "incorrecto")
    setTimeout(() => setAnimacion(""), 500)

    if (correcta) {
      const nuevoCombo = combo + 1
      sound.correct(nuevoCombo)
      emitContiEvent("combo")
      setCombo(nuevoCombo)
      setFallosSegidos(0)
      preguntasRespRef.current += 1
      if (nuevoCombo > maxComboRef.current) maxComboRef.current = nuevoCombo
      // Combo máximo épico (≥ 6)
      if (nuevoCombo === 6) {
        setEpicEvent({ type: "comboMax", data: { title: `COMBO ×${nuevoCombo}` } })
      }
      await actualizarRacha()
      const nuevoXp = xp + 10
      const rangoAntes = getRankKey(xp)
      const rangoNuevo = getRankKey(nuevoXp)
      setXp(nuevoXp)
      setXpGanado(prev => prev + 10)
      xpSesionRef.current += 10
      setShowFloatXP(true)
      setTimeout(() => setShowFloatXP(false), 950)
      await supabase.from("users").update({ xp_total: nuevoXp }).eq("id", user.id)
      if (rangoNuevo !== rangoAntes) {
        sound.rankUp()
        setRankUpKey(k => k + 1)
        setEpicEvent({
          type: "rankUp",
          data: {
            title:    `${RANK_THEMES[rangoNuevo].emoji} ${RANK_THEMES[rangoNuevo].name}`,
            subtitle: "¡Nuevo rango desbloqueado!",
          },
        })
      }
    } else {
      sound.incorrect()
      emitContiEvent("error")
      setCombo(0)
      setFallosSegidos(f => f + 1)
      preguntasRespRef.current += 1
      const nuevasVidas = Math.max(vidas - 1, 0)
      setVidas(nuevasVidas)
      await supabase.from("users").update({ vidas: nuevasVidas, ultima_vida_recargada: new Date().toISOString() }).eq("id", user.id)
      await supabase.from("user_mistakes").insert([{
        user_id: user.id,
        nivel_id: nivelId,
        leccion_id: leccion.bancoId ?? null,
        pregunta: c.pregunta || c.enunciado || "",
        tu_respuesta: mostrarRespuesta(respuesta),
        respuesta_correcta: mostrarRespuesta(c.respuesta_correcta),
      }])
    }

    setResultados(prev => [...prev, {
      pregunta: c.pregunta,
      correcta,
      tuRespuesta: mostrarRespuesta(respuesta),
      respuestaCorrecta: mostrarRespuesta(c.respuesta_correcta),
      explicacion: c.explicacion_error || null,
      tiempo: tiempoUsado,
    }])
  }

  function getLunes() {
    const hoy = new Date()
    const dia = hoy.getDay()
    const diff = dia === 0 ? -6 : 1 - dia
    const lunes = new Date(hoy)
    lunes.setDate(hoy.getDate() + diff)
    return lunes.toISOString().split("T")[0]
  }

  // ── Actualizar misiones al terminar la sesión ──
  const actualizarMisiones = async (vidasFinales, nivelCompletado = false) => {
    if (!user) return
    const hoy = new Date().toISOString().split("T")[0]
    const { data: misiones } = await supabase
      .from("misiones_diarias")
      .select("*")
      .eq("user_id", user.id)
      .eq("fecha", hoy)
      .eq("completada", false)

    if (!misiones?.length) return

    const vidasPerdidas   = vidasInicialesRef.current - vidasFinales
    const xpGanadoSesion  = xpSesionRef.current  // solo XP de primeras veces correctas

    let totalBonus = 0  // acumular todos los bonus antes de actualizar BD

    for (const m of misiones) {
      let nuevo = m.progreso

      if (["responder_preguntas", "responder_preguntas_5"].includes(m.tipo))
        nuevo = Math.min(m.meta, nuevo + preguntasRespRef.current)

      if (["correctas_seguidas", "racha_combo_3", "racha_combo_5"].includes(m.tipo) && maxComboRef.current >= m.meta)
        nuevo = m.meta

      if (["completar_subniveles", "completar_subniveles_3"].includes(m.tipo))
        nuevo = Math.min(m.meta, nuevo + 1)

      if (m.tipo === "sin_perder_vida" && vidasPerdidas === 0)
        nuevo = m.meta

      if (m.tipo === "racha_combo" && maxComboRef.current >= m.meta)
        nuevo = m.meta

      if (["xp_ganar", "xp_ganar_100"].includes(m.tipo))
        nuevo = Math.min(m.meta, nuevo + xpGanadoSesion)

      if (nuevo !== m.progreso) {
        const completada = nuevo >= m.meta
        await supabase.from("misiones_diarias")
          .update({ progreso: nuevo, completada })
          .eq("id", m.id)

        if (completada) totalBonus += m.xp_recompensa
      }
    }

    // Aplicar todos los bonuses juntos en una sola actualización
    if (totalBonus > 0) {
      // Leer XP actual desde BD para evitar sobrescribir con valor de closure stale
      const { data: fresh } = await supabase
        .from("users").select("xp_total").eq("id", user.id).single()
      const nuevoXp = (fresh?.xp_total ?? xp) + totalBonus
      setXp(nuevoXp)
      await supabase.from("users").update({ xp_total: nuevoXp }).eq("id", user.id)
    }

    // ── Misión semanal ──
    if (nivelCompletado) {
      const lunes = getLunes()
      const { data: ms } = await supabase
        .from("misiones_diarias")
        .select("*")
        .eq("user_id", user.id)
        .eq("fecha", lunes)
        .eq("tipo", "completar_niveles_semana")
        .maybeSingle()
      if (ms && !ms.completada) {
        const nuevoProgreso = Math.min(ms.meta, ms.progreso + 1)
        const completada = nuevoProgreso >= ms.meta
        await supabase.from("misiones_diarias")
          .update({ progreso: nuevoProgreso, completada })
          .eq("id", ms.id)
        if (completada) {
          sound.missionComplete()
          setEpicEvent({ type: "missionComplete", data: { title: "¡Misión semanal!", subtitle: "+100 XP" } })
          const { data: fresh } = await supabase.from("users").select("xp_total").eq("id", user.id).single()
          const nuevoXp = (fresh?.xp_total ?? xp) + 100
          setXp(nuevoXp)
          await supabase.from("users").update({ xp_total: nuevoXp }).eq("id", user.id)
        }
      }
    }
  }

  const siguiente = async () => {
    setEstado(null)
    setRespuesta("")
    if (indice + 1 >= lecciones.length) {
      // Calcular pct antes de actualizarMisiones para pasarle nivelCompletado
      const numCorrectas = resultados.filter(r => r.correcta).length
      const pctFinal     = resultados.length > 0
        ? Math.round((numCorrectas / resultados.length) * 100)
        : 0
      await actualizarMisiones(vidas, pctFinal >= 70)
      // Guardar progresión si aprobó (≥70%)
      if (pctFinal >= 70) {
        await supabase.from("progreso_nivel").upsert([{
          user_id: user.id, nivel_id: nivelId, dificultad,
        }], { onConflict: "user_id,nivel_id,dificultad" })
        if (dificultad === "facil") setDificultad("normal")
        else if (dificultad === "normal") setDificultad("dificil")
      }
      const isPerfect    = pctFinal === 100
      const isClean      = vidas >= vidasInicialesRef.current // no perdió vidas
      if (isPerfect) {
        emitContiEvent("levelComplete")
        setEpicEvent({ type: "perfectRun", data: { subtitle: "¡Sin errores!" } })
      } else if (pctFinal >= 70) {
        emitContiEvent("levelComplete")
        setEpicEvent({ type: "levelComplete", data: { subtitle: `${pctFinal}% correcto` } })
      }
      // Leer stats acumulativos de BD y guardar los de esta sesión
      const { data: freshStats } = await supabase
        .from("users")
        .select("racha_actual, max_combo, perfect_sessions, clean_sessions, empresa_mes")
        .eq("id", user.id)
        .single()

      const newMaxCombo    = Math.max(freshStats?.max_combo    ?? 0, maxComboRef.current)
      const newPerfect     = (freshStats?.perfect_sessions     ?? 0) + (isPerfect ? 1 : 0)
      const newClean       = (freshStats?.clean_sessions       ?? 0) + (isClean ? 1 : 0)
      await supabase.from("users").update({
        max_combo:        newMaxCombo,
        perfect_sessions: newPerfect,
        clean_sessions:   newClean,
      }).eq("id", user.id)

      const newAchs = checkNewAchievements({
        xp:              xp,
        racha:           freshStats?.racha_actual ?? 0,
        maxCombo:        newMaxCombo,
        perfectSessions: newPerfect,
        cleanSessions:   newClean,
        empresaMes:      freshStats?.empresa_mes ?? 0,
      })
      if (newAchs.length > 0) {
        setTimeout(() => {
          setCurAch(newAchs[0])
          setAchQueue(newAchs.slice(1))
        }, isPerfect || pctFinal >= 70 ? 2800 : 400)
      }
      setFase("resultados")
      // Llamar a Claude para explicar los errores (resultados ya incluye el último)
      const errores = resultados.filter(r => !r.correcta && r.pregunta)
      if (errores.length > 0) {
        setCargandoIA(true)
        // Traer historial de errores previos de este nivel
        supabase
          .from("user_mistakes")
          .select("pregunta, tu_respuesta, respuesta_correcta, created_at")
          .eq("user_id", user.id)
          .eq("nivel_id", nivelId)
          .order("created_at", { ascending: false })
          .limit(20)
          .then(({ data: historial }) => {
            fetch("/api/explicar", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ errores, nivel: nivel?.titulo, historial: historial || [] }),
            })
              .then(r => r.json())
              .then(({ explicaciones }) => setExplicacionesIA(explicaciones || []))
              .finally(() => setCargandoIA(false))
          })
      }
    } else {
      setIndice(i => i + 1)
    }
  }

  if (loading) return <LoadingConti texto="Cargando lección..." />
  if (cargandoJuego) return <LoadingConti texto="Preparando ejercicios..." />
  if (errorJuego) return (
    <div className="qs" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, padding: "0 20px", textAlign: "center" }}>
      <div className="qs-bg-orb qs-bg-orb-1" />
      <div className="qs-bg-orb qs-bg-orb-2" />
      <span style={{ fontSize: 64 }}>⚠️</span>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Algo salió mal</h2>
        <p style={{ color: "var(--text-3)", maxWidth: 280 }}>{errorJuego}</p>
      </div>
      <button
        onClick={() => { setErrorJuego(null); cargarPreguntasIA() }}
        style={{ padding: "14px 32px", borderRadius: 16, fontWeight: 800, fontSize: 16, background: "var(--accent-green)", color: "#042713", border: "none", cursor: "pointer", boxShadow: "0 4px 0 #14532d" }}
      >
        🔄 Reintentar
      </button>
      <button onClick={() => router.push("/niveles")} style={{ color: "var(--text-3)", fontSize: 13, background: "none", border: "none", cursor: "pointer" }}>Volver a niveles</button>
    </div>
  )
  if (vidas <= 0) return <PantallaFin onVolver={() => router.push("/")} />

  // ── FASE TEORÍA ──
  if (fase === "teoria") {
    const slides = nivel?.teoria_json || []
    const slide = slides[slideTeoria]
    const esUltimo = slideTeoria >= slides.length - 1

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "transparent" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 max-w-2xl mx-auto w-full">
          <button onClick={() => { detenerVoz(); router.push("/niveles") }} className="text-zinc-400 hover:text-white text-xl">✕</button>
          <div className="flex gap-1">
            {slides.map((_, i) => (
              <div key={i} className="h-2 rounded-full transition-all" style={{ width: i === slideTeoria ? 24 : 8, background: i <= slideTeoria ? "var(--color-primary)" : "var(--color-border)" }} />
            ))}
          </div>
          <span className="text-sm text-zinc-400">{slideTeoria + 1}/{slides.length}</span>
        </div>

        <div className="flex-1 flex flex-col justify-center px-4 max-w-2xl mx-auto w-full">
          {slide ? (
            <div className="animate-pop-in">
              <div className="flex justify-center mb-4">
                <Mascota estado={hablandoVoz ? "hablando" : "feliz"} size={100} mensaje={slide.titulo} />
              </div>
              {/* Botones de voz */}
              <div className="flex justify-center gap-3 mb-2">
                <button onClick={() => hablar(`${slide.titulo}. ${slide.contenido}`)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
                  style={{ background: hablandoVoz ? "var(--color-warning)" : "var(--color-primary)", color: "#fff" }}>
                  {hablandoVoz ? "🔊 Hablando..." : "🔊 Escuchar"}
                </button>
                {hablandoVoz && (
                  <button onClick={detenerVoz}
                    className="px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
                    style={{ background: "var(--color-danger)", color: "#fff" }}>
                    ⏹ Detener
                  </button>
                )}
              </div>
              <div className="rounded-2xl p-6 mb-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--color-primary)" }}>
                  {nivel?.titulo} · Slide {slideTeoria + 1}
                </p>
                <h2 className="text-2xl font-extrabold mb-4">{slide.titulo}</h2>
                <p className="leading-relaxed text-lg">
                  {slide.contenido.split(" ").map((palabra, i) => (
                    <span key={i}
                      className="transition-all duration-150"
                      style={{
                        color: hablandoVoz && palabraActual === i ? "#ffffff" : "#d1d5db",
                        background: hablandoVoz && palabraActual === i ? "var(--color-primary)" : "transparent",
                        borderRadius: "4px",
                        padding: hablandoVoz && palabraActual === i ? "0 3px" : "0",
                        fontWeight: hablandoVoz && palabraActual === i ? "700" : "400",
                      }}>
                      {palabra}{" "}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <span className="text-6xl">{nivel?.emoji || "📖"}</span>
              <h2 className="text-2xl font-extrabold mt-4 mb-2">{nivel?.titulo}</h2>
              <p className="text-zinc-400">{nivel?.descripcion}</p>
            </div>
          )}
        </div>

        <div className="px-4 py-6 max-w-2xl mx-auto w-full flex gap-3">
          {slideTeoria > 0 && (
            <button onClick={() => setSlideTeoria(s => s - 1)}
              className="flex-1 rounded-2xl py-3 font-bold transition-all"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "#9ca3af" }}>
              ← Anterior
            </button>
          )}
          <button
            onClick={() => {
              if (!botonListo) return
              detenerVoz()
              if (esUltimo) cargarPreguntasIA()
              else setSlideTeoria(s => s + 1)
            }}
            className="flex-2 w-full rounded-2xl py-4 font-extrabold text-white relative overflow-hidden"
            style={{
              background: "var(--color-surface)",
              border: "1.5px solid var(--color-border)",
              boxShadow: botonListo ? "0 4px 0 var(--color-primary-dark)" : "none",
              cursor: botonListo ? "pointer" : "default",
            }}>
            {/* Relleno progresivo */}
            <div style={{
              position: "absolute", inset: 0,
              width: `${botonFill}%`,
              background: "var(--color-primary)",
              transition: botonFill === 0 ? "none" : "width 1.2s linear",
              borderRadius: "inherit",
            }} />
            <span className="relative z-10">
              {esUltimo ? "¡Empezar ejercicios! 🚀" : "Siguiente →"}
            </span>
          </button>
        </div>
      </div>
    )
  }

  // ── FASE RESULTADOS ──
  if (fase === "resultados") {
    const correctas = resultados.filter(r => r.correcta).length
    const incorrectas = resultados.filter(r => !r.correcta).length
    const pct = Math.round((correctas / resultados.length) * 100)
    const tiempoTotal = tiempos.reduce((a, b) => a + b, 0)
    const tiempoPromedio = tiempos.length ? Math.round(tiempoTotal / tiempos.length) : 0
    const mensaje = pct === 100 ? "¡Perfecto! Sin errores" : pct >= 70 ? "¡Muy bien hecho!" : pct >= 40 ? "Sigue practicando" : "¡No te rindas!"

    // Agrupar por tipo
    const porTipo = {}
    lecciones.forEach((l, i) => {
      const tipo = l.tipo_ejercicio
      if (!porTipo[tipo]) porTipo[tipo] = { correctas: 0, total: 0 }
      porTipo[tipo].total++
      if (resultados[i]?.correcta) porTipo[tipo].correctas++
    })

    const nombreTipo = { multiple_choice: "Opción múltiple", verdadero_falso: "Verdadero/Falso", completar_espacio: "Completar" }

    return (
      <div className="qs scr-resultados">
        <div className="qs-bg-orb qs-bg-orb-1" />
        <div className="qs-bg-orb qs-bg-orb-2" />

        <div className="scr-scroll">
          {/* Hero */}
          <div className="res-hero">
            <div className="res-confetti">
              <span style={{ left: "10%", animationDelay: "0s" }}>✦</span>
              <span style={{ left: "30%", animationDelay: "0.3s" }}>✶</span>
              <span style={{ left: "55%", animationDelay: "0.1s" }}>✦</span>
              <span style={{ left: "78%", animationDelay: "0.5s" }}>✶</span>
              <span style={{ left: "88%", animationDelay: "0.2s" }}>✦</span>
            </div>
            <div className="res-mascot-wrap">
              <Mascota
                estado={pct === 100 ? "celebrando" : pct >= 70 ? "feliz" : pct >= 40 ? "pensando" : "triste"}
                size={110}
                mensaje={getFrase({ combo, falloVarias: fallosSegidos >= 2, terminoNivel: pct === 100, vidas })}
              />
            </div>
            <div className="res-title">{mensaje}</div>
            <div className="res-sub">{nivel?.titulo} · {dificultadSesionRef.current === "facil" ? "Fácil" : dificultadSesionRef.current === "normal" ? "Normal" : "Difícil"}</div>

            <div className="res-score-row">
              <div className="res-score-card">
                <div className="res-score-big">{correctas}<span>/{resultados.length}</span></div>
                <div className="res-score-lbl">Correctas</div>
              </div>
              <div className="res-score-card xp">
                <div className="res-score-big res-xp-big">
                  <span className="res-xp-plus">+</span>{xpGanado}
                </div>
                <div className="res-score-lbl">XP ganado</div>
              </div>
              <div className="res-score-card combo">
                <div className="res-score-big">×{maxComboRef.current || combo}</div>
                <div className="res-score-lbl">Combo máx</div>
              </div>
            </div>

            {pct >= 70 && (
              <div className="res-progression">
                <span className="res-prog-ico">✨</span>
                <span>
                  {dificultadSesionRef.current === "facil" && "Desbloqueas dificultad Normal"}
                  {dificultadSesionRef.current === "normal" && "Desbloqueas dificultad Difícil"}
                  {dificultadSesionRef.current === "dificil" && "¡Nivel completado! Siguiente desbloqueado"}
                </span>
              </div>
            )}
          </div>

          {/* Explicaciones IA */}
          {(cargandoIA || resultados.some(r => !r.correcta)) && (
            <div className="res-section">
              <div className="res-section-hdr">
                <span className="res-ai-badge">IA</span>
                <span>Explicación de tus errores</span>
                {cargandoIA
                  ? <span className="res-section-meta" style={{ fontSize: 11 }}>analizando...</span>
                  : <span className="res-section-meta">{resultados.filter(r => !r.correcta).length}</span>
                }
              </div>

              {(() => {
                let errorIdx = 0
                return resultados.map((r, i) => {
                  if (r.correcta) return null
                  const ia = explicacionesIA[errorIdx++]
                  return (
                    <div key={i} className="res-error-card">
                      <div className="res-err-q">{r.pregunta}</div>
                      <div className="res-err-row">
                        <div className="res-err-mine">
                          <span className="res-err-lbl">Tú</span>
                          <span className="res-err-val">{r.tuRespuesta}</span>
                        </div>
                        <div className="res-err-correct">
                          <span className="res-err-lbl">Correcta</span>
                          <span className="res-err-val">{mostrarRespuesta(String(r.respuestaCorrecta))}</span>
                        </div>
                      </div>
                      {ia ? (
                        <div className="res-ai-grid">
                          {ia.concepto  && <ResExplainCard ico="📘" title="Concepto" body={ia.concepto} tone="blue" />}
                          {ia.ejemplo   && <ResExplainCard ico="🔢" title="Ejemplo" body={ia.ejemplo} tone="cyan" />}
                          {ia.error     && <ResExplainCard ico="⚠️" title="Tu error" body={ia.error} tone="red" />}
                          {ia.practica  && <ResExplainCard ico="🎯" title="Practica" body={ia.practica} tone="green" />}
                        </div>
                      ) : (
                        r.explicacion && (
                          <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 8, fontStyle: "italic" }}>
                            💡 {r.explicacion}
                          </div>
                        )
                      )}
                    </div>
                  )
                })
              })()}
            </div>
          )}

          {/* Botones */}
          <div className="res-actions">
            <button
              className="res-btn res-btn-secondary"
              onClick={() => { setFase("teoria"); setSlideTeoria(0); setIndice(0); setResultados([]); setXpGanado(0); setLecciones([]) }}
            >
              Repetir
            </button>
            <button
              className="res-btn res-btn-primary"
              onClick={() => router.push("/niveles")}
            >
              Continuar →
            </button>
          </div>

          <div className="dash-bottom-spacer" />
        </div>
      </div>
    )
  }

  // ── FASE JUEGO (rediseño) ──
  const leccion = lecciones[indice]
  const c = leccion.contenido_json
  const pct = (indice / lecciones.length) * 100
  const tiempoPct = (tiempo / TIEMPO_POR_PREGUNTA) * 100
  const tiempoColor = tiempo > 15 ? "#22c55e" : tiempo > 7 ? "#fbbf24" : "#ef4444"

  const feedbackState = estado === "correcto" ? "correct"
    : (estado === "incorrecto" || estado === "tiempo") ? "incorrect"
    : "idle"

  const mascotaEstado = feedbackState === "correct" ? "celebrando"
    : feedbackState === "incorrect" ? "triste"
    : combo >= 3 ? "feliz" : "pensando"

  const bubbleMsg = feedbackState === "correct"
    ? { bold: "¡Correcto!", rest: combo > 1 ? ` +10 XP · combo ×${combo}` : " +10 XP" }
    : feedbackState === "incorrect"
      ? { bold: estado === "tiempo" ? "⏱ Tiempo." : "Casi.",
          rest: estado === "tiempo" ? " Se acabó el tiempo" : ` ${mostrarRespuesta(String(c.respuesta_correcta))} era la correcta` }
      : combo >= 3
        ? { bold: `Combo ×${combo} 🔥`, rest: " ¡Imparable!" }
        : { bold: "Conti", rest: " · Piénsalo con calma" }

  const orb1Color = feedbackState === "correct" ? "rgba(34,197,94,0.9)"
    : feedbackState === "incorrect" ? "rgba(239,68,68,0.85)"
    : "rgba(34,197,94,0.6)"
  const orb1Opacity = feedbackState === "idle" ? 0.45 : feedbackState === "correct" ? 0.82 : 0.68

  const LETTERS = ["A","B","C","D","E"]

  return (
    <div style={{
      position: "relative", minHeight: "100vh", overflow: "hidden",
      background: "radial-gradient(ellipse 80% 50% at 50% 0%, #0f2244 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 100% 100%, #0c1a36 0%, transparent 55%), linear-gradient(180deg, #060b18 0%, #0a1428 100%)",
      color: "#f1f5fb",
      fontFamily: "'Manrope', 'Geist', system-ui, sans-serif",
    }}>

      {/* ── Animaciones CSS ── */}
      <style>{`
        @keyframes qs-shine { 0% { transform:translateX(-100%) } 100% { transform:translateX(100%) } }
        @keyframes qs-correct-pulse { 0%{box-shadow:0 0 0 0 rgba(34,197,94,0.6)} 60%{box-shadow:0 0 0 16px rgba(34,197,94,0)} 100%{box-shadow:0 0 0 1px rgba(34,197,94,0.3),0 0 30px rgba(34,197,94,0.45)} }
        @keyframes qs-shake { 10%,90%{transform:translateX(-2px)} 20%,80%{transform:translateX(3px)} 30%,50%,70%{transform:translateX(-5px)} 40%,60%{transform:translateX(5px)} }
        @keyframes qs-combo-pulse { 0%,100%{box-shadow:0 0 12px rgba(251,191,36,0.2);transform:scale(1)} 50%{box-shadow:0 0 22px rgba(251,191,36,0.5);transform:scale(1.05)} }
        .qs-option-shake { animation: qs-shake 0.5s cubic-bezier(.36,.07,.19,.97) }
      `}</style>

      {/* ── Ambient orbs ── */}
      <div style={{
        position: "absolute", width: 320, height: 320, top: -80, right: -80,
        borderRadius: 999, filter: "blur(60px)", pointerEvents: "none", zIndex: 0,
        mixBlendMode: "screen", opacity: orb1Opacity,
        background: `radial-gradient(circle, ${orb1Color}, transparent 65%)`,
        transition: "background 0.6s ease, opacity 0.6s ease",
      }} />
      <div style={{
        position: "absolute", width: 380, height: 380, bottom: -120, left: -100,
        borderRadius: 999, filter: "blur(60px)", pointerEvents: "none", zIndex: 0,
        mixBlendMode: "screen", opacity: 0.45,
        background: "radial-gradient(circle, rgba(6,182,212,0.45), transparent 65%)",
      }} />

      {/* ── Grid overlay ── */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)",
        backgroundSize: "40px 40px",
        maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black, transparent)",
      }} />

      {/* ── Partículas de acierto ── */}
      {mostrarParticulas && (
        <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
          {Array.from({ length: 14 }, (_, i) => (
            <div key={i} className="absolute rounded-full animate-particle"
              style={{ width: `${8+(i%3)*4}px`, height: `${8+(i%3)*4}px`,
                background: ["#22c55e","#fbbf24","#ef4444","#06b6d4","#a78bfa","#f59e0b"][i%6],
                "--ang": `${(360/14)*i}deg` }} />
          ))}
        </div>
      )}

      {/* ── Partículas de rango ── */}
      {rankUpKey > 0 && <Particles key={rankUpKey} preset="rankUp" />}

      {/* ── Epic Moment overlay ── */}
      <EpicMoment event={epicEvent} onDone={() => setEpicEvent(null)} />

      {/* ── Achievement Toast ── */}
      <AchievementToast achievement={curAch} onDone={() => { setCurAch(achQueue[0]??null); setAchQueue(q=>q.slice(1)) }} />

      {/* ── XP flotante ── */}
      {showFloatXP && (
        <div className="fixed z-50 pointer-events-none float-xp" style={{ top: "30%", left: "50%" }}>
          <p className="text-4xl font-extrabold whitespace-nowrap"
            style={{ color: "#22c55e", textShadow: "0 0 28px rgba(34,197,94,0.9), 0 2px 0 rgba(0,0,0,0.5)" }}>
            +10 XP ⚡
          </p>
        </div>
      )}

      {/* ── Popup COMBO ── */}
      {mostrarCombo && (
        <div className="fixed z-50 pointer-events-none animate-combo-pop"
          style={{ top: "38%", left: "50%", transform: "translate(-50%,-50%)" }}>
          <p className="text-5xl font-extrabold leading-none text-center"
            style={{ color: "#fbbf24", textShadow: "0 0 24px rgba(251,191,36,0.7), 0 2px 0 #00000066" }}>
            COMBO ×{combo}
          </p>
          <p className="text-4xl mt-1 text-center">🔥</p>
        </div>
      )}

      {/* ── Contenido principal ── */}
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column", padding: "16px 20px 0", maxWidth: 640, margin: "0 auto" }}>

        {/* ── TOP BAR ── */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, paddingBottom: 14 }}>
          {/* Izquierda: salir + chip nivel + meta */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => { detenerVoz(); router.push("/niveles") }}
              style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#a4b1c6", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              ✕
            </button>
            <div style={{ width: 42, height: 42, borderRadius: 14, background: "linear-gradient(135deg,#1e3a8a 0%,#0c4a6e 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#c7d2fe", border: "1px solid rgba(167,139,250,0.3)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 14px -4px rgba(99,102,241,0.4)", flexShrink: 0 }}>
              N{nivel?.orden ?? "?"}
            </div>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em" }}>{nivel?.titulo}</div>
              <div style={{ fontSize: 11.5, color: "#6b7a93", marginTop: 3 }}>
                {dificultad === "facil" ? "🟢 Fácil" : dificultad === "normal" ? "🟡 Normal" : "🔴 Difícil"}
              </div>
            </div>
          </div>

          {/* Derecha: XP + corazones */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px 7px 9px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.22)", borderRadius: 999 }}>
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 2L14.5 9L22 9.5L16 14.5L18 22L12 17.8L6 22L8 14.5L2 9.5L9.5 9Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.8" strokeLinejoin="round"/></svg>
              <span style={{ fontSize: 13.5, color: "#fbbf24", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{xp.toLocaleString()}</span>
              <span style={{ fontSize: 10.5, color: "rgba(251,191,36,0.7)", fontWeight: 600 }}>XP</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "5px 9px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 999 }}>
              {[0,1,2,3,4].map(i => <Heart key={i} filled={i < vidas} />)}
            </div>
          </div>
        </header>

        {/* ── BARRA DE PROGRESO ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <div style={{ flex: 1, height: 12, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", position: "relative" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#16a34a 0%,#22c55e 50%,#4ade80 100%)", borderRadius: 999, boxShadow: "0 0 12px rgba(34,197,94,0.5), inset 0 1px 0 rgba(255,255,255,0.3)", transition: "width 0.4s ease", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.45) 50%,transparent 100%)", animation: "qs-shine 2.6s infinite linear" }} />
            </div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#a4b1c6", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
            <span style={{ color: "#4ade80" }}>{indice+1}</span>/{lecciones.length}
          </span>
          {combo >= 2 && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 12px 7px 10px", background: "linear-gradient(135deg,rgba(251,191,36,0.22),rgba(249,115,22,0.18))", border: "1px solid rgba(251,191,36,0.45)", borderRadius: 999, fontWeight: 800, color: "#fde68a", boxShadow: "0 0 16px rgba(251,191,36,0.25)", animation: "qs-combo-pulse 1.8s infinite ease-in-out" }}>
              <span style={{ fontSize: 14 }}>🔥</span>
              <span style={{ fontSize: 11, opacity: 0.7 }}>×</span>
              <span style={{ fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{combo}</span>
            </div>
          )}
        </div>

        {/* ── PREGUNTA ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          {/* Tag */}
          <span style={{ alignSelf: "flex-start", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#06b6d4", padding: "5px 10px", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: 6 }}>
            {leccion.tipo_ejercicio === "verdadero_falso" ? "Pregunta · V/F"
              : leccion.tipo_ejercicio === "completar_espacio" ? "Pregunta · Completar"
              : "Pregunta · Opción múltiple"}
          </span>

          {/* Tarjeta blanca */}
          <div className={feedbackState === "incorrect" ? "qs-option-shake" : ""} style={{ position: "relative", background: "#f8fafc", borderRadius: 22, padding: "22px 22px 18px", boxShadow: "0 24px 60px -20px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg,#22c55e 0%,#06b6d4 50%,#a78bfa 100%)" }} />
            <p style={{ fontSize: 19, lineHeight: 1.35, fontWeight: 700, letterSpacing: "-0.015em", color: "#0b1326", margin: 0 }}>
              {c.pregunta}
            </p>
            {c.imagen_url && (
              <div style={{ marginTop: 14, borderRadius: 12, overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.imagen_url} alt="" style={{ width: "100%", maxHeight: 180, objectFit: "cover" }} />
              </div>
            )}
            {c.audio_url && (
              <div style={{ marginTop: 12 }}>
                <audio ref={audioRef} controls style={{ width: "100%", borderRadius: 8 }}>
                  <source src={c.audio_url} />
                </audio>
              </div>
            )}
            <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: "#fbbf24", boxShadow: "0 0 6px rgba(251,191,36,0.6)", flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "#475569" }}>Pista disponible · −10 XP</span>
            </div>
          </div>

          {/* Timer */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "#a4b1c6" }}>⏱ Tiempo</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: tiempoColor, fontVariantNumeric: "tabular-nums" }}>{tiempo}s</span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 999, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ height: "100%", width: `${tiempoPct}%`, borderRadius: 999, background: tiempo > 15 ? "linear-gradient(90deg,#22c55e,#06b6d4)" : tiempo > 7 ? "linear-gradient(90deg,#fbbf24,#f59e0b)" : "linear-gradient(90deg,#ef4444,#f97316)", transition: "width 1s linear, background 0.3s", boxShadow: `0 0 8px ${tiempoColor}` }} />
            </div>
          </div>
        </div>

        {/* ── OPCIONES ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 240 }}>

          {/* Multiple choice */}
          {leccion.tipo_ejercicio === "multiple_choice" && opcionesMezcladas.map((op, i) => {
            const s = getOptionStyle(op, feedbackState, respuesta, c.respuesta_correcta)
            const isCorrectOp = op === c.respuesta_correcta
            const arrowIcon = feedbackState !== "idle" && isCorrectOp ? "✓"
              : feedbackState !== "idle" && respuesta === op && !isCorrectOp ? "✕" : "→"
            const arrowBg = feedbackState !== "idle" && isCorrectOp ? "#22c55e"
              : feedbackState !== "idle" && respuesta === op && !isCorrectOp ? "#ef4444" : "transparent"
            const arrowCol = arrowBg !== "transparent" ? (isCorrectOp ? "#042713" : "#2a0707") : "#6b7a93"
            return (
              <button key={i}
                onClick={() => feedbackState === "idle" && setRespuesta(op)}
                disabled={feedbackState !== "idle"}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px", background: s.bg, border: `1.5px ${s.borderStyle||"solid"} ${s.border}`, borderRadius: 18, color: s.color || "#f1f5fb", cursor: feedbackState === "idle" ? "pointer" : "default", textAlign: "left", fontFamily: "inherit", fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.005em", minHeight: 60, opacity: s.opacity ?? 1, boxShadow: s.shadow, transition: "all 0.18s ease", animation: s.animation || "none" }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: s.letterBg, border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: s.letterColor, flexShrink: 0 }}>
                  {LETTERS[i]}
                </span>
                <span style={{ flex: 1 }}>{mostrarRespuesta(op)}</span>
                <span style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: arrowCol, background: arrowBg, opacity: (feedbackState !== "idle" && (isCorrectOp || respuesta === op)) ? 1 : 0.45, transition: "all 0.2s" }}>
                  {arrowIcon}
                </span>
              </button>
            )
          })}

          {/* Verdadero / Falso */}
          {leccion.tipo_ejercicio === "verdadero_falso" && ["true","false"].map((val, i) => {
            const s = getOptionStyle(val, feedbackState, respuesta, String(c.respuesta_correcta))
            const isCorrectOp = val === String(c.respuesta_correcta)
            const arrowIcon = feedbackState !== "idle" && isCorrectOp ? "✓"
              : feedbackState !== "idle" && respuesta === val && !isCorrectOp ? "✕" : "→"
            const arrowBg = feedbackState !== "idle" && isCorrectOp ? "#22c55e"
              : feedbackState !== "idle" && respuesta === val && !isCorrectOp ? "#ef4444" : "transparent"
            const arrowCol = arrowBg !== "transparent" ? (isCorrectOp ? "#042713" : "#2a0707") : "#6b7a93"
            return (
              <button key={val}
                onClick={() => feedbackState === "idle" && setRespuesta(val)}
                disabled={feedbackState !== "idle"}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px", background: s.bg, border: `1.5px ${s.borderStyle||"solid"} ${s.border}`, borderRadius: 18, color: s.color || "#f1f5fb", cursor: feedbackState === "idle" ? "pointer" : "default", textAlign: "left", fontFamily: "inherit", fontSize: 14.5, fontWeight: 600, minHeight: 60, opacity: s.opacity ?? 1, boxShadow: s.shadow, transition: "all 0.18s ease" }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: s.letterBg, border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, color: s.letterColor, flexShrink: 0 }}>
                  {val === "true" ? "V" : "F"}
                </span>
                <span style={{ flex: 1 }}>{val === "true" ? "Verdadero" : "Falso"}</span>
                <span style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: arrowCol, background: arrowBg, opacity: (feedbackState !== "idle" && (isCorrectOp || respuesta === val)) ? 1 : 0.45, transition: "all 0.2s" }}>
                  {arrowIcon}
                </span>
              </button>
            )
          })}

          {/* Completar espacio */}
          {leccion.tipo_ejercicio === "completar_espacio" && (
            <input type="text" value={respuesta}
              onChange={e => setRespuesta(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !estado && verificar()}
              disabled={!!estado}
              placeholder="Escribe tu respuesta..."
              style={{ width: "100%", borderRadius: 18, padding: "16px 20px", fontSize: 15, fontWeight: 600, background: "#14213d", border: `1.5px solid ${estado === "correcto" ? "#22c55e" : estado ? "#ef4444" : "rgba(255,255,255,0.14)"}`, color: "#f1f5fb", outline: "none", fontFamily: "inherit", boxShadow: estado === "correcto" ? "0 0 20px rgba(34,197,94,0.35)" : estado ? "0 0 16px rgba(239,68,68,0.3)" : "0 4px 0 rgba(0,0,0,0.28)" }}
            />
          )}
        </div>
      </div>

      {/* ── FOOTER FIJO: mascota + burbuja + botón ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 20,
        background: feedbackState === "correct" ? "rgba(4,18,10,0.97)" : feedbackState === "incorrect" ? "rgba(18,4,4,0.97)" : "rgba(6,11,24,0.96)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        borderTop: feedbackState === "correct" ? "1px solid rgba(34,197,94,0.35)" : feedbackState === "incorrect" ? "1px solid rgba(239,68,68,0.35)" : "1px solid rgba(255,255,255,0.07)",
        boxShadow: feedbackState === "correct" ? "0 -8px 32px rgba(34,197,94,0.14)" : feedbackState === "incorrect" ? "0 -8px 32px rgba(239,68,68,0.14)" : "none",
        padding: "16px 20px 28px",
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Fila mascota + burbuja */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
            <Mascota estado={mascotaEstado} size={100} />
            <div style={{ flex: 1, position: "relative", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)", padding: "13px 16px", borderRadius: "16px 16px 16px 4px", fontSize: 14, lineHeight: 1.45, color: "#a4b1c6", backdropFilter: "blur(8px)" }}>
              <b style={{ color: "#f1f5fb" }}>{bubbleMsg.bold}</b>
              <span>{bubbleMsg.rest}</span>
              {feedbackState === "incorrect" && c.explicacion_error && (
                <p style={{ marginTop: 8, fontSize: 12.5, color: "#94a3b8", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 8 }}>
                  💡 {c.explicacion_error}
                </p>
              )}
            </div>
          </div>

          {/* Botón de acción */}
          {feedbackState === "idle" ? (
            <button onClick={verificar} disabled={!respuesta}
              style={{
                width: "100%", padding: "16px", borderRadius: 16,
                fontFamily: "inherit", fontSize: 16, fontWeight: 800,
                background: respuesta ? "#22c55e" : "rgba(255,255,255,0.05)",
                color: respuesta ? "#042713" : "#6b7a93",
                border: `1.5px solid ${respuesta ? "#22c55e" : "rgba(255,255,255,0.09)"}`,
                cursor: respuesta ? "pointer" : "default",
                boxShadow: respuesta ? "0 4px 0 #14532d" : "none",
                transition: "all 0.2s ease",
              }}>
              Verificar
            </button>
          ) : (
            <button onClick={siguiente}
              style={{
                width: "100%", padding: "16px", borderRadius: 16,
                fontFamily: "inherit", fontSize: 16, fontWeight: 800,
                background: feedbackState === "correct" ? "#22c55e" : "#ef4444",
                color: feedbackState === "correct" ? "#042713" : "#fff",
                border: "none", cursor: "pointer",
                boxShadow: feedbackState === "correct" ? "0 4px 0 #14532d" : "0 4px 0 #7f1d1d",
                transition: "all 0.2s ease",
              }}>
              {indice + 1 >= lecciones.length ? "Ver resultados 📊" : "Siguiente →"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function PantallaFin({ onVolver }) {
  return (
    <div className="qs" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, padding: "0 20px", textAlign: "center" }}>
      <div className="qs-bg-orb qs-bg-orb-1" />
      <div className="qs-bg-orb qs-bg-orb-2" />
      <div style={{ width: 96, height: 96, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, background: "rgba(239,68,68,0.12)", border: "2px solid rgba(239,68,68,0.4)", boxShadow: "0 0 40px rgba(239,68,68,0.2)" }}>
        💔
      </div>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Sin vidas</h1>
        <p style={{ color: "var(--text-3)", maxWidth: 280 }}>
          Se recarga 1 vida cada 30 min.<br />¡Vuelve pronto!
        </p>
      </div>
      <button
        onClick={onVolver}
        style={{ padding: "14px 40px", borderRadius: 16, fontWeight: 800, fontSize: 16, background: "var(--accent-green)", color: "#042713", border: "none", cursor: "pointer", boxShadow: "0 4px 0 #14532d" }}
      >
        ← Ir al inicio
      </button>
    </div>
  )
}

function ResExplainCard({ ico, title, body, tone }) {
  return (
    <div className={`res-explain res-explain-${tone}`}>
      <div className="res-explain-hdr">
        <span className="res-explain-ico">{ico}</span>
        <span className="res-explain-title">{title}</span>
      </div>
      <div className="res-explain-body">{body}</div>
    </div>
  )
}

export default function LeccionPage() {
  return (
    <Suspense fallback={<LoadingConti texto="Cargando lección..." />}>
      <LeccionInner />
    </Suspense>
  )
}
