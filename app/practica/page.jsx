"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"
import Navbar from "../../components/Navbar"
import LoadingConti from "../../components/LoadingConti"

function PracticaInner() {
  const router = useRouter()
  const params = useSearchParams()
  const nivelId = params.get("nivel")

  const [nivel, setNivel] = useState(null)
  const [loadingNivel, setLoadingNivel] = useState(true)

  const [user, setUser] = useState(null)
  const [ejercicio, setEjercicio] = useState(null)
  const [generando, setGenerando] = useState(false)
  const [seleccion, setSeleccion] = useState(null)
  const [respondido, setRespondido] = useState(false)
  const [correctas, setCorrectas] = useState(0)
  const [total, setTotal] = useState(0)
  const [preguntasAnteriores, setPreguntasAnteriores] = useState([])
  const [reportado, setReportado] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      setUser(user)

      if (nivelId) {
        const { data } = await supabase
          .from("niveles")
          .select("id, titulo, descripcion, emoji")
          .eq("id", nivelId)
          .single()
        setNivel(data)
      }
      setLoadingNivel(false)
    }
    cargar()
  }, [nivelId, router])

  useEffect(() => {
    if (!loadingNivel && nivel) generarPregunta()
  }, [loadingNivel])

  const reportarError = async () => {
    if (!ejercicio || reportado) return
    setReportado(true)
    await supabase.from("reportes_preguntas").insert([{
      pregunta_id: null,
      pregunta_texto: ejercicio.pregunta,
      respuesta_correcta: ejercicio.respuesta_correcta,
      explicacion: ejercicio.explicacion,
      reportado_por: user?.id,
    }])
  }

  const generarPregunta = async () => {
    setGenerando(true)
    setEjercicio(null)
    setSeleccion(null)
    setRespondido(false)
    setReportado(false)

    try {
      const res = await fetch("/api/generar-ejercicio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nivelNombre: nivel?.titulo ?? "",
          nivelDescripcion: nivel?.descripcion ?? "",
          preguntasAnteriores,
        }),
      })
      const data = await res.json()
      if (data.ejercicio) {
        setEjercicio(data.ejercicio)
        setPreguntasAnteriores(prev => [...prev, data.ejercicio.pregunta])
      }
    } catch {
      setEjercicio(null)
    } finally {
      setGenerando(false)
    }
  }

  const responder = (opcion) => {
    if (respondido) return
    setSeleccion(opcion)
    setRespondido(true)
    setTotal(t => t + 1)
    if (opcion === ejercicio.respuesta_correcta) setCorrectas(c => c + 1)
  }

  const esCorrecta = (opcion) => opcion === ejercicio?.respuesta_correcta
  const esSeleccionada = (opcion) => opcion === seleccion

  if (loadingNivel) {
    return <><Navbar /><LoadingConti texto="Cargando práctica..." /></>
  }

  return (
    <div className="min-h-screen flex flex-col md:pt-20" style={{ background: "transparent" }}>
      <Navbar />

      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-4 py-4">

        {/* Header */}
        <div
          className="rounded-2xl p-4 mb-4 flex items-center gap-3"
          style={{
            background: "rgba(124,58,237,0.12)",
            border: "1.5px solid rgba(124,58,237,0.3)",
          }}
        >
          <button
            onClick={() => router.back()}
            className="text-zinc-400 hover:text-white transition-colors text-xl flex-shrink-0"
          >
            ←
          </button>
          <div className="text-2xl">{nivel?.emoji || "🎯"}</div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-purple-400">Práctica extra · Sin XP</p>
            <h1 className="text-base font-extrabold text-white">{nivel?.titulo || "Práctica"}</h1>
          </div>
          {total > 0 && (
            <div className="text-right flex-shrink-0">
              <p className="text-xl font-extrabold text-white">{correctas}/{total}</p>
              <p className="text-xs text-zinc-400">correctas</p>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="flex-1 flex flex-col justify-center">

          {generando && (
            <div className="flex flex-col items-center gap-4 py-16">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: "rgba(124,58,237,0.2)", border: "1.5px solid rgba(124,58,237,0.4)" }}
              >
                🤖
              </div>
              <p className="text-zinc-400 text-sm">Generando pregunta...</p>
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-purple-400 inline-block"
                    style={{ animation: `bounce 1s infinite ${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {!generando && ejercicio && (
            <div className="flex flex-col gap-4">
              {/* Pregunta */}
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1.5px solid rgba(255,255,255,0.1)",
                }}
              >
                <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-3">
                  Ejercicio de práctica
                </p>
                <p className="text-white font-semibold text-base leading-relaxed">
                  {ejercicio.pregunta}
                </p>
              </div>

              {/* Opciones */}
              <div className="flex flex-col gap-2">
                {ejercicio.opciones.map((opcion, i) => {
                  let borderColor = "rgba(255,255,255,0.1)"
                  let bg = "rgba(255,255,255,0.04)"
                  let color = "#d1d5db"

                  if (respondido) {
                    if (esCorrecta(opcion)) {
                      borderColor = "#22c55e"
                      bg = "rgba(34,197,94,0.12)"
                      color = "#86efac"
                    } else if (esSeleccionada(opcion) && !esCorrecta(opcion)) {
                      borderColor = "#ef4444"
                      bg = "rgba(239,68,68,0.12)"
                      color = "#fca5a5"
                    }
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => responder(opcion)}
                      disabled={respondido}
                      className="text-left rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 flex items-center gap-3"
                      style={{
                        background: bg,
                        border: `1.5px solid ${borderColor}`,
                        color,
                        cursor: respondido ? "default" : "pointer",
                      }}
                    >
                      <span
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                      >
                        {["A", "B", "C", "D"][i]}
                      </span>
                      {opcion}
                    </button>
                  )
                })}
              </div>

              {/* Explicación post-respuesta */}
              {respondido && (
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: esCorrecta(seleccion) ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                    border: `1.5px solid ${esCorrecta(seleccion) ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                  }}
                >
                  <p className="font-bold text-sm mb-1" style={{ color: esCorrecta(seleccion) ? "#86efac" : "#fca5a5" }}>
                    {esCorrecta(seleccion) ? "✅ ¡Correcto!" : "❌ Incorrecto"}
                  </p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{ejercicio.explicacion}</p>
                </div>
              )}

              {/* Botón siguiente */}
              {respondido && (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={generarPregunta}
                    className="w-full py-3 rounded-2xl font-extrabold text-white text-sm transition-all active:scale-95"
                    style={{
                      background: "rgba(124,58,237,0.8)",
                      border: "1.5px solid rgba(124,58,237,0.6)",
                      boxShadow: "0 4px 0 rgba(109,40,217,0.6)",
                    }}
                  >
                    Siguiente pregunta →
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

          {!generando && !ejercicio && (
            <div className="flex flex-col items-center gap-4 py-16">
              <p className="text-zinc-500 text-sm">No se pudo generar la pregunta.</p>
              <button
                onClick={generarPregunta}
                className="px-6 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: "rgba(124,58,237,0.2)", color: "#c084fc", border: "1.5px solid rgba(124,58,237,0.4)" }}
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  )
}

export default function PracticaPage() {
  return (
    <Suspense fallback={<LoadingConti texto="Cargando práctica..." />}>
      <PracticaInner />
    </Suspense>
  )
}
