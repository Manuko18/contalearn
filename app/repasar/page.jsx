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
          supabase.from("nivel_preguntas").select("respuesta_correcta").eq("nivel_id", nid).limit(30)
        ),
      ])

      const nivelMap = Object.fromEntries((niveles || []).map(n => [n.id, n.titulo]))
      const distPool = Object.fromEntries(
        nivelIds.map((nid, i) => [
          nid,
          (distResults[i]?.data || []).map(p => p.respuesta_correcta).filter(Boolean),
        ])
      )

      const erroresConOpciones = pendientes.map(m => {
        const correcta = m.respuesta_correcta
        const wrong1 = m.tu_respuesta && m.tu_respuesta !== correcta ? m.tu_respuesta : null
        const pool = (distPool[m.nivel_id] || []).filter(r => r !== correcta && r !== wrong1)
        const shuffledPool = [...pool].sort(() => Math.random() - 0.5)
        const wrongs = [wrong1, ...shuffledPool].filter(Boolean).slice(0, 3)
        const opciones = [correcta, ...wrongs].sort(() => Math.random() - 0.5).slice(0, 4)
        return { ...m, opciones, nivelNombre: nivelMap[m.nivel_id] || `Nivel ${m.nivel_id}` }
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
      addMastered(mistake.id)
      setTimeout(async () => {
        const { error } = await supabase.from("user_mistakes").delete().eq("id", mistake.id)
        if (error) console.warn("No se pudo eliminar de BD (RLS):", error.message)
        setErrores(prev => prev.filter(e => e.id !== mistake.id))
        setRespondido(prev => { const next = { ...prev }; delete next[mistake.id]; return next })
      }, 1400)
    }
  }

  if (loading) return <LoadingConti texto="Cargando errores pendientes..." />

  if (!errores.length) {
    return (
      <div className="qs">
        <div className="qs-bg-orb qs-bg-orb-1" />
        <div className="qs-bg-orb qs-bg-orb-2" />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, minHeight: "100vh", textAlign: "center", padding: "0 20px" }}>
          <div style={{ fontSize: 72 }}>🎉</div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Sin errores pendientes</h1>
          <p style={{ color: "var(--text-3)", fontSize: 13 }}>¡Tienes todos los conceptos dominados!</p>
          <button
            onClick={() => router.push("/")}
            style={{ padding: "12px 24px", borderRadius: 12, fontWeight: 700, fontSize: 14, background: "var(--accent-green)", color: "#042713", border: "none", cursor: "pointer" }}
          >
            Volver al inicio
          </button>
        </div>
        <Navbar />
      </div>
    )
  }

  const pendientes = errores.filter(e => !respondido[e.id]?.correcto).length

  return (
    <div className="qs">
      <div className="qs-bg-orb qs-bg-orb-1" />
      <div className="qs-bg-orb qs-bg-orb-2" />

      <header className="scr-header">
        <button className="scr-back" onClick={() => router.push("/")}>←</button>
        <div className="scr-title">Repasar errores</div>
        <div className="scr-hdr-chip">
          <span>🔁</span>
          <span>{pendientes}</span>
        </div>
      </header>

      <div className="scr-scroll">
        <p style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 600, marginBottom: 12 }}>
          {pendientes} pendiente{pendientes !== 1 ? "s" : ""} · Sin XP · Modo estudio
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {errores.map(mistake => {
            const resp = respondido[mistake.id]

            return (
              <div
                key={mistake.id}
                style={{
                  background: "var(--surface)",
                  border: `1.5px solid ${resp?.correcto ? "var(--accent-green)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 18,
                  padding: 18,
                  opacity: resp?.correcto ? 0.6 : 1,
                  transition: "all 0.3s",
                }}
              >
                <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  📘 {mistake.nivelNombre}
                </p>
                <p style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.4, marginBottom: 14 }}>{mistake.pregunta}</p>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {mistake.opciones.map(opcion => {
                    let borderColor = "rgba(255,255,255,0.1)"
                    let bgColor = "var(--surface)"
                    let textColor = "var(--text)"

                    if (resp) {
                      if (opcion === mistake.respuesta_correcta) { borderColor = "#22c55e"; bgColor = "rgba(34,197,94,0.12)"; textColor = "#86efac" }
                      else if (opcion === resp.opcion && !resp.correcto) { borderColor = "#ef4444"; bgColor = "rgba(239,68,68,0.08)"; textColor = "#fca5a5" }
                    }

                    return (
                      <button
                        key={opcion}
                        onClick={() => responder(mistake, opcion)}
                        disabled={!!resp}
                        style={{ textAlign: "left", borderRadius: 12, padding: "10px 14px", fontSize: 13, fontWeight: 600, background: bgColor, border: `1.5px solid ${borderColor}`, color: textColor, cursor: resp ? "default" : "pointer", transition: "all 0.18s", fontFamily: "inherit" }}
                      >
                        {opcion}
                      </button>
                    )
                  })}
                </div>

                {resp && !resp.correcto && (
                  <p style={{ fontSize: 11.5, marginTop: 10, color: "#fca5a5" }}>
                    Respondiste: &ldquo;{resp.opcion}&rdquo; — Sigue repasando este concepto
                  </p>
                )}
                {resp?.correcto && (
                  <p style={{ fontSize: 11.5, marginTop: 10, fontWeight: 800, color: "var(--accent-green)" }}>
                    ✅ ¡Correcto! Eliminando del banco de repaso...
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <div className="dash-bottom-spacer" />
      </div>

      <Navbar />
    </div>
  )
}
