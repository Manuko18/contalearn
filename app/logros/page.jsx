"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"
import { getAllAchievements } from "../../lib/achievements"
import Navbar from "../../components/Navbar"
import LoadingConti from "../../components/LoadingConti"
import PageTransition from "../../components/PageTransition"

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
  const sorted = [...logros].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
    return RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity)
  })

  return (
    <div className="min-h-screen pb-24 md:pt-20" style={{ background: "transparent" }}>
      <Navbar />
      <PageTransition>
        <div className="max-w-4xl mx-auto px-4 py-6">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold mb-1">🏅 Logros</h1>
            <div className="flex items-center gap-3">
              <p className="text-zinc-400 text-sm">{desbloqueados}/{logros.length} desbloqueados</p>
              <div className="flex-1 rounded-full h-2" style={{ background: "var(--color-surface)" }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${(desbloqueados / logros.length) * 100}%`,
                    background: "var(--color-primary)",
                    boxShadow: "0 0 8px rgba(88,204,2,0.5)",
                  }}
                />
              </div>
              <span className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>
                {Math.round((desbloqueados / logros.length) * 100)}%
              </span>
            </div>
          </div>

          {/* Grid de logros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sorted.map(l => (
              <div
                key={l.id}
                className="rounded-2xl p-4 transition-all"
                style={{
                  background: l.unlocked ? l.rarityInfo.glow : "var(--color-surface)",
                  border: `1.5px solid ${l.unlocked ? l.rarityInfo.color : "var(--color-border)"}`,
                  opacity: l.unlocked ? 1 : 0.45,
                  boxShadow: l.unlocked ? `0 0 20px ${l.rarityInfo.glow}` : "none",
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{
                      background: l.unlocked ? `${l.rarityInfo.color}22` : "rgba(255,255,255,0.04)",
                      border: `1px solid ${l.unlocked ? l.rarityInfo.color + "44" : "transparent"}`,
                    }}
                  >
                    {l.unlocked ? l.icon : "🔒"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm">{l.name}</p>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{
                          background: `${l.rarityInfo.color}22`,
                          color: l.rarityInfo.color,
                          border: `1px solid ${l.rarityInfo.color}44`,
                        }}
                      >
                        {l.rarityInfo.label}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{l.desc}</p>
                    {l.unlocked && (
                      <p className="text-xs font-bold mt-1" style={{ color: l.rarityInfo.color }}>✓ Desbloqueado</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-zinc-600 text-center mt-8">
            Los logros se guardan en este dispositivo · Juega para desbloquear más
          </p>
        </div>
      </PageTransition>
    </div>
  )
}
