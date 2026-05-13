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
  const [respondida, setRespondida] = useState(null)
  const [resultados, setResultados] = useState([])
  const [fase, setFase] = useState("juego")
  const [esRecord, setEsRecord] = useState(false)
  const [xpGanado, setXpGanado] = useState(0)
  const [particleKey, setParticleKey] = useState(0)

  const userRef       = useRef(null)
  const resultadosRef = useRef([])
  const preguntasRef  = useRef([])
  const avanzandoRef  = useRef(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      userRef.current = user

      const [{ data: nivelesData }, { data: progresoData }] = await Promise.all([
        supabase.from("niveles").select("id").order("orden", { ascending: true }),
        supabase.from("progreso_nivel").select("nivel_id, dificultad").eq("user_id", user.id),
      ])

      const difsPorNivel = {}
      ;(progresoData || []).forEach(p => {
        if (!difsPorNivel[p.nivel_id]) difsPorNivel[p.nivel_id] = new Set()
        difsPorNivel[p.nivel_id].add(p.dificultad)
      })

      const nivelesOrdenados = nivelesData || []
      const nivelesDesbloqueados = new Set(
        nivelesOrdenados
          .filter((n, i) => i === 0 || difsPorNivel[nivelesOrdenados[i - 1]?.id]?.has("dificil"))
          .map(n => n.id)
      )

      if (!nivelesDesbloqueados.size) { setLoading(false); return }

      const { data: todas } = await supabase
        .from("nivel_preguntas")
        .select("id, nivel_id, pregunta, opciones, respuesta_correcta, tipo")
        .in("tipo", ["multiple_choice", "verdadero_falso"])
        .in("nivel_id", [...nivelesDesbloqueados])

      if (!todas?.length) { setLoading(false); return }

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

  useEffect(() => {
    if (tiempo <= 0 && respondida === null && fase === "juego" && preguntas.length > 0 && !avanzandoRef.current) {
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
      const { data: p } = await supabase.from("users").select("xp_total").eq("id", userRef.current.id).single()
      if (p) {
        await supabase.from("users").update({ xp_total: (p.xp_total ?? 0) + xp }).eq("id", userRef.current.id)
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

  if (loading) return <LoadingConti texto="Preparando desafío..." />

  if (!preguntas.length) {
    return (
      <div className="qs">
        <div className="qs-bg-orb qs-bg-orb-1" />
        <div className="qs-bg-orb qs-bg-orb-2" />
        <Navbar />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, minHeight: "80vh", textAlign: "center", padding: "0 20px" }}>
          <p style={{ fontSize: 48 }}>📭</p>
          <p style={{ fontWeight: 700 }}>Sin preguntas disponibles todavía</p>
          <button onClick={() => router.push("/niveles")} style={{ padding: "10px 24px", borderRadius: 12, fontWeight: 700, fontSize: 14, background: "var(--accent-green)", color: "#000", border: "none", cursor: "pointer" }}>
            Volver
          </button>
        </div>
      </div>
    )
  }

  if (fase === "resultados") {
    const correctas = resultados.filter(Boolean).length
    const total     = preguntas.length
    const pct       = Math.round((correctas / total) * 100)
    const bestActual = parseInt(localStorage.getItem(BEST_KEY) || "0", 10)

    return (
      <div className="qs scr-resultados">
        <div className="qs-bg-orb qs-bg-orb-1" />
        <div className="qs-bg-orb qs-bg-orb-2" />
        {esRecord && <Particles key={particleKey} preset="rankUp" />}

        <div className="scr-scroll">
          <div className="res-hero">
            <div className="res-confetti">
              <span style={{ left: "10%", animationDelay: "0s" }}>⚡</span>
              <span style={{ left: "35%", animationDelay: "0.2s" }}>✦</span>
              <span style={{ left: "65%", animationDelay: "0.1s" }}>⚡</span>
              <span style={{ left: "85%", animationDelay: "0.4s" }}>✦</span>
            </div>
            <div className="res-title">{pct >= 80 ? "🏆 ¡Dominado!" : pct >= 60 ? "⭐ ¡Bien hecho!" : "📚 Sigue practicando"}</div>
            <div className="res-sub">Modo Desafío · {pct}% de acierto</div>

            <div className="res-score-row">
              <div className="res-score-card">
                <div className="res-score-big">{correctas}<span>/{total}</span></div>
                <div className="res-score-lbl">Correctas</div>
              </div>
              <div className="res-score-card xp">
                <div className="res-score-big res-xp-big">
                  <span className="res-xp-plus">+</span>{xpGanado}
                </div>
                <div className="res-score-lbl">XP ganado</div>
              </div>
              <div className="res-score-card combo">
                <div className="res-score-big">{bestActual}<span>/{total}</span></div>
                <div className="res-score-lbl">Récord</div>
              </div>
            </div>

            {esRecord && (
              <div className="res-progression">
                <span className="res-prog-ico">🥇</span>
                <span><b>¡Nuevo récord personal!</b></span>
              </div>
            )}
          </div>

          {/* Detalle */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 2px" }}>
            {resultados.map((ok, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: ok ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)", border: `1px solid ${ok ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}` }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{ok ? "✅" : "❌"}</span>
                <p style={{ fontSize: 12.5, color: "var(--text-2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preguntas[i]?.pregunta}</p>
              </div>
            ))}
          </div>

          <div className="res-actions">
            <button className="res-btn res-btn-secondary" onClick={() => window.location.reload()}>Repetir</button>
            <button className="res-btn res-btn-primary" onClick={() => router.push("/niveles")}>← Niveles</button>
          </div>

          <div className="dash-bottom-spacer" />
        </div>

        <Navbar />
      </div>
    )
  }

  // Game phase
  const pregunta = preguntas[indice]
  const opciones  = pregunta.tipo === "verdadero_falso"
    ? ["true", "false"]
    : (Array.isArray(pregunta.opciones) ? pregunta.opciones : JSON.parse(pregunta.opciones || "[]"))

  const pctTimer = (tiempo / TIEMPO_PREGUNTA) * 100
  const barColor  = tiempo > 8 ? "#22c55e" : tiempo > 4 ? "#fbbf24" : "#ef4444"

  return (
    <div className="qs">
      <div className="qs-bg-orb qs-bg-orb-1" style={{ "--orb-color": barColor }} />
      <div className="qs-bg-orb qs-bg-orb-2" />

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", padding: "16px 20px 0", maxWidth: 640, margin: "0 auto" }}>

        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 14 }}>
          <button
            onClick={() => router.push("/niveles")}
            style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-2)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-gold)" }}>⚡ Modo Desafío</span>
              <span style={{ fontSize: 13, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: barColor }}>{Math.ceil(tiempo)}s</span>
            </div>
            <div style={{ height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ height: "100%", width: `${pctTimer}%`, background: barColor, boxShadow: `0 0 10px ${barColor}66`, transition: "width 0.1s linear, background 0.3s ease", borderRadius: 999 }} />
            </div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-2)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
            {indice + 1}/{preguntas.length}
          </span>
        </header>

        {/* Question card */}
        <div style={{ position: "relative", background: "#f8fafc", borderRadius: 22, padding: "22px 22px 18px", boxShadow: "0 24px 60px -20px rgba(0,0,0,0.55)", overflow: "hidden", marginBottom: 16 }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${barColor}, #06b6d4)` }} />
          <p style={{ fontSize: 18, lineHeight: 1.35, fontWeight: 700, color: "#0b1326", margin: 0 }}>{pregunta.pregunta}</p>
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {opciones.map(opcion => {
            let borderColor = "rgba(255,255,255,0.14)"
            let bgColor     = "#14213d"
            let textColor   = "#f1f5fb"

            if (respondida) {
              if (opcion === pregunta.respuesta_correcta) { borderColor = "#22c55e"; bgColor = "rgba(34,197,94,0.12)"; textColor = "#86efac" }
              else if (opcion === respondida.opcion && !respondida.correcto) { borderColor = "#ef4444"; bgColor = "rgba(239,68,68,0.1)"; textColor = "#fca5a5" }
            }

            return (
              <button
                key={opcion}
                onClick={() => responder(opcion)}
                disabled={!!respondida}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: bgColor, border: `1.5px solid ${borderColor}`, borderRadius: 16, color: textColor, cursor: respondida ? "default" : "pointer", textAlign: "left", fontFamily: "inherit", fontSize: 14.5, fontWeight: 600, transition: "all 0.18s", boxShadow: "0 3px 0 rgba(0,0,0,0.25)" }}
              >
                {mostrarOpcion(opcion)}
              </button>
            )
          })}
        </div>

        {respondida?.timeout && (
          <p style={{ textAlign: "center", fontSize: 12, fontWeight: 800, marginTop: 16, color: "#ef4444" }}>⏱ ¡Tiempo agotado!</p>
        )}
      </div>
    </div>
  )
}
