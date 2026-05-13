"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"
import Navbar from "../../components/Navbar"
import LoadingConti from "../../components/LoadingConti"
import Particles from "../../components/Particles"
import { sound } from "../../lib/audio"

const TIEMPO_PREGUNTA = 15
const TOTAL = 10
const XP_POR_CORRECTA = 10
const BEST_KEY = "cl_desafio_best"

function mostrarOpcion(val) {
  if (val === "true")  return "Verdadero"
  if (val === "false") return "Falso"
  return val
}

export default function DesafioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [preguntas, setPreguntas] = useState([])
  const [indice, setIndice] = useState(0)
  const [tiempo, setTiempo] = useState(TIEMPO_PREGUNTA)
  const [respondida, setRespondida] = useState(null)  // null | { opcion, correcto, timeout? }
  const [resultados, setResultados] = useState([])    // booleans
  const [fase, setFase] = useState("juego")           // "juego" | "resultados"
  const [esRecord, setEsRecord] = useState(false)
  const [xpGanado, setXpGanado] = useState(0)
  const [particleKey, setParticleKey] = useState(0)

  const userRef       = useRef(null)
  const resultadosRef = useRef([])   // ref para evitar stale closures en timers
  const preguntasRef  = useRef([])
  const avanzandoRef  = useRef(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      userRef.current = user

      const { data: todas } = await supabase
        .from("nivel_preguntas")
        .select("id, nivel_id, pregunta, opciones, respuesta_correcta, tipo")
        .in("tipo", ["multiple_choice", "verdadero_falso"])

      if (!todas?.length) { setLoading(false); return }

      // Agrupar por nivel, tomar 2 por nivel, shuffle global, recortar a 10
      const porNivel = {}
      todas.forEach(q => {
        if (!porNivel[q.nivel_id]) porNivel[q.nivel_id] = []
        porNivel[q.nivel_id].push(q)
      })

      const pool = []
      Object.values(porNivel).forEach(qs => {
        pool.push(...[...qs].sort(() => Math.random() - 0.5).slice(0, 2))
      })

      const final = [...pool].sort(() => Math.random() - 0.5).slice(0, TOTAL)
      preguntasRef.current = final
      setPreguntas(final)
      setLoading(false)
    }
    init()
  }, [router])

  // Timer — se reinicia cuando cambia indice o se limpia cuando hay respuesta
  useEffect(() => {
    if (fase !== "juego" || loading || !preguntas.length || respondida !== null) return

    let stopped = false
    const interval = setInterval(() => {
      if (stopped) return
      setTiempo(prev => {
        const next = prev - 0.1
        if (next <= 0) { stopped = true; return 0 }
        return Math.round(next * 10) / 10
      })
    }, 100)

    return () => { stopped = true; clearInterval(interval) }
  }, [indice, respondida, fase, loading, preguntas.length])

  // Detectar tiempo agotado
  useEffect(() => {
    if (
      tiempo <= 0 &&
      respondida === null &&
      fase === "juego" &&
      preguntas.length > 0 &&
      !avanzandoRef.current
    ) {
      avanzandoRef.current = true
      sound.incorrect()
      setRespondida({ opcion: null, correcto: false, timeout: true })
      setTimeout(() => doAvanzar(false), 1200)
    }
  }, [tiempo]) // eslint-disable-line react-hooks/exhaustive-deps

  function responder(opcion) {
    if (respondida !== null || avanzandoRef.current) return
    avanzandoRef.current = true
    const pregunta = preguntasRef.current[indice]
    const correcto = opcion === pregunta.respuesta_correcta
    setRespondida({ opcion, correcto })
    correcto ? sound.correct() : sound.incorrect()
    setTimeout(() => doAvanzar(correcto), 1100)
  }

  function doAvanzar(correcto) {
    const nuevos = [...resultadosRef.current, correcto]
    resultadosRef.current = nuevos
    setResultados(nuevos)
    avanzandoRef.current = false

    if (nuevos.length >= Math.min(TOTAL, preguntasRef.current.length)) {
      terminar(nuevos)
    } else {
      setIndice(i => i + 1)
      setTiempo(TIEMPO_PREGUNTA)
      setRespondida(null)
    }
  }

  async function terminar(todos) {
    const correctas = todos.filter(Boolean).length
    const xp = correctas * XP_POR_CORRECTA
    setXpGanado(xp)

    if (userRef.current && xp > 0) {
      const { data: p } = await supabase
        .from("users").select("xp_total").eq("id", userRef.current.id).single()
      if (p) {
        await supabase.from("users")
          .update({ xp_total: (p.xp_total ?? 0) + xp })
          .eq("id", userRef.current.id)
      }
    }

    const prevBest = parseInt(localStorage.getItem(BEST_KEY) || "0", 10)
    if (correctas > prevBest) {
      localStorage.setItem(BEST_KEY, String(correctas))
      setEsRecord(true)
      setTimeout(() => { sound.rankUp(); setParticleKey(k => k + 1) }, 350)
    }

    setFase("resultados")
  }

  // ── Loading ──────────────────────────────────
  if (loading) return <LoadingConti texto="Preparando desafío..." />

  if (!preguntas.length) {
    return (
      <div className="min-h-screen pb-20 md:pt-20" style={{ background: "transparent" }}>
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <p className="text-5xl mb-4">📭</p>
          <p className="font-bold">Sin preguntas disponibles todavía</p>
          <button
            onClick={() => router.push("/niveles")}
            className="mt-6 px-6 py-3 rounded-xl font-bold text-sm"
            style={{ background: "var(--color-primary)", color: "#000" }}
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  // ── Pantalla de resultados ───────────────────
  if (fase === "resultados") {
    const correctas = resultados.filter(Boolean).length
    const total     = preguntas.length
    const pct       = Math.round((correctas / total) * 100)
    const bestActual = parseInt(localStorage.getItem(BEST_KEY) || "0", 10)

    return (
      <div className="min-h-screen pb-20 md:pt-20" style={{ background: "transparent" }}>
        <Navbar />
        {esRecord && <Particles key={particleKey} preset="rankUp" />}

        <div className="max-w-lg mx-auto px-4 py-8">

          {/* Tarjeta principal */}
          <div
            className="rounded-2xl p-7 text-center mb-5"
            style={{
              background: "var(--color-surface)",
              border: esRecord ? "1.5px solid #ffd700" : "1px solid var(--color-border)",
              boxShadow: esRecord ? "0 0 28px rgba(255,215,0,0.12)" : "none",
            }}
          >
            <div className="text-6xl mb-3">{pct >= 80 ? "🏆" : pct >= 60 ? "⭐" : "📚"}</div>
            <h1 className="text-5xl font-extrabold mb-1" style={{ color: pct >= 80 ? "#ffd700" : "white" }}>
              {correctas}<span className="text-zinc-500 text-2xl font-bold">/{total}</span>
            </h1>
            <p className="text-zinc-400 text-sm mb-4">{pct}% de acierto</p>

            {esRecord && (
              <div
                className="mb-5 px-4 py-2 rounded-xl inline-block font-bold text-sm"
                style={{ background: "rgba(255,215,0,0.12)", color: "#ffd700", border: "1px solid rgba(255,215,0,0.3)" }}
              >
                🥇 ¡Nuevo récord personal!
              </div>
            )}

            <div className="flex justify-center gap-10 mt-2">
              <div>
                <p className="text-xs text-zinc-500 mb-1">XP ganado</p>
                <p className="text-xl font-extrabold" style={{ color: "var(--color-info)" }}>+{xpGanado}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Mejor puntaje</p>
                <p className="text-xl font-extrabold" style={{ color: "#ffd700" }}>{bestActual}/{total}</p>
              </div>
            </div>
          </div>

          {/* Detalle por pregunta */}
          <div className="flex flex-col gap-2 mb-6">
            {resultados.map((ok, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl px-4 py-2.5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border)" }}
              >
                <span className="text-base flex-shrink-0">{ok ? "✅" : "❌"}</span>
                <p className="text-xs text-zinc-400 flex-1 line-clamp-1">{preguntas[i]?.pregunta}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-3 rounded-xl font-extrabold text-sm transition-all hover:brightness-110 active:scale-95"
              style={{ background: "var(--color-primary)", color: "#000" }}
            >
              🔄 Repetir
            </button>
            <button
              onClick={() => router.push("/niveles")}
              className="flex-1 py-3 rounded-xl font-extrabold text-sm transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--color-border)", color: "white" }}
            >
              ← Niveles
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Fase juego ───────────────────────────────
  const pregunta = preguntas[indice]
  const opciones  = pregunta.tipo === "verdadero_falso"
    ? ["true", "false"]
    : (Array.isArray(pregunta.opciones)
        ? pregunta.opciones
        : JSON.parse(pregunta.opciones || "[]"))

  const pctTimer = (tiempo / TIEMPO_PREGUNTA) * 100
  const barColor  = tiempo > 8 ? "#58cc02" : tiempo > 4 ? "#ffc800" : "#ff4b4b"

  return (
    <div className="min-h-screen pb-20 md:pt-20" style={{ background: "transparent" }}>
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Header con barra de tiempo */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => router.push("/niveles")}
            className="text-zinc-400 hover:text-white text-xl flex-shrink-0 transition-colors"
          >
            ←
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">⚡ Modo Desafío</span>
              <span className="text-sm font-extrabold tabular-nums" style={{ color: barColor }}>
                {Math.ceil(tiempo)}s
              </span>
            </div>
            <div className="w-full rounded-full h-3" style={{ background: "#0d1a20" }}>
              <div
                className="h-3 rounded-full"
                style={{
                  width: `${pctTimer}%`,
                  background: barColor,
                  boxShadow: `0 0 10px ${barColor}66`,
                  transition: "width 0.1s linear, background 0.3s ease",
                }}
              />
            </div>
          </div>
          <span className="text-sm font-extrabold text-zinc-300 flex-shrink-0 tabular-nums">
            {indice + 1}/{preguntas.length}
          </span>
        </div>

        {/* Pregunta */}
        <div
          className="rounded-2xl p-6 mb-5"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <p className="text-base font-semibold leading-snug">{pregunta.pregunta}</p>
        </div>

        {/* Opciones */}
        <div className="flex flex-col gap-3">
          {opciones.map(opcion => {
            let borderColor = "var(--color-border)"
            let bgColor     = "rgba(255,255,255,0.02)"
            let textColor   = "white"

            if (respondida) {
              if (opcion === pregunta.respuesta_correcta) {
                borderColor = "var(--color-primary)"
                bgColor     = "rgba(88,204,2,0.12)"
                textColor   = "var(--color-primary)"
              } else if (opcion === respondida.opcion && !respondida.correcto) {
                borderColor = "var(--color-danger)"
                bgColor     = "rgba(239,68,68,0.08)"
                textColor   = "var(--color-danger)"
              }
            }

            return (
              <button
                key={opcion}
                onClick={() => responder(opcion)}
                disabled={!!respondida}
                className="text-left rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 hover:brightness-110 active:scale-[0.99]"
                style={{
                  background: bgColor,
                  border: `1.5px solid ${borderColor}`,
                  color: textColor,
                  cursor: respondida ? "default" : "pointer",
                }}
              >
                {mostrarOpcion(opcion)}
              </button>
            )
          })}
        </div>

        {respondida?.timeout && (
          <p className="text-center text-xs font-bold mt-4" style={{ color: "var(--color-danger)" }}>
            ⏱ ¡Tiempo agotado!
          </p>
        )}

      </div>
    </div>
  )
}
