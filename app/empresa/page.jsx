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
        body: JSON.stringify({
          mes,
          preguntasVistasIds,
        }),
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
    if (!esCorrecta) return

    const mesJugando = mesActivo ?? perfil?.empresa_mes ?? 0
    const esRepaso = mesJugando < (perfil?.empresa_mes ?? 0)
    const nuevasCorrectas = correctasMes + 1
    setCorrectasMes(nuevasCorrectas)

    if (esRepaso) return // Mes ya completado — sin XP ni avance

    // +5 XP solo en el mes actual
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

    // Chequear logros
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
    await supabase.from("reportes_preguntas").insert([{
      pregunta_id: preguntaActivaId,
      pregunta_texto: caso.situacion + " " + caso.pregunta,
      respuesta_correcta: caso.respuesta_correcta,
      explicacion: caso.explicacion,
      reportado_por: user?.id,
    }])
  }

  const esCorrecta = (op) => op === caso?.respuesta_correcta
  const esSeleccionada = (op) => op === seleccion
  const mes = perfil?.empresa_mes ?? 0
  const mesJugando = mesActivo ?? mes
  const esRepaso = mesJugando < mes
  const tituloActual = getTitulo(mes)
  const progresoMes = Math.min((correctasMes / CORRECTAS_POR_MES) * 100, 100)

  if (loading) return <><Navbar /><LoadingConti texto="Cargando empresa..." /></>

  return (
    <div className="min-h-screen flex flex-col md:pt-20" style={{ background: "transparent" }}>
      <Navbar />

      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-4 py-4">

        {/* Header empresa */}
        <div
          className="rounded-2xl p-4 mb-4"
          style={{ background: "rgba(234,179,8,0.1)", border: "1.5px solid rgba(234,179,8,0.3)" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => router.back()} className="text-zinc-400 hover:text-white text-xl">←</button>
            <div className="text-2xl">🏢</div>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-yellow-400">Modo Empresa</p>
              <h1 className="text-base font-extrabold text-white">Distribuidora Andes S.A.</h1>
              <p className="text-xs text-zinc-400">
                {tituloActual.titulo
                  ? `${tituloActual.badge} ${tituloActual.titulo} · Mes ${mes + 1}`
                  : `Mes ${mes + 1} — ${MESES[mes % 12]}`}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              {esRepaso ? (
                <>
                  <p className="text-sm font-bold text-zinc-500">Repaso</p>
                  <p className="text-xs text-zinc-600">Sin XP</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-extrabold text-yellow-400">+5 XP</p>
                  <p className="text-xs text-zinc-500">por acierto</p>
                </>
              )}
            </div>
          </div>

          {/* Selector meses anteriores */}
          {mes > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {Array.from({ length: mes }, (_, i) => (
                <button
                  key={i}
                  onClick={() => cambiarMes(i)}
                  className="text-xs px-2.5 py-1 rounded-lg font-bold transition-all"
                  style={{
                    background: mesJugando === i ? "rgba(234,179,8,0.25)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${mesJugando === i ? "rgba(234,179,8,0.6)" : "rgba(255,255,255,0.1)"}`,
                    color: mesJugando === i ? "#fbbf24" : "#6b7280",
                  }}
                >
                  {MESES[i % 12]}
                </button>
              ))}
              <button
                onClick={() => cambiarMes(mes)}
                className="text-xs px-2.5 py-1 rounded-lg font-bold transition-all"
                style={{
                  background: mesJugando === mes ? "rgba(234,179,8,0.25)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${mesJugando === mes ? "rgba(234,179,8,0.6)" : "rgba(255,255,255,0.1)"}`,
                  color: mesJugando === mes ? "#fbbf24" : "#6b7280",
                }}
              >
                {MESES[mes % 12]} ← actual
              </button>
            </div>
          )}

          {/* Progreso del mes */}
          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Progreso {MESES[mes % 12]}</span>
              <span>{correctasMes}/{CORRECTAS_POR_MES} correctas</span>
            </div>
            <div className="w-full rounded-full h-1.5" style={{ background: "rgba(0,0,0,0.3)" }}>
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progresoMes}%`, background: "#eab308", boxShadow: "0 0 8px #eab30888" }}
              />
            </div>
            {correctasMes >= CORRECTAS_POR_MES && (
              <p className="text-xs text-yellow-400 font-bold mt-1 text-center">¡Mes completado! Avanzaste al siguiente 🎉</p>
            )}
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 flex flex-col justify-center">

          {generando && (
            <div className="flex flex-col items-center gap-4 py-16">
              <div className="text-4xl animate-pulse">🏢</div>
              <p className="text-zinc-400 text-sm">Generando situación de {mesNombre || MESES[mes % 12]}...</p>
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-2 h-2 rounded-full bg-yellow-400 inline-block"
                    style={{ animation: `bounce 1s infinite ${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          )}

          {!generando && caso && (
            <div className="flex flex-col gap-4">
              {/* Situación */}
              <div
                className="rounded-2xl p-5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.1)" }}
              >
                <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-2">
                  📅 {mesNombre} — Situación del mes
                </p>
                <p className="text-zinc-300 text-sm leading-relaxed mb-3">{caso.situacion}</p>
                <p className="text-white font-semibold text-base">{caso.pregunta}</p>
              </div>

              {/* Opciones */}
              <div className="flex flex-col gap-2">
                {caso.opciones.map((op, i) => {
                  let borderColor = "rgba(255,255,255,0.1)"
                  let bg = "rgba(255,255,255,0.04)"
                  let color = "#d1d5db"

                  if (respondido) {
                    if (esCorrecta(op)) { borderColor = "#22c55e"; bg = "rgba(34,197,94,0.12)"; color = "#86efac" }
                    else if (esSeleccionada(op)) { borderColor = "#ef4444"; bg = "rgba(239,68,68,0.12)"; color = "#fca5a5" }
                  }

                  return (
                    <button key={i} onClick={() => responder(op)} disabled={respondido}
                      className="text-left rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 flex items-center gap-3"
                      style={{ background: bg, border: `1.5px solid ${borderColor}`, color, cursor: respondido ? "default" : "pointer" }}
                    >
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: "rgba(255,255,255,0.06)" }}>
                        {["A", "B", "C", "D"][i]}
                      </span>
                      {op}
                    </button>
                  )
                })}
              </div>

              {/* Feedback */}
              {respondido && (
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: esCorrecta(seleccion) ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                    border: `1.5px solid ${esCorrecta(seleccion) ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                  }}
                >
                  <p className="font-bold text-sm mb-1" style={{ color: esCorrecta(seleccion) ? "#86efac" : "#fca5a5" }}>
                    {esCorrecta(seleccion) ? "✅ ¡Correcto! +5 XP" : "❌ Incorrecto — sin XP"}
                  </p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{caso.explicacion}</p>
                </div>
              )}

              {respondido && (
                <div className="flex flex-col gap-2">
                  <button onClick={generarCaso}
                    className="w-full py-3 rounded-2xl font-extrabold text-white text-sm transition-all active:scale-95"
                    style={{ background: "rgba(234,179,8,0.8)", border: "1.5px solid rgba(234,179,8,0.6)", boxShadow: "0 4px 0 rgba(180,130,0,0.6)", color: "#000" }}
                  >
                    Siguiente situación →
                  </button>
                  <button onClick={reportarError} disabled={reportado}
                    className="w-full py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: reportado ? "rgba(239,68,68,0.05)" : "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      color: reportado ? "#6b7280" : "#f87171",
                    }}
                  >
                    {reportado ? "✓ Reportado — lo revisaré" : "⚠️ Reportar pregunta incorrecta"}
                  </button>
                </div>
              )}
            </div>
          )}

          {!generando && !caso && (
            <div className="flex flex-col items-center gap-4 py-16">
              <p className="text-zinc-500 text-sm">No se pudo generar la situación.</p>
              <button onClick={generarCaso}
                className="px-6 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: "rgba(234,179,8,0.2)", color: "#fbbf24", border: "1.5px solid rgba(234,179,8,0.4)" }}
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
      </div>

      <AchievementToast
        achievement={curAch}
        onDone={() => {
          if (achQueue.length > 0) { setCurAch(achQueue[0]); setAchQueue(achQueue.slice(1)) }
          else setCurAch(null)
        }}
      />

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
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
