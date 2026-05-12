"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"
import Navbar from "../../components/Navbar"
import LoadingConti from "../../components/LoadingConti"

const ADMIN_EMAIL = "lotor210799@gmail.com"

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [autorizado, setAutorizado] = useState(false)
  const [reportes, setReportes] = useState([])
  const [eliminando, setEliminando] = useState(null)

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push("/")
        return
      }
      setAutorizado(true)
      await cargarReportes()
      setLoading(false)
    }
    cargar()
  }, [router])

  const cargarReportes = async () => {
    const { data } = await supabase
      .from("reportes_preguntas")
      .select("*")
      .order("created_at", { ascending: false })
    setReportes(data || [])
  }

  const eliminarPregunta = async (reporte) => {
    setEliminando(reporte.id)
    // Eliminar del banco si tiene ID
    if (reporte.pregunta_id) {
      await supabase.from("empresa_preguntas").delete().eq("id", reporte.pregunta_id)
    }
    // Eliminar el reporte
    await supabase.from("reportes_preguntas").delete().eq("id", reporte.id)
    setReportes(prev => prev.filter(r => r.id !== reporte.id))
    setEliminando(null)
  }

  const descartarReporte = async (id) => {
    await supabase.from("reportes_preguntas").delete().eq("id", id)
    setReportes(prev => prev.filter(r => r.id !== id))
  }

  if (loading) return <><Navbar /><LoadingConti texto="Cargando admin..." /></>
  if (!autorizado) return null

  return (
    <div className="min-h-screen md:pt-20" style={{ background: "transparent" }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">

        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-white">Panel Admin</h1>
          <p className="text-zinc-400 text-sm mt-1">Preguntas reportadas como incorrectas</p>
        </div>

        {reportes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-zinc-500">Sin reportes pendientes</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reportes.map(r => (
              <div
                key={r.id}
                className="rounded-2xl p-5"
                style={{ background: "rgba(239,68,68,0.06)", border: "1.5px solid rgba(239,68,68,0.2)" }}
              >
                <p className="text-xs text-zinc-500 mb-2">
                  {new Date(r.created_at).toLocaleString("es-EC")}
                  {r.pregunta_id ? " · Empresa" : " · Práctica"}
                </p>
                <p className="text-white font-semibold text-sm mb-2 leading-relaxed">{r.pregunta_texto}</p>
                <div className="rounded-xl p-3 mb-3" style={{ background: "rgba(0,0,0,0.2)" }}>
                  <p className="text-xs text-zinc-400 mb-1">Respuesta correcta marcada:</p>
                  <p className="text-green-400 text-sm font-medium">{r.respuesta_correcta}</p>
                  <p className="text-xs text-zinc-400 mt-2 mb-1">Explicación:</p>
                  <p className="text-zinc-300 text-sm">{r.explicacion}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => eliminarPregunta(r)}
                    disabled={eliminando === r.id}
                    className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                    style={{ background: "rgba(239,68,68,0.2)", color: "#f87171", border: "1px solid rgba(239,68,68,0.4)" }}
                  >
                    {eliminando === r.id ? "Eliminando..." : "🗑️ Eliminar del banco"}
                  </button>
                  <button
                    onClick={() => descartarReporte(r.id)}
                    className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", color: "#6b7280", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    ✓ Descartar reporte
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
