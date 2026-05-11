"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"
import Navbar from "../../components/Navbar"
import LoadingConti from "../../components/LoadingConti"
import PageTransition from "../../components/PageTransition"

const COLORES = [
  { bg: "rgba(30,58,95,0.55)",  border: "#2563eb", glow: "#2563eb", icon: "#60a5fa" },
  { bg: "rgba(26,58,42,0.55)",  border: "#16a34a", glow: "#16a34a", icon: "#4ade80" },
  { bg: "rgba(59,31,43,0.55)",  border: "#b91c1c", glow: "#ef4444", icon: "#f87171" },
  { bg: "rgba(45,42,26,0.55)",  border: "#d97706", glow: "#f59e0b", icon: "#fbbf24" },
  { bg: "rgba(42,26,59,0.55)",  border: "#7c3aed", glow: "#a855f7", icon: "#c084fc" },
  { bg: "rgba(26,47,58,0.55)",  border: "#0891b2", glow: "#06b6d4", icon: "#38bdf8" },
  { bg: "rgba(58,35,26,0.55)",  border: "#c2410c", glow: "#f97316", icon: "#fb923c" },
  { bg: "rgba(26,58,52,0.55)",  border: "#0f766e", glow: "#14b8a6", icon: "#2dd4bf" },
]

const CATEGORIAS = [
  { label: "Básico",     emoji: "🟢", color: "#4ade80", indices: [0, 1] },
  { label: "Intermedio", emoji: "🔵", color: "#60a5fa", indices: [2, 3] },
  { label: "Avanzado",   emoji: "🟠", color: "#fb923c", indices: [4, 5] },
  { label: "Experto",    emoji: "🔴", color: "#f87171", indices: [6, 7] },
]

export default function NivelesPage() {
  const router = useRouter()
  const [niveles, setNiveles] = useState([])
  const [progresoPorNivel, setProgresoPorNivel] = useState([])
  const [loading, setLoading] = useState(true)
  const [modoTest, setModoTest] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem("modoTest") === "1"
  )

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      const [{ data: nivelesData }, { data: leccionesData }, { data: progresoData }] =
        await Promise.all([
          supabase.from("niveles").select("*").order("orden", { ascending: true }),
          supabase.from("lecciones").select("id, nivel_id"),
          supabase.from("progreso_usuario").select("leccion_id").eq("user_id", user.id).eq("completado", true),
        ])

      const completadasIds = new Set((progresoData || []).map((p) => p.leccion_id))

      const progreso = (nivelesData || []).map((nivel) => {
        const nivelLecs = (leccionesData || []).filter((l) => l.nivel_id === nivel.id)
        const completadas = nivelLecs.filter(l => completadasIds.has(l.id)).length
        return {
          nivelId: nivel.id,
          total: nivelLecs.length,
          completadas,
          completo: nivelLecs.length > 0 && completadas === nivelLecs.length,
        }
      })

      setNiveles(nivelesData || [])
      setProgresoPorNivel(progreso)
      setLoading(false)
    }
    cargar()
  }, [router])

  if (loading) {
    return (
      <>
        <Navbar />
        <LoadingConti texto="Cargando niveles..." />
      </>
    )
  }

  return (
    <div className="min-h-screen pb-24 md:pt-20" style={{ background: "transparent" }}>
      <Navbar />

      <PageTransition>
        <div className="max-w-4xl mx-auto px-4 py-6">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-3xl font-extrabold">
                Niveles
                <span className="ml-3 text-lg font-normal text-zinc-500">
                  {progresoPorNivel.filter(p => p.completo).length}/{niveles.length} completos
                </span>
              </h1>
              <button
                onClick={() => {
                  const nuevo = !modoTest
                  setModoTest(nuevo)
                  localStorage.setItem("modoTest", nuevo ? "1" : "0")
                }}
                className="text-xs px-3 py-1.5 rounded-xl font-bold transition-all"
                style={{
                  background: modoTest ? "#f59e0b22" : "var(--color-surface)",
                  border: `1.5px solid ${modoTest ? "#f59e0b" : "var(--color-border)"}`,
                  color: modoTest ? "#f59e0b" : "#6b7280",
                }}
              >
                🧪 {modoTest ? "Test ON" : "Test"}
              </button>
            </div>
            <p className="text-zinc-400 text-sm">
              {modoTest ? "🧪 Modo prueba activo — todos los niveles desbloqueados" : "Completa cada nivel para desbloquear el siguiente"}
            </p>
          </div>

          {/* Mapa de niveles agrupado por categoría */}
          <div className="flex flex-col gap-8">
            {CATEGORIAS.map((cat) => {
              const catNiveles = cat.indices
                .map(i => ({ nivel: niveles[i], progreso: progresoPorNivel[i], index: i }))
                .filter(x => x.nivel)

              if (catNiveles.length === 0) return null

              return (
                <div key={cat.label}>
                  {/* Header categoría */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">{cat.emoji}</span>
                    <span className="text-sm font-extrabold uppercase tracking-widest" style={{ color: cat.color }}>
                      {cat.label}
                    </span>
                    <div className="flex-1 h-px ml-2" style={{ background: cat.color + "33" }} />
                  </div>

                  {/* Niveles de esta categoría */}
                  <div className="flex flex-col gap-3">
                    {catNiveles.map(({ nivel, progreso, index }) => {
                      const desbloqueado = modoTest || index === 0 || progresoPorNivel[index - 1]?.completo
                      const color = COLORES[index % COLORES.length]
                      const pct = progreso?.total > 0
                        ? Math.round((progreso.completadas / progreso.total) * 100)
                        : 0

                      return (
                        <div
                          key={nivel.id}
                          className="w-full rounded-2xl p-5"
                          style={{
                            background: color.bg,
                            backdropFilter: "blur(12px)",
                            WebkitBackdropFilter: "blur(12px)",
                            border: `1.5px solid ${desbloqueado ? color.border + "80" : "var(--color-border)"}`,
                            opacity: desbloqueado ? 1 : 0.45,
                            boxShadow: desbloqueado ? `0 4px 0 ${color.border}30, 0 0 30px ${color.glow}12` : "none",
                          }}
                        >
                          {/* Header nivel */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                                style={{
                                  background: `${color.glow}18`,
                                  border: `1px solid ${color.glow}30`,
                                  boxShadow: desbloqueado ? `0 0 16px ${color.glow}25` : "none",
                                }}
                              >
                                {nivel.emoji || "📖"}
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: color.icon }}>
                                  Nivel {index + 1}
                                </p>
                                <h2 className="text-lg font-extrabold text-white">{nivel.titulo}</h2>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {progreso?.completo && <span className="text-xl">✅</span>}
                              {!desbloqueado && <span className="text-xl">🔒</span>}
                              {desbloqueado && !progreso?.completo && progreso?.total > 0 && (
                                <span className="text-xs font-bold" style={{ color: color.icon }}>{pct}%</span>
                              )}
                            </div>
                          </div>

                          <p className="text-sm mb-4 text-zinc-400">{nivel.descripcion}</p>

                          {desbloqueado && progreso?.total > 0 && (
                            <>
                              <div className="mb-3">
                                <div className="w-full rounded-full h-1.5" style={{ background: "rgba(0,0,0,0.3)" }}>
                                  <div
                                    className="h-1.5 rounded-full transition-all duration-700"
                                    style={{
                                      width: `${pct}%`,
                                      background: color.glow,
                                      boxShadow: `0 0 8px ${color.glow}88`,
                                    }}
                                  />
                                </div>
                                <p className="text-xs mt-1" style={{ color: color.icon + "99" }}>
                                  {progreso.completadas}/{progreso.total} preguntas completadas
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => router.push(`/lecciones?nivel=${nivel.id}`)}
                                  className="flex-1 py-2.5 rounded-xl font-extrabold text-sm transition-all duration-200"
                                  style={{
                                    background: progreso?.completo ? color.glow + "22" : color.glow,
                                    color: progreso?.completo ? color.icon : "#000",
                                    border: `1.5px solid ${color.glow}`,
                                    boxShadow: `0 0 12px ${color.glow}44`,
                                  }}
                                >
                                  {progreso?.completo ? "✅ Repasar" : pct > 0 ? "▶ Continuar" : "▶ Jugar"}
                                </button>
                                <button
                                  onClick={() => router.push(`/tutor?nivel=${nivel.id}`)}
                                  className="py-2.5 px-3 rounded-xl font-bold text-sm transition-all duration-200"
                                  style={{
                                    background: "rgba(37,99,235,0.15)",
                                    color: "#60a5fa",
                                    border: "1.5px solid rgba(37,99,235,0.4)",
                                  }}
                                  title="Preguntar al Tutor IA"
                                >
                                  🤖
                                </button>
                                {progreso?.completo && (
                                  <button
                                    onClick={() => router.push(`/practica?nivel=${nivel.id}`)}
                                    className="py-2.5 px-3 rounded-xl font-bold text-sm transition-all duration-200"
                                    style={{
                                      background: "rgba(124,58,237,0.15)",
                                      color: "#c084fc",
                                      border: "1.5px solid rgba(124,58,237,0.4)",
                                    }}
                                    title="Práctica extra con IA"
                                  >
                                    🎯
                                  </button>
                                )}
                              </div>
                            </>
                          )}

                          {desbloqueado && progreso?.total === 0 && (
                            <p className="text-xs text-zinc-600 text-center py-2">Contenido próximamente</p>
                          )}

                          {!desbloqueado && (
                            <div className="flex items-center justify-center gap-2 py-2">
                              <span className="text-zinc-600 text-xs">Completa el nivel anterior para desbloquear</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {niveles.length === 0 && (
            <div className="text-center py-20 text-zinc-500">
              <p className="text-5xl mb-4">🚧</p>
              <p className="font-semibold">Niveles próximamente</p>
            </div>
          )}
        </div>
      </PageTransition>
    </div>
  )
}
