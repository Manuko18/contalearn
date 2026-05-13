"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"
import Navbar from "../../components/Navbar"
import LoadingConti from "../../components/LoadingConti"
import { checkNewAchievements } from "../../lib/achievements"
import AchievementToast from "../../components/AchievementToast"

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
               "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

const TITULOS = [
  { desde: 0,  titulo: null,           badge: null },
  { desde: 1,  titulo: "Contador Jr.", badge: "📋" },
  { desde: 3,  titulo: "Contador",     badge: "📊" },
  { desde: 6,  titulo: "Contador Sr.", badge: "💼" },
  { desde: 10, titulo: "CFO",          badge: "👔" },
]

function getTitulo(mes) {
  return [...TITULOS].reverse().find(t => mes >= t.desde) || TITULOS[0]
}

const CORRECTAS_POR_MES = 5

function EmpresaInner() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)

  const [caso, setCaso] = useState(() => {
    if (typeof window === "undefined") return null
    try { return JSON.parse(localStorage.getItem("empresa_caso_actual") || "null") } catch { return null }
  })
  const [mesNombre, setMesNombre] = useState(() => {
    if (typeof window === "undefined") return ""
    return localStorage.getItem("empresa_mes_nombre") || ""
  })
  const [generando, setGenerando] = useState(false)
  const [seleccion, setSeleccion] = useState(null)
  const [respondido, setRespondido] = useState(false)

  const [mesActivo, setMesActivo] = useState(null)
  const [correctasMes, setCorrectasMes] = useState(0)
  const [fallosSegidos, setFallosSegidos] = useState(0)
  const [aciertosSegidos, setAciertosSegidos] = useState(0)
  const [dificultad, setDificultad] = useState("normal")
  const [preguntasVistasIds, setPreguntasVistasIds] = useState(() => {
    if (typeof window === "undefined") return []
    try { return JSON.parse(localStorage.getItem("empresa_vistas") || "[]") } catch { return [] }
  })
  const [preguntaActivaId, setPreguntaActivaId] = useState(null)
  const [reportado, setReportado] = useState(false)

  const [curAch, setCurAch] = useState(null)
  const [achQueue, setAchQueue] = useState([])

  useEffect(() => {
    const cargar = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push("/login"); return }
      setUser(u)
      const { data } = await supabase
        .from("users")
        .select("xp_total, racha_actual, empresa_mes, titulo_empresa")
        .eq("id", u.id)
        .single()
      setPerfil(data)
      setLoading(false)
    }
    cargar()
  }, [router])

  useEffect(() => {
    if (!loading && perfil && !caso) generarCaso()
  }, [loading])

  const cambiarMes = (nuevoMes) => {
    setMesActivo(nuevoMes)
    setPreguntasVistasIds([])
    localStorage.removeItem("empresa_vistas")
    setCorrectasMes(0)
    generarCasoConMes(nuevoMes)
  }

  const generarCaso = () => generarCasoConMes(mesActivo ?? perfil?.empresa_mes ?? 0)

  const generarCasoConMes = async (mes) => {
    setGenerando(true)
    setCaso(null)
    setSeleccion(null)
    setRespondido(false)
    localStorage.removeItem("empresa_caso_actual")

    try {
      const res = await fetch("/api/empresa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes, preguntasVistasIds, dificultad }),
      })
      const data = await res.json()
      if (data.caso) {
        setCaso(data.caso)
        setMesNombre(data.mes)
        setPreguntaActivaId(data.id || null)
        setReportado(false)
        localStorage.setItem("empresa_caso_actual", JSON.stringify(data.caso))
        localStorage.setItem("empresa_mes_nombre", data.mes)
        if (data.id) setPreguntasVistasIds(prev => {
          const nuevas = [...prev, data.id]
          localStorage.setItem("empresa_vistas", JSON.stringify(nuevas))
          return nuevas
        })
      }
    } catch {
      setCaso(null)
    } finally {
      setGenerando(false)
    }
  }

  const responder = async (opcion) => {
    if (respondido || !user || !perfil) return
    setSeleccion(opcion)
    setRespondido(true)

    const esCorrecta = opcion === caso.respuesta_correcta

    if (!esCorrecta) {
      const nuevosFallos = fallosSegidos + 1
      setFallosSegidos(nuevosFallos)
      setAciertosSegidos(0)
      if (nuevosFallos >= 2 && dificultad === "normal") setDificultad("facil")
      if (nuevosFallos >= 3 && dificultad === "dificil") setDificultad("normal")
      return
    }

    const nuevosAciertos = aciertosSegidos + 1
    setAciertosSegidos(nuevosAciertos)
    setFallosSegidos(0)
    if (nuevosAciertos >= 3 && dificultad === "facil") setDificultad("normal")
    if (nuevosAciertos >= 6 && dificultad === "normal") setDificultad("dificil")

    const mesJugando = mesActivo ?? perfil?.empresa_mes ?? 0
    const esRepaso = mesJugando < (perfil?.empresa_mes ?? 0)
    const nuevasCorrectas = correctasMes + 1
    setCorrectasMes(nuevasCorrectas)

    if (esRepaso) return

    const nuevoXp = (perfil.xp_total || 0) + 5
    let nuevoMes = perfil.empresa_mes || 0
    let nuevoTitulo = perfil.titulo_empresa

    if (nuevasCorrectas >= CORRECTAS_POR_MES) {
      nuevoMes = nuevoMes + 1
      setCorrectasMes(0)
      const tituloInfo = getTitulo(nuevoMes)
      if (tituloInfo.titulo) nuevoTitulo = `${tituloInfo.badge} ${tituloInfo.titulo}`
    }

    await supabase.from("users").update({
      xp_total: nuevoXp,
      empresa_mes: nuevoMes,
      titulo_empresa: nuevoTitulo,
    }).eq("id", user.id)

    setPerfil(prev => ({ ...prev, xp_total: nuevoXp, empresa_mes: nuevoMes, titulo_empresa: nuevoTitulo }))

    const newAchs = checkNewAchievements({
      xp: nuevoXp,
      racha: perfil.racha_actual || 0,
      maxCombo: 0,
      perfectSessions: 0,
      cleanSessions: 0,
      empresaMes: nuevoMes,
    })
    if (newAchs.length > 0) {
      setCurAch(newAchs[0])
      setAchQueue(newAchs.slice(1))
    }
  }

  const reportarError = async () => {
    if (!caso || reportado) return
    setReportado(true)
    await fetch("/api/reportar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pregunta_id: preguntaActivaId,
        pregunta_texto: caso.situacion + " " + caso.pregunta,
        respuesta_correcta: caso.respuesta_correcta,
        explicacion: caso.explicacion,
        reportado_por: user?.id,
      }),
    })
  }

  const esCorrecta = (op) => op === caso?.respuesta_correcta
  const esSeleccionada = (op) => op === seleccion
  const mes = perfil?.empresa_mes ?? 0
  const mesJugando = mesActivo ?? mes
  const esRepaso = mesJugando < mes
  const tituloActual = getTitulo(mes)
  const progresoMes = Math.min(Math.round((correctasMes / CORRECTAS_POR_MES) * 100), 100)

  if (loading) return <><Navbar /><LoadingConti texto="Cargando empresa..." /></>

  return (
    <div className="qs scr-empresa">
      <div className="qs-bg-orb qs-bg-orb-1" />
      <div className="qs-bg-orb qs-bg-orb-2" />

      <header className="scr-header">
        <button className="scr-back" onClick={() => router.push("/")}>←</button>
        <div className="scr-title">Modo Empresa</div>
        <div className={`scr-hdr-chip emp-chip`}>
          <span>{tituloActual.badge || "🏢"}</span>
          <span>{tituloActual.titulo || "Empresa"}</span>
        </div>
      </header>

      <div className="scr-scroll">
        {/* Mes bar */}
        <div className="emp-mes-bar">
          <div className="emp-mes-info">
            <div className="emp-mes-lbl">MES {mes + 1} · {MESES[mes % 12].toUpperCase()}</div>
            <div className="emp-mes-co">Distribuidora Andes S.A.</div>
          </div>
          <div className="emp-mes-progress">
            <div className="emp-mes-track">
              <div className="emp-mes-fill" style={{ width: `${progresoMes}%` }} />
            </div>
            <span>{progresoMes}%</span>
          </div>
        </div>

        {/* Selector meses anteriores */}
        {mes > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            {Array.from({ length: mes }, (_, i) => (
              <button
                key={i}
                onClick={() => cambiarMes(i)}
                style={{
                  fontSize: 11, padding: "4px 10px", borderRadius: 999, fontWeight: 700,
                  background: mesJugando === i ? "rgba(6,182,212,0.2)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${mesJugando === i ? "rgba(6,182,212,0.5)" : "rgba(255,255,255,0.1)"}`,
                  color: mesJugando === i ? "#67e8f9" : "var(--text-3)",
                  cursor: "pointer",
                }}
              >
                {MESES[i % 12]}
              </button>
            ))}
            <button
              onClick={() => cambiarMes(mes)}
              style={{
                fontSize: 11, padding: "4px 10px", borderRadius: 999, fontWeight: 700,
                background: mesJugando === mes ? "rgba(6,182,212,0.2)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${mesJugando === mes ? "rgba(6,182,212,0.5)" : "rgba(255,255,255,0.1)"}`,
                color: mesJugando === mes ? "#67e8f9" : "var(--text-3)",
                cursor: "pointer",
              }}
            >
              {MESES[mes % 12]} ← actual
            </button>
          </div>
        )}

        {/* Difficulty indicator */}
        <div className="emp-diff-row">
          <div className="emp-diff-label">Dificultad adaptativa</div>
          <div className="emp-diff-bar">
            <div className={`emp-diff-step ${dificultad !== "facil" ? "past" : "cur"}`}>
              <span className="emp-diff-dot" /><span>Fácil</span>
            </div>
            <div className={`emp-diff-step ${dificultad === "normal" ? "cur" : dificultad === "dificil" ? "past" : ""}`}>
              <span className="emp-diff-dot" /><span>Normal</span>
            </div>
            <div className={`emp-diff-step ${dificultad === "dificil" ? "cur" : ""}`}>
              <span className="emp-diff-dot" /><span>Difícil</span>
            </div>
          </div>
          <div className="emp-diff-meta">
            <span className="emp-diff-streak">🔥 {aciertosSegidos} correctas</span>
            {dificultad === "facil" && <span>· 3 más para Normal</span>}
            {dificultad === "normal" && <span>· 6 más para Difícil</span>}
          </div>
        </div>

        {/* Content */}
        {generando && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 40, animation: "pulse 1.5s infinite" }}>🏢</div>
            <p style={{ color: "var(--text-3)", fontSize: 14, marginTop: 12 }}>
              Generando situación de {mesNombre || MESES[mes % 12]}...
            </p>
          </div>
        )}

        {!generando && caso && (
          <>
            {/* Narrative */}
            <div className="emp-narrative">
              <div className="emp-narrative-tag">📅 {mesNombre || MESES[mes % 12]} — Situación del mes</div>
              <div className="emp-narrative-body">{caso.situacion}</div>
              {caso.monto && (
                <div className="emp-narrative-meta">
                  <span className="emp-narrative-chip">💵 {caso.monto}</span>
                  {esRepaso && <span className="emp-narrative-chip">📚 Repaso · sin XP</span>}
                </div>
              )}
            </div>

            {/* Question */}
            <div className="emp-question">{caso.pregunta}</div>

            {/* Options */}
            <div className="emp-options">
              {caso.opciones.map((op, i) => {
                let extraStyle = {}
                if (respondido) {
                  if (esCorrecta(op)) extraStyle = { borderColor: "#22c55e", background: "rgba(34,197,94,0.12)", color: "#86efac" }
                  else if (esSeleccionada(op)) extraStyle = { borderColor: "#ef4444", background: "rgba(239,68,68,0.12)", color: "#fca5a5" }
                }
                return (
                  <button
                    key={i}
                    className="emp-option"
                    onClick={() => responder(op)}
                    disabled={respondido}
                    style={{ cursor: respondido ? "default" : "pointer", ...extraStyle }}
                  >
                    <span className="qs-option-letter">{["A","B","C","D"][i]}</span>
                    <span className="qs-option-text">{op}</span>
                    <span className="qs-option-arrow">→</span>
                  </button>
                )
              })}
            </div>

            {/* Feedback */}
            {respondido && (
              <div
                style={{
                  background: esCorrecta(seleccion) ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                  border: `1.5px solid ${esCorrecta(seleccion) ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                  borderRadius: 14, padding: "12px 14px",
                }}
              >
                <p style={{ fontWeight: 800, fontSize: 14, marginBottom: 6, color: esCorrecta(seleccion) ? "#86efac" : "#fca5a5" }}>
                  {esCorrecta(seleccion) ? "✅ ¡Correcto! +5 XP" : "❌ Incorrecto — sin XP"}
                </p>
                <p style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--text-2)" }}>{caso.explicacion}</p>
              </div>
            )}

            {respondido && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  onClick={generarCaso}
                  style={{
                    padding: "12px", borderRadius: 14, fontWeight: 800, fontSize: 14,
                    background: "var(--accent-cyan)", color: "#000", border: "none",
                    cursor: "pointer", boxShadow: "0 4px 0 rgba(0,120,140,0.5)",
                  }}
                >
                  Siguiente situación →
                </button>
                <button
                  onClick={reportarError}
                  disabled={reportado}
                  style={{
                    padding: "8px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                    background: reportado ? "rgba(239,68,68,0.05)" : "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: reportado ? "var(--text-3)" : "#f87171",
                    cursor: reportado ? "default" : "pointer",
                  }}
                >
                  {reportado ? "✓ Reportado" : "⚠️ Reportar pregunta incorrecta"}
                </button>
              </div>
            )}
          </>
        )}

        {!generando && !caso && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ color: "var(--text-3)", fontSize: 13, marginBottom: 16 }}>No se pudo generar la situación.</p>
            <button
              onClick={generarCaso}
              style={{
                padding: "10px 20px", borderRadius: 12, fontWeight: 700, fontSize: 13,
                background: "rgba(6,182,212,0.15)", color: "var(--accent-cyan)",
                border: "1.5px solid rgba(6,182,212,0.35)", cursor: "pointer",
              }}
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Titulos */}
        <div className="emp-titulos">
          <div className="emp-titulos-hdr">Tu carrera</div>
          <div className="emp-titulos-row">
            {TITULOS.slice(1).map((t) => {
              const done = mes >= (t.desde + (TITULOS[TITULOS.indexOf(t) + 1]?.desde ?? 99) - t.desde)
              const active = tituloActual.titulo === t.titulo
              return (
                <div key={t.titulo} className={`emp-titulo${active ? " active" : ""}${mes >= (TITULOS[TITULOS.indexOf(t) + 1]?.desde ?? 999) ? " done" : ""}`}>
                  <span>{t.badge}</span>
                  <span className="emp-titulo-name" style={{ fontSize: 11 }}>{t.titulo}</span>
                  {mes >= (TITULOS[TITULOS.indexOf(t) + 1]?.desde ?? 999) && <span className="emp-titulo-tick">✓</span>}
                </div>
              )
            })}
          </div>
        </div>

        <div className="dash-bottom-spacer" />
      </div>

      <AchievementToast
        achievement={curAch}
        onDone={() => {
          if (achQueue.length > 0) { setCurAch(achQueue[0]); setAchQueue(achQueue.slice(1)) }
          else setCurAch(null)
        }}
      />

      <Navbar />
    </div>
  )
}

export default function EmpresaPage() {
  return (
    <Suspense fallback={<LoadingConti texto="Cargando empresa..." />}>
      <EmpresaInner />
    </Suspense>
  )
}
