"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"
import Navbar from "../../components/Navbar"
import LoadingConti from "../../components/LoadingConti"

function getMastered() {
  try { return new Set(JSON.parse(localStorage.getItem("cl_mastered_mistakes") || "[]")) }
  catch { return new Set() }
}
function addMastered(id) {
  const set = getMastered()
  set.add(String(id))
  localStorage.setItem("cl_mastered_mistakes", JSON.stringify([...set]))
}

export default function RepasarPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [errores, setErrores] = useState([])
  // { [id]: { opcion: string, correcto: boolean } }
  const [respondido, setRespondido] = useState({})

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      const { data: mistakes } = await supabase
        .from("user_mistakes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      // Filtrar los que ya dominó (localStorage como fallback si RLS bloquea el DELETE)
      const mastered = getMastered()
      const pendientes = (mistakes || []).filter(m => !mastered.has(String(m.id)))

      if (!pendientes.length) {
        setErrores([])
        setLoading(false)
        return
      }

      const nivelIds = [...new Set(mistakes.map(m => m.nivel_id).filter(Boolean))]

      const [{ data: niveles }, ...distResults] = await Promise.all([
        supabase.from("niveles").select("id, titulo").in("id", nivelIds),
        ...nivelIds.map(nid =>
          supabase
            .from("nivel_preguntas")
            .select("respuesta_correcta")
            .eq("nivel_id", nid)
            .limit(30)
        ),
      ])

      const nivelMap = Object.fromEntries((niveles || []).map(n => [n.id, n.titulo]))
      const distPool = Object.fromEntries(
        nivelIds.map((nid, i) => [
          nid,
          (distResults[i]?.data || []).map(p => p.respuesta_correcta).filter(Boolean),
        ])
      )

      // Calcular opciones una sola vez para evitar re-shuffle en cada render
      const erroresConOpciones = pendientes.map(m => {
        const correcta = m.respuesta_correcta
        const wrong1 = m.tu_respuesta && m.tu_respuesta !== correcta ? m.tu_respuesta : null
        const pool = (distPool[m.nivel_id] || [])
          .filter(r => r !== correcta && r !== wrong1)
        const shuffledPool = [...pool].sort(() => Math.random() - 0.5)
        const wrongs = [wrong1, ...shuffledPool].filter(Boolean).slice(0, 3)
        const opciones = [correcta, ...wrongs].sort(() => Math.random() - 0.5).slice(0, 4)
        return {
          ...m,
          opciones,
          nivelNombre: nivelMap[m.nivel_id] || `Nivel ${m.nivel_id}`,
        }
      })

      setErrores(erroresConOpciones)
      setLoading(false)
    }
    init()
  }, [router])

  const responder = async (mistake, opcionSeleccionada) => {
    if (respondido[mistake.id]) return
    const correcto = opcionSeleccionada === mistake.respuesta_correcta
    setRespondido(prev => ({ ...prev, [mistake.id]: { opcion: opcionSeleccionada, correcto } }))

    if (correcto) {
      // Marcar como dominado en localStorage inmediatamente (fallback si RLS bloquea DELETE)
      addMastered(mistake.id)
      setTimeout(async () => {
        const { error } = await supabase.from("user_mistakes").delete().eq("id", mistake.id)
        if (error) console.warn("No se pudo eliminar de BD (RLS):", error.message)
        setErrores(prev => prev.filter(e => e.id !== mistake.id))
        setRespondido(prev => {
          const next = { ...prev }
          delete next[mistake.id]
          return next
        })
      }, 1400)
    }
  }

  if (loading) return <LoadingConti texto="Cargando errores pendientes..." />

  if (!errores.length) {
    return (
      <div className="min-h-screen pb-20 md:pt-20" style={{ background: "transparent" }}>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="text-7xl mb-5">🎉</div>
          <h1 className="text-2xl font-extrabold mb-2">Sin errores pendientes</h1>
          <p className="text-zinc-400 text-sm mb-8">¡Tienes todos los conceptos dominados!</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-xl font-bold text-sm transition-all hover:brightness-110 active:scale-95"
            style={{ background: "var(--color-primary)", color: "white" }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  const pendientes = errores.filter(e => !respondido[e.id]?.correcto).length

  return (
    <div className="min-h-screen pb-20 md:pt-20" style={{ background: "transparent" }}>
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push("/")}
            className="text-zinc-400 hover:text-white text-xl transition-colors"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-extrabold">🔁 Repasar errores</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              {pendientes} pregunta{pendientes !== 1 ? "s" : ""} pendiente{pendientes !== 1 ? "s" : ""} · Sin XP · Modo estudio
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {errores.map(mistake => {
            const resp = respondido[mistake.id]

            return (
              <div
                key={mistake.id}
                className="rounded-2xl p-5 transition-all duration-300"
                style={{
                  background: "var(--color-surface)",
                  border: resp?.correcto
                    ? "1.5px solid var(--color-primary)"
                    : "1px solid var(--color-border)",
                  opacity: resp?.correcto ? 0.6 : 1,
                }}
              >
                <p className="text-xs text-zinc-500 mb-1">📘 {mistake.nivelNombre}</p>
                <p className="font-semibold text-sm leading-snug mb-4">{mistake.pregunta}</p>

                <div className="flex flex-col gap-2">
                  {mistake.opciones.map(opcion => {
                    let borderColor = "var(--color-border)"
                    let bgColor = "rgba(255,255,255,0.02)"
                    let textColor = "white"

                    if (resp) {
                      if (opcion === mistake.respuesta_correcta) {
                        borderColor = "var(--color-primary)"
                        bgColor = "rgba(88,204,2,0.12)"
                        textColor = "var(--color-primary)"
                      } else if (opcion === resp.opcion && !resp.correcto) {
                        borderColor = "var(--color-danger)"
                        bgColor = "rgba(239,68,68,0.08)"
                        textColor = "var(--color-danger)"
                      }
                    }

                    return (
                      <button
                        key={opcion}
                        onClick={() => responder(mistake, opcion)}
                        disabled={!!resp}
                        className="text-left rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:brightness-110 active:scale-[0.99]"
                        style={{
                          background: bgColor,
                          border: `1.5px solid ${borderColor}`,
                          color: textColor,
                          cursor: resp ? "default" : "pointer",
                        }}
                      >
                        {opcion}
                      </button>
                    )
                  })}
                </div>

                {resp && !resp.correcto && (
                  <p className="text-xs mt-3" style={{ color: "var(--color-danger)" }}>
                    Respondiste: &ldquo;{resp.opcion}&rdquo; — Sigue repasando este concepto
                  </p>
                )}
                {resp?.correcto && (
                  <p className="text-xs mt-3 font-bold" style={{ color: "var(--color-primary)" }}>
                    ✅ ¡Correcto! Eliminando del banco de repaso...
                  </p>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
