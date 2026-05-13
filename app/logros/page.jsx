"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"
import { getAllAchievements, RARITY } from "../../lib/achievements"
import Navbar from "../../components/Navbar"
import LoadingConti from "../../components/LoadingConti"

const RARITY_ORDER = ["legendary", "epic", "rare", "uncommon", "common"]

export default function LogrosPage() {
  const router = useRouter()
  const [logros, setLogros] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      setLogros(getAllAchievements())
      setLoading(false)
    }
    cargar()
  }, [router])

  if (loading) return <LoadingConti texto="Cargando logros..." />

  const desbloqueados = logros.filter(l => l.unlocked).length
  const pct = logros.length ? (desbloqueados / logros.length) * 100 : 0
  const sorted = [...logros].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
    return RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity)
  })

  return (
    <div className="qs scr-logros">
      <div className="qs-bg-orb qs-bg-orb-1" />
      <div className="qs-bg-orb qs-bg-orb-2" />

      <header className="scr-header">
        <button className="scr-back" onClick={() => router.push("/")}>←</button>
        <div className="scr-title">Mis logros</div>
        <div className="scr-hdr-chip">
          <span>🎖</span>
          <span>{desbloqueados}/{logros.length}</span>
        </div>
      </header>

      <div className="scr-scroll">
        {/* Progress hero */}
        <div className="logros-hero">
          <div className="logros-hero-num">
            <span className="logros-hero-cur">{desbloqueados}</span>
            <span className="logros-hero-sep">/</span>
            <span className="logros-hero-tot">{logros.length}</span>
          </div>
          <div className="logros-hero-lbl">logros desbloqueados</div>
          <div className="logros-hero-track">
            <div className="logros-hero-fill" style={{ width: `${pct}%` }} />
          </div>
          {/* Rarity legend */}
          <div className="logros-rareza-legend">
            {Object.entries(RARITY).map(([key, s]) => {
              const count = logros.filter(l => l.rarity === key && l.unlocked).length
              const total = logros.filter(l => l.rarity === key).length
              return (
                <div key={key} className="logros-leg" style={{ color: s.color }}>
                  <span className="logros-leg-dot" style={{ background: s.color }} />
                  <span>{s.label}</span>
                  <span className="logros-leg-count">{count}/{total}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Grid */}
        <div className="logros-grid">
          {sorted.map(l => (
            <div
              key={l.id}
              className={`logro-card${l.unlocked ? " unlocked" : " locked"}`}
              style={{ "--c": l.rarityInfo.color, "--bg": l.rarityInfo.glow }}
            >
              <div className="logro-shimmer" />
              <div className="logro-rareza">{l.rarityInfo.label}</div>
              <div className="logro-emoji">{l.unlocked ? l.icon : "🔒"}</div>
              <div className="logro-title">{l.name}</div>
              <div className="logro-desc">{l.desc}</div>
            </div>
          ))}
        </div>

        <div className="dash-bottom-spacer" />
      </div>

      <Navbar />
    </div>
  )
}
