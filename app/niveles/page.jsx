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
]

const TIERS = [
  { id: 1, nombre: "Junior",      color: "#4ade80", emoji: "🟢" },
  { id: 2, nombre: "Semi-Junior", color: "#60a5fa", emoji: "🔵" },
  { id: 3, nombre: "Semi-Senior", color: "#c084fc", emoji: "🟣" },
  { id: 4, nombre: "Senior",      color: "#f87171", emoji: "🔴" },
]

export default function NivelesPage() {
  const router = useRouter()
  const [niveles, setNiveles] = useState([])
  const [progresoPorNivel, setProgresoPorNivel] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      const [{ data: nivelesData }, { data: leccionesData }, { data: progresoData }] =
        await Promise.all([
          supabase.from("niveles").select("*").order("orden", { ascending: true }),
          supabase.from("lecciones").select("id, nivel_id, dificultad"),
          supabase.from("progreso_usuario").select("leccion_id").eq("user_id", user.id).eq("completado", true),
        ])

      const completadasIds = new Set((progresoData || []).map((p) => p.leccion_id))

      const progreso = (nivelesData || []).map((nivel) => {
        const nivelLecs = (leccionesData || []).filter((l) => l.nivel_id === nivel.id)
        const tiers = TIERS.map((tier) => {
          const tierLecs = nivelLecs.filter(l => (l.dificultad || 1) === tier.id)
          const tierComp = tierLecs.filter(l => completadasIds.has(l.id)).length
          return { ...tier, total: tierLecs.length, completadas: tierComp, completo: tierLecs.length > 0 && tierComp === tierLecs.length }
        }).filter(t => t.total > 0)

        const completadas = nivelLecs.filter(l => completadasIds.has(l.id)).length
        return { nivelId: nivel.id, total: nivelLecs.length, completadas, completo: nivelLecs.length > 0 && completadas === nivelLecs.length, tiers }
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
            <h1 className="text-3xl font-extrabold mb-1">
              Niveles
              <span className="ml-3 text-lg font-normal text-zinc-500">
                {progresoPorNivel.filter(p => p.completo).length}/{niveles.length} completos
              </span>
            </h1>
            <p className="text-zinc-400 text-sm">
              Desbloquea cada sub-nivel para avanzar al siguiente
            </p>
          </div>

          {/* Mapa de niveles */}
          <div className="relative flex flex-col items-center gap-0">
            {niveles.map((nivel, index) => {
              const desbloqueado = index === 0 || progresoPorNivel[index - 1]?.completo
              const progreso = progresoPorNivel[index]
              const color = COLORES[index % COLORES.length]
              const pctGlobal = progreso?.total > 0 ? Math.round((progreso.completadas / progreso.total) * 100) : 0

              return (
                <div key={nivel.id} className="w-full flex flex-col items-center">
                  {/* Conector vertical */}
                  {index > 0 && (
                    <div
                      className="w-0.5 h-8"
                      style={{
                        background: progresoPorNivel[index - 1]?.completo
                          ? `linear-gradient(to bottom, ${COLORES[index-1].glow}, ${color.glow})`
                          : "var(--color-border)",
                        boxShadow: progresoPorNivel[index - 1]?.completo
                          ? `0 0 8px ${color.glow}66`
                          : "none",
                      }}
                    />
                  )}

                  {/* Tarjeta */}
                  <div
                    className="w-full rounded-2xl p-5 card-hover"
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
                        {progreso?.completo && (
                          <span className="text-xl">✅</span>
                        )}
                        {!desbloqueado && (
                          <span className="text-xl">🔒</span>
                        )}
                        {desbloqueado && !progreso?.completo && progreso?.total > 0 && (
                          <span className="text-xs font-bold" style={{ color: color.icon }}>
                            {pctGlobal}%
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm mb-4 text-zinc-400">{nivel.descripcion}</p>

                    {/* Barra de progreso global del nivel */}
                    {desbloqueado && progreso?.total > 0 && (
                      <div className="mb-4">
                        <div className="w-full rounded-full h-1.5" style={{ background: "rgba(0,0,0,0.3)" }}>
                          <div
                            className="h-1.5 rounded-full transition-all duration-700"
                            style={{
                              width: `${pctGlobal}%`,
                              background: color.glow,
                              boxShadow: `0 0 8px ${color.glow}88`,
                            }}
                          />
                        </div>
                        <p className="text-xs mt-1" style={{ color: color.icon + "99" }}>
                          {progreso.completadas}/{progreso.total} preguntas completadas
                        </p>
                      </div>
                    )}

                    {/* Sub-niveles (tiers) */}
                    {desbloqueado && progreso?.tiers?.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {progreso.tiers.map((tier, ti) => {
                          const tierDesbloqueado = ti === 0 || progreso.tiers.slice(0, ti).every(t => t.completo)
                          const pctTier = tier.total > 0 ? Math.round((tier.completadas / tier.total) * 100) : 0

                          return (
                            <button
                              key={tier.id}
                              onClick={() => tierDesbloqueado && router.push(`/lecciones?nivel=${nivel.id}&dificultad=${tier.id}`)}
                              disabled={!tierDesbloqueado}
                              className="tier-btn rounded-xl p-3 text-left"
                              style={{
                                background: tierDesbloqueado ? tier.color + "14" : "rgba(255,255,255,0.03)",
                                border: `1.5px solid ${tierDesbloqueado ? tier.color + "55" : "rgba(255,255,255,0.06)"}`,
                                cursor: tierDesbloqueado ? "pointer" : "not-allowed",
                                opacity: tierDesbloqueado ? 1 : 0.35,
                                boxShadow: tier.completo ? `0 0 12px ${tier.color}30` : "none",
                              }}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm font-extrabold" style={{ color: tierDesbloqueado ? tier.color : "#4b5563" }}>
                                  {tier.emoji} {tier.nombre}
                                </span>
                                {tier.completo && <span className="text-xs">✅</span>}
                                {!tierDesbloqueado && <span className="text-xs opacity-60">🔒</span>}
                              </div>
                              <div className="w-full rounded-full h-1.5" style={{ background: "rgba(0,0,0,0.35)" }}>
                                <div
                                  className="h-1.5 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${pctTier}%`,
                                    background: tier.color,
                                    boxShadow: pctTier > 0 ? `0 0 6px ${tier.color}88` : "none",
                                  }}
                                />
                              </div>
                              <p className="text-xs mt-1" style={{ color: tierDesbloqueado ? tier.color + "99" : "#374151" }}>
                                {tier.completadas}/{tier.total} preguntas
                              </p>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {!desbloqueado && (
                      <div className="flex items-center justify-center gap-2 py-2">
                        <span className="text-zinc-600 text-xs">Completa el nivel anterior para desbloquear</span>
                      </div>
                    )}
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
