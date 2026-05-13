"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"
import Navbar from "../../components/Navbar"
import LoadingConti from "../../components/LoadingConti"
import PageTransition from "../../components/PageTransition"
import { getRankTheme } from "../../lib/rankTheme"

function getRango(xp) {
  const t = getRankTheme(xp)
  return { nombre: t.name, emoji: t.emoji, color: t.color }
}

const PODIUM_COLORS = [
  { bg: "#ffd70020", border: "#ffd700", text: "#ffd700", height: "h-20", label: "1°" },
  { bg: "#c0c0c020", border: "#c0c0c0", text: "#c0c0c0", height: "h-14", label: "2°" },
  { bg: "#cd7f3220", border: "#cd7f32", text: "#cd7f32", height: "h-10", label: "3°" },
]

export default function RankingPage() {
  const router = useRouter()
  const [jugadores, setJugadores] = useState([])
  const [miId, setMiId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      setMiId(user.id)
      const { data } = await supabase
        .from("users")
        .select("id, email, username, xp_total, racha_actual, titulo_empresa")
        .order("xp_total", { ascending: false })
        .limit(50)
      setJugadores(data || [])
      setLoading(false)
    }
    cargar()
  }, [router])

  if (loading) {
    return (
      <>
        <Navbar />
        <LoadingConti texto="Cargando ranking..." />
      </>
    )
  }

  const miPosicion = jugadores.findIndex(j => j.id === miId)
  const top3 = jugadores.slice(0, 3)

  // Orden del podio visual: 2°, 1°, 3° (clásico)
  const podiumOrder = [
    top3[1] ? { jugador: top3[1], idx: 1 } : null,
    top3[0] ? { jugador: top3[0], idx: 0 } : null,
    top3[2] ? { jugador: top3[2], idx: 2 } : null,
  ].filter(Boolean)

  return (
    <div className="min-h-screen pb-24 md:pt-20" style={{ background: "transparent" }}>
      <Navbar />

      <PageTransition>
        <div className="max-w-3xl mx-auto px-4 py-6">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold mb-1">Ranking Global</h1>
            <p className="text-zinc-400 text-sm">Top jugadores por XP · {jugadores.length} participantes</p>
          </div>

          {/* Mi posición (si no estoy en top3) */}
          {miPosicion >= 3 && (
            <div
              className="rounded-2xl p-4 mb-6 flex items-center gap-4 glow-ring"
              style={{
                background: "rgba(88,204,2,0.08)",
                border: "2px solid var(--color-primary)",
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm flex-shrink-0"
                style={{ background: "var(--color-primary)", color: "#000" }}
              >
                #{miPosicion + 1}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm" style={{ color: "var(--color-primary)" }}>Tu posición</p>
                <p className="text-xs text-zinc-400">{jugadores[miPosicion]?.xp_total || 0} XP · {getRango(jugadores[miPosicion]?.xp_total || 0).emoji} {getRango(jugadores[miPosicion]?.xp_total || 0).nombre}</p>
              </div>
              <span className="text-xl">⭐</span>
            </div>
          )}

          {/* Podio visual */}
          {top3.length >= 2 && (
            <div
              className="rounded-2xl p-6 mb-6"
              style={{
                background: "rgba(31,45,53,0.6)",
                backdropFilter: "blur(12px)",
                border: "1px solid var(--color-border)",
              }}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 text-center mb-6">
                🏆 Podio
              </p>
              <div className="flex items-end justify-center gap-4">
                {podiumOrder.map(({ jugador, idx }) => {
                  const c = PODIUM_COLORS[idx]
                  const nombre = jugador.username || jugador.email?.split("@")[0] || "Anónimo"
                  const esMio = jugador.id === miId
                  const rango = getRango(jugador.xp_total || 0)

                  return (
                    <div key={jugador.id} className="flex flex-col items-center gap-2 flex-1">
                      {/* Avatar */}
                      <div className="flex flex-col items-center gap-1">
                        {idx === 0 && <span className="text-2xl">👑</span>}
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-xl"
                          style={{
                            background: esMio ? "var(--color-primary)" : c.bg,
                            border: `2.5px solid ${esMio ? "var(--color-primary)" : c.border}`,
                            boxShadow: `0 0 20px ${c.border}50`,
                            color: esMio ? "#000" : c.text,
                          }}
                        >
                          {nombre[0].toUpperCase()}
                        </div>
                        <p className="text-xs font-bold text-center truncate max-w-20" style={{ color: c.text }}>
                          {nombre}{esMio ? " ★" : ""}
                        </p>
                        <p className="text-xs text-zinc-500">{rango.emoji} {jugador.xp_total || 0} XP</p>
                      </div>

                      {/* Bloque del podio */}
                      <div
                        className={`w-full ${c.height} rounded-t-xl flex items-center justify-center font-extrabold text-2xl podium-bar`}
                        style={{
                          background: c.bg,
                          border: `1.5px solid ${c.border}`,
                          borderBottom: "none",
                          boxShadow: `0 0 20px ${c.border}30`,
                          animationDelay: `${idx * 0.12}s`,
                          transformOrigin: "bottom",
                          color: c.text,
                        }}
                      >
                        {c.label}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Lista completa */}
          <div className="flex flex-col gap-2">
            {jugadores.map((jugador, index) => {
              const esMio = jugador.id === miId
              const nombre = jugador.username || jugador.email?.split("@")[0] || "Anónimo"
              const rango = getRango(jugador.xp_total || 0)
              const medalla = ["🥇", "🥈", "🥉"][index]

              return (
                <div
                  key={jugador.id}
                  className="rank-row flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{
                    background: esMio ? "rgba(88,204,2,0.08)" : "var(--color-surface)",
                    border: `1px solid ${esMio ? "var(--color-primary)" : "var(--color-border)"}`,
                    boxShadow: esMio ? "0 0 20px rgba(88,204,2,0.12)" : "none",
                  }}
                >
                  {/* Posición */}
                  <span className="text-xl font-extrabold w-8 text-center flex-shrink-0">
                    {medalla || <span className="text-sm text-zinc-500">#{index + 1}</span>}
                  </span>

                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{
                      background: esMio ? "var(--color-primary)" : rango.color + "30",
                      border: `1.5px solid ${esMio ? "var(--color-primary)" : rango.color + "60"}`,
                      color: esMio ? "#000" : rango.color,
                    }}
                  >
                    {nombre[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">
                      {nombre}
                      {esMio && <span className="text-xs font-normal text-zinc-400 ml-1">(tú)</span>}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {rango.emoji} {rango.nombre} · 🔥 {jugador.racha_actual || 0} días
                      {jugador.titulo_empresa && (
                        <span className="ml-1.5 text-yellow-400 font-semibold">{jugador.titulo_empresa}</span>
                      )}
                    </p>
                  </div>

                  {/* XP */}
                  <div className="text-right flex-shrink-0">
                    <p
                      className="font-extrabold text-sm"
                      style={{ color: esMio ? "var(--color-primary)" : "var(--color-info)" }}
                    >
                      {jugador.xp_total || 0}
                    </p>
                    <p className="text-xs text-zinc-600">XP</p>
                  </div>
                </div>
              )
            })}
          </div>

          {jugadores.length === 0 && (
            <div className="text-center py-20 text-zinc-500">
              <p className="text-5xl mb-4">🏜️</p>
              <p className="font-semibold">Sé el primero en el ranking</p>
            </div>
          )}
        </div>
      </PageTransition>
    </div>
  )
}
