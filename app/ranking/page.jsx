"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"
import Navbar from "../../components/Navbar"
import LoadingConti from "../../components/LoadingConti"
import { getRankTheme } from "../../lib/rankTheme"

function getRango(xp) {
  const t = getRankTheme(xp)
  return { nombre: t.name, emoji: t.emoji, color: t.color, key: t.key }
}

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
  // Podium visual order: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean)
  const podiumPos = [2, 1, 3]

  return (
    <div className="qs scr-ranking">
      <div className="qs-bg-orb qs-bg-orb-1" />
      <div className="qs-bg-orb qs-bg-orb-2" />

      <header className="scr-header">
        <button className="scr-back" onClick={() => router.push("/")}>←</button>
        <div className="scr-title">Ranking global</div>
        <div className="scr-hdr-chip">
          <span>👥</span>
          <span>{jugadores.length.toLocaleString()}</span>
        </div>
      </header>

      <div className="scr-scroll">
        {/* Podium */}
        {top3.length >= 2 && (
          <div className="rk-podium">
            {podiumOrder.map((jugador, i) => {
              const pos = podiumPos[i]
              const nombre = jugador.username || jugador.email?.split("@")[0] || "Anónimo"
              const rango = getRango(jugador.xp_total || 0)
              const esMio = jugador.id === miId
              return (
                <div key={jugador.id} className={`rk-pod rk-pod-${pos}`}>
                  <div className="rk-pod-crown">{pos === 1 ? "👑" : ""}</div>
                  <div
                    className="rk-pod-av"
                    style={{
                      background: rango.color + "22",
                      border: `2px solid ${esMio ? "var(--accent-green)" : rango.color}`,
                    }}
                  >
                    {nombre[0].toUpperCase()}
                  </div>
                  <div className="rk-pod-name">{nombre}{esMio ? " ★" : ""}</div>
                  <div className="rk-pod-rango" style={{ color: rango.color }}>
                    {rango.emoji} {rango.nombre}
                  </div>
                  <div className="rk-pod-base">
                    <div className="rk-pod-pos">{pos}</div>
                    <div className="rk-pod-xp">{jugador.xp_total || 0} XP</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Tabs (visual only) */}
        <div className="rk-tabs">
          <button className="rk-tab active">Global</button>
          <button className="rk-tab">Semana</button>
        </div>

        {/* List positions 4+ */}
        <div className="rk-list">
          {jugadores.slice(3).map((jugador, i) => {
            const pos = i + 4
            const nombre = jugador.username || jugador.email?.split("@")[0] || "Anónimo"
            const rango = getRango(jugador.xp_total || 0)
            const esMio = jugador.id === miId
            return (
              <div
                key={jugador.id}
                className="rk-row"
                style={esMio ? { background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.35)" } : {}}
              >
                <div className="rk-pos">{pos}</div>
                <div
                  className="rk-av"
                  style={{ background: rango.color + "22", borderColor: rango.color }}
                >
                  {nombre[0].toUpperCase()}
                </div>
                <div className="rk-info">
                  <div className="rk-name">
                    {nombre}
                    {esMio && <span className="rk-you-pill">tú</span>}
                  </div>
                  <div className="rk-meta" style={{ color: rango.color }}>
                    {rango.emoji} {rango.nombre}
                    {jugador.titulo_empresa && (
                      <span className="rk-title">· {jugador.titulo_empresa}</span>
                    )}
                  </div>
                </div>
                <div className="rk-xp">{(jugador.xp_total || 0).toLocaleString()}<span>XP</span></div>
              </div>
            )
          })}
        </div>

        {/* My position sticky section (when not in top 3) */}
        {miPosicion >= 3 && jugadores[miPosicion] && (() => {
          const yo = jugadores[miPosicion]
          const rango = getRango(yo.xp_total || 0)
          const nombre = yo.username || yo.email?.split("@")[0] || "Anónimo"
          const xpGap = miPosicion > 0 ? (jugadores[miPosicion - 1]?.xp_total || 0) - (yo.xp_total || 0) : 0
          return (
            <>
              <div className="rk-divider">
                <span>···</span>
                <span>tu posición</span>
                <span>···</span>
              </div>
              <div className="rk-you-row">
                <div className="rk-you-pos">#{miPosicion + 1}</div>
                <div className="rk-you-av">{nombre[0].toUpperCase()}</div>
                <div className="rk-info">
                  <div className="rk-name">
                    {nombre} <span className="rk-you-pill">tú</span>
                  </div>
                  <div className="rk-meta" style={{ color: rango.color }}>
                    {rango.emoji} {rango.nombre}
                    {yo.titulo_empresa && <span className="rk-title">· {yo.titulo_empresa}</span>}
                  </div>
                </div>
                <div className="rk-xp">{yo.xp_total || 0}<span>XP</span></div>
              </div>
              {xpGap > 0 && (
                <div className="rk-tip">
                  <span>📈</span>
                  <span>Gana <b>{xpGap} XP</b> más para subir una posición</span>
                </div>
              )}
            </>
          )
        })()}

        {jugadores.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-3)" }}>
            <p style={{ fontSize: 48, marginBottom: 12 }}>🏜️</p>
            <p style={{ fontWeight: 700 }}>Sé el primero en el ranking</p>
          </div>
        )}

        <div className="dash-bottom-spacer" />
      </div>

      <Navbar />
    </div>
  )
}
