"use client"

import { useEffect, useMemo, useState, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"
import Mascota from "../../components/Mascota"
import { getFrase } from "../../lib/frases"
import LoadingConti from "../../components/LoadingConti"
import PageTransition from "../../components/PageTransition"
import EpicMoment from "../../components/EpicMoment"
import AchievementToast from "../../components/AchievementToast"
import { sound } from "../../lib/audio"
import { checkNewAchievements } from "../../lib/achievements"

const TIEMPO_POR_PREGUNTA = 30

function mezclar(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

function mostrarRespuesta(val) {
  if (val === "true")  return "Verdadero"
  if (val === "false") return "Falso"
  return val
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
  const [showFloatXP, setShowFloatXP] = useState(false)
  const [epicEvent, setEpicEvent]     = useState(null)
  const [achQueue, setAchQueue]       = useState([])
  const [curAch, setCurAch]           = useState(null)
  const timerRef = useRef(null)
  const audioRef = useRef(null)


  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      if (!nivelId) { router.push("/niveles"); return }
      setUser(user)

      const [{ data: nivelData }, { data: perfil }, { data: leccionesData }] = await Promise.all([
        supabase.from("niveles").select("*").eq("id", nivelId).single(),
        supabase.from("users").select("xp_total, vidas").eq("id", user.id).maybeSingle(),
        supabase.from("lecciones").select("*").eq("nivel_id", nivelId).order("orden", { ascending: true }),
      ])

      if (!perfil) {
        await supabase.from("users").insert([{ id: user.id, email: user.email, xp_total: 0, racha_actual: 0, vidas: 5, ultima_vida_recargada: new Date().toISOString() }])
        setXp(0); setVidas(5)
        vidasInicialesRef.current = 5
      } else {
        setXp(perfil.xp_total ?? 0)
        setVidas(perfil.vidas ?? 5)
        vidasInicialesRef.current = perfil.vidas ?? 5  // guardar vidas al inicio de sesión
      }

      setNivel(nivelData)
      setLecciones(mezclar(leccionesData || []))
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

  // Cancelar voz al desmontar el componente (navegar a otra página)
  useEffect(() => {
    return () => { window.speechSynthesis?.cancel() }
  }, [])

  // Cancelar voz cuando se quedan sin vidas (PantallaFin no desmonta el componente)
  useEffect(() => {
    if (vidas <= 0) window.speechSynthesis?.cancel()
  }, [vidas])

  // Hablar al cambiar slide de teoría
  useEffect(() => {
    if (fase !== "teoria") return
    if (vidas <= 0) return
    const slides = nivel?.teoria_json || []
    const slide = slides[slideTeoria]
    if (!slide) return

    // Esperar que las voces carguen si es la primera vez
    const ejecutarVoz = () => hablar(`${slide.titulo}. ${slide.contenido}`)
    if (window.speechSynthesis.getVoices().length > 0) {
      ejecutarVoz()
    } else {
      window.speechSynthesis.onvoiceschanged = () => { ejecutarVoz(); window.speechSynthesis.onvoiceschanged = null }
    }
    // Cancelar voz al cambiar de slide o salir de la teoría
    return () => { window.speechSynthesis?.cancel() }
  }, [slideTeoria, fase, nivel])

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

  // function declaration → hoisted; disponible en los useEffects declarados antes en el código
  function hablar(texto) {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    setPalabraActual(-1)

    const u = new SpeechSynthesisUtterance(texto)
    u.lang = "es-ES"
    u.rate = 0.88       // Natural, ni muy lento ni muy rápido
    u.pitch = 1.0       // Tono neutro, menos robótico
    u.volume = 1

    // Priorizar Google español (más natural), luego Microsoft
    const voces = window.speechSynthesis.getVoices()
    const voz = voces.find(v => v.name.includes("Google") && v.lang.startsWith("es")) ||
                voces.find(v => v.name === "Microsoft Sabina - Spanish (Mexico)") ||
                voces.find(v => v.name.includes("Sabina")) ||
                voces.find(v => v.name.includes("Raul")) ||
                voces.find(v => v.lang.startsWith("es"))
    if (voz) u.voice = voz

    // Sincronizar palabra por palabra
    u.onboundary = (e) => {
      if (e.name === "word") {
        const palabraIdx = texto.substring(0, e.charIndex).split(" ").length - 1
        setPalabraActual(palabraIdx)
      }
    }
    u.onstart = () => setHablandoVoz(true)
    u.onend = () => { setHablandoVoz(false); setPalabraActual(-1) }
    u.onerror = () => { setHablandoVoz(false); setPalabraActual(-1) }
    window.speechSynthesis.speak(u)
  } // end hablar

  function detenerVoz() {
    window.speechSynthesis?.cancel()
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
      // Anti-farmeo: solo dar XP si esta lección no estaba ya completada
      const { data: existe } = await supabase
        .from("progreso_usuario")
        .select("id")
        .eq("user_id", user.id)
        .eq("leccion_id", leccion.id)
        .maybeSingle()
      if (!existe) {
        // Primera vez correcta → insertar progreso y otorgar XP
        const nuevoXp = xp + 10
        setXp(nuevoXp)
        setXpGanado(prev => prev + 10)
        xpSesionRef.current += 10
        setShowFloatXP(true)
        setTimeout(() => setShowFloatXP(false), 950)
        await supabase.from("users").update({ xp_total: nuevoXp }).eq("id", user.id)
        await supabase.from("progreso_usuario").insert([{
          user_id: user.id, leccion_id: leccion.id, completado: true, puntaje: 10,
        }])
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

  // ── Actualizar misiones al terminar la sesión ──
  const actualizarMisiones = async (vidasFinales) => {
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

      if (m.tipo === "responder_preguntas")
        nuevo = Math.min(m.meta, nuevo + preguntasRespRef.current)

      if (m.tipo === "correctas_seguidas" && maxComboRef.current >= m.meta)
        nuevo = m.meta

      if (m.tipo === "completar_subniveles")
        nuevo = Math.min(m.meta, nuevo + 1)

      if (m.tipo === "sin_perder_vida" && vidasPerdidas === 0)
        nuevo = m.meta

      if (m.tipo === "racha_combo" && maxComboRef.current >= m.meta)
        nuevo = m.meta

      if (m.tipo === "xp_ganar")
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
  }

  const siguiente = async () => {
    setEstado(null)
    setRespuesta("")
    if (indice + 1 >= lecciones.length) {
      await actualizarMisiones(vidas)
      // Calcular resultado final y mostrar EpicMoment si corresponde
      const numCorrectas = resultados.filter(r => r.correcta).length
      const pctFinal     = resultados.length > 0
        ? Math.round((numCorrectas / resultados.length) * 100)
        : 0
      const isPerfect    = pctFinal === 100
      const isClean      = vidas >= vidasInicialesRef.current // no perdió vidas
      if (isPerfect) {
        emitContiEvent("levelComplete")
        setEpicEvent({ type: "perfectRun", data: { subtitle: "¡Sin errores!" } })
      } else if (pctFinal >= 70) {
        emitContiEvent("levelComplete")
        setEpicEvent({ type: "levelComplete", data: { subtitle: `${pctFinal}% correcto` } })
      }
      // Verificar logros desbloqueados en esta sesión
      const newAchs = checkNewAchievements({
        xp:              xp,
        racha:           0,              // racha se actualiza en BD, usar 0 conservador
        maxCombo:        maxComboRef.current,
        perfectSessions: isPerfect ? 1 : 0,
        cleanSessions:   isClean   ? 1 : 0,
      })
      if (newAchs.length > 0) {
        setTimeout(() => {
          setCurAch(newAchs[0])
          setAchQueue(newAchs.slice(1))
        }, isPerfect || pctFinal >= 70 ? 2800 : 400)
      }
      setFase("resultados")
    } else {
      setIndice(i => i + 1)
    }
  }

  if (loading) return <LoadingConti texto="Cargando lección..." />
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
            onClick={() => { detenerVoz(); if (esUltimo) setFase("juego"); else setSlideTeoria(s => s + 1) }}
            className="flex-2 w-full rounded-2xl py-4 font-extrabold text-white transition-all active:scale-95"
            style={{ background: "var(--color-primary)", boxShadow: "0 4px 0 var(--color-primary-dark)" }}>
            {esUltimo ? "¡Empezar ejercicios! 🚀" : "Siguiente →"}
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
      <div className="min-h-screen pb-10" style={{ background: "transparent" }}>
        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Header resultado */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-2">
              <Mascota
                estado={pct === 100 ? "celebrando" : pct >= 70 ? "feliz" : pct >= 40 ? "pensando" : "triste"}
                size={100}
                mensaje={getFrase({ combo, falloVarias: fallosSegidos >= 2, terminoNivel: pct === 100, vidas })}
              />
            </div>
            <h1 className="text-2xl font-extrabold">{mensaje}</h1>
            <p className="text-zinc-400 text-sm mt-1">{nivel?.titulo}</p>
          </div>

          {/* Stats principales */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-2xl p-4 text-center" style={{ background: "#0d2e14", border: "1px solid var(--color-primary)" }}>
              <p className="text-3xl font-extrabold" style={{ color: "var(--color-primary)" }}>{correctas}/{resultados.length}</p>
              <p className="text-xs text-zinc-400">Correctas</p>
            </div>
            <div className="rounded-2xl p-4 text-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <p className="text-3xl font-extrabold" style={{ color: "var(--color-warning)" }}>{pct}%</p>
              <p className="text-xs text-zinc-400">Precisión</p>
            </div>
          </div>

          {/* Stats secundarias */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-2xl p-3 text-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <p className="text-xl font-extrabold" style={{ color: "var(--color-info)" }}>+{xpGanado}</p>
              <p className="text-xs text-zinc-400">XP ganado</p>
            </div>
            <div className="rounded-2xl p-3 text-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <p className="text-xl font-extrabold text-white">{tiempoPromedio}s</p>
              <p className="text-xs text-zinc-400">Tiempo prom.</p>
            </div>
            <div className="rounded-2xl p-3 text-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <p className="text-xl font-extrabold" style={{ color: "var(--color-danger)" }}>{incorrectas}</p>
              <p className="text-xs text-zinc-400">Falladas</p>
            </div>
          </div>

          {/* Por tipo de pregunta */}
          {Object.keys(porTipo).length > 1 && (
            <div className="rounded-2xl p-4 mb-4" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <p className="text-sm font-bold mb-3">Por tipo de pregunta</p>
              {Object.entries(porTipo).map(([tipo, data]) => (
                <div key={tipo} className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-zinc-400 w-32">{nombreTipo[tipo] || tipo}</span>
                  <div className="flex-1 rounded-full h-2" style={{ background: "#0d1a20" }}>
                    <div className="h-2 rounded-full" style={{ width: `${(data.correctas / data.total) * 100}%`, background: "var(--color-primary)" }} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{data.correctas}/{data.total}</span>
                </div>
              ))}
            </div>
          )}

          {/* Detalle por pregunta */}
          <p className="text-sm font-bold mb-3">Detalle de respuestas</p>
          <div className="flex flex-col gap-3 mb-6">
            {resultados.map((r, i) => (
              <div key={i} className="rounded-2xl p-4" style={{ background: r.correcta ? "#0d2e14" : "#2e0d0d", border: `1px solid ${r.correcta ? "var(--color-primary)" : "var(--color-danger)"}` }}>
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-bold flex-1 pr-2">{r.correcta ? "✅" : "❌"} {r.pregunta}</p>
                  <span className="text-xs text-zinc-500 flex-shrink-0">{r.tiempo}s</span>
                </div>
                {!r.correcta && (
                  <div className="text-xs mt-2 flex flex-col gap-1">
                    <p className="text-zinc-400">Tu respuesta: <span style={{ color: "var(--color-danger)" }}>{r.tuRespuesta}</span></p>
                    <p className="text-zinc-400">Correcta: <span style={{ color: "var(--color-primary)" }}>{mostrarRespuesta(String(r.respuestaCorrecta))}</span></p>
                    {r.explicacion && <p className="mt-1 text-zinc-300 italic">💡 {r.explicacion}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setFase("teoria"); setIndice(0); setResultados([]); setXpGanado(0); setLecciones(mezclar(lecciones)) }}
              className="flex-1 rounded-2xl py-3 font-bold transition-all"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "#9ca3af" }}>
              🔄 Repetir
            </button>
            <button onClick={() => router.push("/niveles")}
              className="flex-1 rounded-2xl py-3 font-extrabold text-white transition-all active:scale-95"
              style={{ background: "var(--color-primary)", boxShadow: "0 4px 0 var(--color-primary-dark)" }}>
              Ver niveles
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── FASE JUEGO ──
  const leccion = lecciones[indice]
  const c = leccion.contenido_json
  const pct = (indice / lecciones.length) * 100
  const tiempoPct = (tiempo / TIEMPO_POR_PREGUNTA) * 100
  const tiempoColor = tiempo > 15 ? "var(--color-primary)" : tiempo > 7 ? "var(--color-warning)" : "var(--color-danger)"

  return (
    <div className={`min-h-screen flex flex-col ${animacion === "correcto" ? "animate-pop-in" : animacion === "incorrecto" ? "animate-shake" : ""}`} style={{ background: "transparent" }}>

      {/* ── Partículas de acierto ── */}
      {mostrarParticulas && (
        <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
          {Array.from({ length: 14 }, (_, i) => (
            <div key={i}
              className="absolute rounded-full animate-particle"
              style={{
                width:  `${8 + (i % 3) * 4}px`,
                height: `${8 + (i % 3) * 4}px`,
                background: ["#58cc02","#ffc800","#ff4b4b","#1cb0f6","#c084fc","#f59e0b"][i % 6],
                "--ang": `${(360 / 14) * i}deg`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Epic Moment overlay ── */}
      <EpicMoment event={epicEvent} onDone={() => setEpicEvent(null)} />

      {/* ── Achievement Toast ── */}
      <AchievementToast
        achievement={curAch}
        onDone={() => {
          const next = achQueue[0] ?? null
          setCurAch(next)
          setAchQueue(q => q.slice(1))
        }}
      />

      {/* ── XP flotante ── */}
      {showFloatXP && (
        <div
          className="fixed z-50 pointer-events-none float-xp"
          style={{ top: "32%", left: "50%" }}
        >
          <p
            className="text-4xl font-extrabold whitespace-nowrap"
            style={{
              color: "var(--color-primary)",
              textShadow: "0 0 28px rgba(88,204,2,0.9), 0 2px 0 rgba(0,0,0,0.5)",
            }}
          >
            +10 XP ⚡
          </p>
        </div>
      )}

      {/* ── Popup COMBO ── */}
      {mostrarCombo && (
        <div className="fixed z-50 pointer-events-none animate-combo-pop"
          style={{ top: "38%", left: "50%", transform: "translate(-50%,-50%)" }}>
          <div className="text-center">
            <p className="text-5xl font-extrabold leading-none"
              style={{ color: "#ffc800", textShadow: "0 0 24px #ffc80088, 0 2px 0 #00000066" }}>
              COMBO ×{combo}
            </p>
            <p className="text-4xl mt-1">🔥</p>
          </div>
        </div>
      )}

      {/* Pantalla transición de dificultad */}
      {transicionDif && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center animate-pop-in"
          style={{ background: "rgba(0,0,0,0.85)" }}>
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-zinc-400 text-sm mb-2">¡Subiste de categoría!</p>
          <p className="text-4xl font-extrabold mb-2" style={{ color: transicionDif.color }}>
            {transicionDif.emoji} {transicionDif.nombre}
          </p>
          <p className="text-zinc-400 text-sm">Las preguntas serán más difíciles</p>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-4 max-w-2xl mx-auto w-full">
        <button onClick={() => { detenerVoz(); router.push("/niveles") }} className="text-zinc-400 hover:text-white text-xl">✕</button>
        <div className="flex-1 rounded-full h-3" style={{ background: "var(--color-surface)" }}>
          <div className="h-3 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: "var(--color-primary)" }} />
        </div>
        <div className="flex items-center gap-3 text-sm font-bold">
          <span style={{ color: "var(--color-danger)" }}>❤️ {vidas}</span>
          <span style={{ color: "var(--color-info)" }}>⚡ {xp}</span>
        </div>
      </div>


      {/* Temporizador */}
      <div className="px-4 max-w-2xl mx-auto w-full mb-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-full h-2" style={{ background: "var(--color-surface)" }}>
            <div className="h-2 rounded-full transition-all duration-1000" style={{ width: `${tiempoPct}%`, background: tiempoColor }} />
          </div>
          <span className="text-sm font-extrabold w-6 text-right" style={{ color: tiempoColor }}>{tiempo}</span>
        </div>
      </div>

      {/* Frase búho cuando hay combo o fallos (solo si hay algo que decir) */}
      {(combo >= 3 || fallosSegidos >= 2) && (
        <div className="px-4 max-w-2xl mx-auto w-full mb-2">
          <div className="rounded-xl px-3 py-2 text-xs font-semibold text-center"
            style={{ background: combo >= 3 ? "#0d2e14" : "#2e0d0d", color: combo >= 3 ? "var(--color-primary)" : "var(--color-danger)", border: `1px solid ${combo >= 3 ? "var(--color-primary)" : "var(--color-danger)"}40` }}>
            {getFrase({ combo, falloVarias: fallosSegidos >= 2, vidas })}
          </div>
        </div>
      )}

      {/* Ejercicio */}
      <div className="flex-1 flex flex-col justify-center px-4 pb-40 max-w-2xl mx-auto w-full">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-primary)" }}>
          Pregunta {indice + 1} de {lecciones.length}
        </p>

        <h2 className="text-2xl font-extrabold mb-4 leading-snug">{c.pregunta}</h2>

        {/* Imagen si existe */}
        {c.imagen_url && (
          <div className="mb-4 rounded-2xl overflow-hidden">
            {/* Dominio de imagen desconocido (viene de BD) → no se puede usar next/image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.imagen_url} alt="Pregunta" className="w-full object-cover max-h-48" />
          </div>
        )}

        {/* Audio si existe */}
        {c.audio_url && (
          <div className="mb-4">
            <audio ref={audioRef} controls className="w-full rounded-xl" style={{ accentColor: "var(--color-primary)" }}>
              <source src={c.audio_url} />
            </audio>
          </div>
        )}

        {leccion.tipo_ejercicio === "multiple_choice" && (
          <div className="grid grid-cols-1 gap-3">
            {opcionesMezcladas.map((op, i) => {
              const seleccionada = respuesta === op
              let borderColor = "var(--color-border)"
              let bg = "var(--color-surface)"
              if (estado === "correcto" && seleccionada) { borderColor = "var(--color-primary)"; bg = "#0d2e14" }
              if (estado === "incorrecto" && seleccionada) { borderColor = "var(--color-danger)"; bg = "#2e0d0d" }
              else if (seleccionada && !estado) { borderColor = "var(--color-info)"; bg = "#0d1e2e" }
              return (
                <button key={i} onClick={() => !estado && setRespuesta(op)} disabled={!!estado}
                  className="rounded-2xl p-4 text-left font-semibold transition-all active:scale-95"
                  style={{ background: bg, border: `2px solid ${borderColor}` }}>
                  {op}
                </button>
              )
            })}
          </div>
        )}

        {leccion.tipo_ejercicio === "verdadero_falso" && (
          <div className="grid grid-cols-2 gap-4">
            {["true", "false"].map((val) => {
              const seleccionada = respuesta === val
              let borderColor = "var(--color-border)"
              let bg = "var(--color-surface)"
              if (estado === "correcto" && seleccionada) { borderColor = "var(--color-primary)"; bg = "#0d2e14" }
              if (estado === "incorrecto" && seleccionada) { borderColor = "var(--color-danger)"; bg = "#2e0d0d" }
              else if (seleccionada && !estado) { borderColor = "var(--color-info)"; bg = "#0d1e2e" }
              return (
                <button key={val} onClick={() => !estado && setRespuesta(val)} disabled={!!estado}
                  className="rounded-2xl py-6 font-extrabold text-xl transition-all active:scale-95"
                  style={{ background: bg, border: `2px solid ${borderColor}` }}>
                  {val === "true" ? "✅ Verdadero" : "❌ Falso"}
                </button>
              )
            })}
          </div>
        )}

        {leccion.tipo_ejercicio === "completar_espacio" && (
          <input type="text" value={respuesta} onChange={(e) => setRespuesta(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !estado && verificar()}
            disabled={!!estado} placeholder="Escribe tu respuesta..."
            className="w-full rounded-2xl px-5 py-4 text-lg font-semibold outline-none"
            style={{ background: "var(--color-surface)", border: `2px solid ${estado === "correcto" ? "var(--color-primary)" : estado ? "var(--color-danger)" : "var(--color-border)"}`, color: "#fff" }}
          />
        )}
      </div>

      {/* Panel inferior */}
      {!estado ? (
        <div className="fixed bottom-0 left-0 right-0 px-4 py-4 max-w-2xl mx-auto w-full">
          <button onClick={verificar} disabled={!respuesta}
            className="w-full rounded-2xl py-4 font-extrabold text-lg text-white transition-all active:scale-95 disabled:opacity-40"
            style={{ background: "var(--color-primary)", boxShadow: "0 4px 0 var(--color-primary-dark)" }}>
            Verificar
          </button>
        </div>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 px-4 py-5 slide-up"
          style={{
            background: estado === "correcto"
              ? "rgba(13,46,20,0.95)"
              : "rgba(46,13,13,0.95)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderTop: `2px solid ${estado === "correcto" ? "var(--color-primary)" : "var(--color-danger)"}`,
            boxShadow: `0 -8px 32px ${estado === "correcto" ? "rgba(88,204,2,0.15)" : "rgba(255,75,75,0.15)"}`,
          }}>
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{estado === "correcto" ? "✅" : estado === "tiempo" ? "⏱️" : "❌"}</span>
              <div>
                <p className="font-extrabold text-lg">
                  {estado === "correcto" ? "¡Correcto! +10 XP" : estado === "tiempo" ? "¡Tiempo agotado!" : "Incorrecto"}
                </p>
                <p className="text-sm text-zinc-400">
                  {estado === "correcto" ? "¡Sigue así!" : "Verás la respuesta al final 📊"}
                </p>
              </div>
            </div>
            <button onClick={siguiente}
              className="w-full rounded-2xl py-4 font-extrabold text-lg text-white transition-all active:scale-95"
              style={{ background: estado === "correcto" ? "var(--color-primary)" : "var(--color-danger)", boxShadow: `0 4px 0 ${estado === "correcto" ? "var(--color-primary-dark)" : "#991b1b"}` }}>
              {indice + 1 >= lecciones.length ? "Ver resultados 📊" : "Siguiente →"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PantallaFin({ onVolver }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-4"
      style={{ background: "transparent" }}
    >
      <PageTransition className="flex flex-col items-center gap-6 text-center">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
          style={{
            background: "rgba(255,75,75,0.12)",
            border: "2px solid rgba(255,75,75,0.4)",
            boxShadow: "0 0 40px rgba(255,75,75,0.2)",
          }}
        >
          💔
        </div>
        <div>
          <h1 className="text-3xl font-extrabold mb-2">Sin vidas</h1>
          <p className="text-zinc-400 max-w-xs">
            Se recarga 1 vida cada 30 min.<br />¡Vuelve pronto!
          </p>
        </div>
        <button
          onClick={onVolver}
          className="btn-glow rounded-2xl px-10 py-4 font-extrabold text-lg text-white"
          style={{
            background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
            boxShadow: "0 4px 0 var(--color-primary-dark)",
          }}
        >
          ← Ir al inicio
        </button>
      </PageTransition>
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
