"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"
import Navbar from "../../components/Navbar"
import LoadingConti from "../../components/LoadingConti"

const CATEGORIAS = [
  { label: "Básico",     indices: [0, 1] },
  { label: "Intermedio", indices: [2, 3] },
  { label: "Avanzado",   indices: [4, 5] },
  { label: "Experto",    indices: [6, 7] },
]

export default function NivelesPage() {
  const router = useRouter()
  const [niveles, setNiveles] = useState([])
  const [progresoPorNivel, setProgresoPorNivel] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      localStorage.removeItem("modoTest")
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      const [{ data: nivelesData }, { data: progresoData }] =
        await Promise.all([
          supabase.from("niveles").select("*").order("orden", { ascending: true }),
          supabase.from("progreso_nivel").select("nivel_id, dificultad").eq("user_id", user.id),
        ])

      const progreso = (nivelesData || []).map((nivel) => {
        const difs = new Set((progresoData || []).filter(p => p.nivel_id === nivel.id).map(p => p.dificultad))
        const pasos = (difs.has("facil") ? 1 : 0) + (difs.has("normal") ? 1 : 0) + (difs.has("dificil") ? 1 : 0)
        return {
          nivelId: nivel.id,
          completo: difs.has("dificil"),
          pasos,
          difs,
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

  const algunoDificilCompletado = progresoPorNivel.some(p => p.completo)

  return (
    <div className="qs scr-niveles">
      <div className="qs-bg-orb qs-bg-orb-1" />
      <div className="qs-bg-orb qs-bg-orb-2" />

      <header className="scr-header">
        <button className="scr-back" onClick={() => router.push("/")}>←</button>
        <div className="scr-title">Ruta de aprendizaje</div>
        <div className="scr-hdr-chip">
          <span>🗺️</span>
          <span>{progresoPorNivel.filter(p => p.completo).length}/{niveles.length}</span>
        </div>
      </header>

      <div className="scr-scroll">
        {CATEGORIAS.map((cat, ci) => {
          const catNiveles = cat.indices
            .map(i => ({ nivel: niveles[i], progreso: progresoPorNivel[i], index: i }))
            .filter(x => x.nivel)

          if (catNiveles.length === 0) return null

          return (
            <div key={cat.label} className="niv-category">
              <div className="niv-cat-hdr">
                <span className="niv-cat-num">Sección {ci + 1}</span>
                <span className="niv-cat-name">{cat.label}</span>
              </div>
              <div className="niv-list">
                {catNiveles.map(({ nivel, progreso, index }) => {
                  const desbloqueado = index === 0 || progresoPorNivel[index - 1]?.completo
                  const completos = progreso?.pasos ?? 0
                  const enCurso = desbloqueado && !progreso?.completo && completos > 0

                  return (
                    <div
                      key={nivel.id}
                      className={`niv-card${!desbloqueado ? " locked" : ""}${enCurso ? " current" : ""}`}
                    >
                      <div className="niv-line" />
                      <div className="niv-node">
                        {!desbloqueado
                          ? <span className="niv-lock">🔒</span>
                          : completos === 3
                            ? <span className="niv-check">✓</span>
                            : <span className="niv-emoji">{nivel.emoji || "📖"}</span>
                        }
                      </div>
                      <div className="niv-card-body">
                        <div className="niv-card-top">
                          <span className="niv-num">Nivel {index + 1}</span>
                          {enCurso && <span className="niv-now">EN CURSO</span>}
                        </div>
                        <div className="niv-card-title">{nivel.titulo}</div>
                        {nivel.descripcion && (
                          <div className="niv-card-desc">{nivel.descripcion}</div>
                        )}
                        <div className="niv-difs">
                          <Dif done={progreso?.difs?.has("facil")} kind="facil" />
                          <Dif done={progreso?.difs?.has("normal")} kind="normal" />
                          <Dif done={progreso?.difs?.has("dificil")} kind="dificil" />
                        </div>
                        {desbloqueado && (
                          <div className="niv-card-actions">
                            <button
                              className="niv-btn-play"
                              onClick={() => router.push(`/lecciones?nivel=${nivel.id}`)}
                            >
                              {progreso?.completo ? "Repasar" : completos > 0 ? "Continuar" : "Jugar"}
                            </button>
                            <button
                              className="niv-btn-icon"
                              onClick={() => router.push(`/tutor?nivel=${nivel.id}`)}
                              title="Tutor IA"
                            >
                              🤖
                            </button>
                            {progreso?.completo && (
                              <button
                                className="niv-btn-icon"
                                onClick={() => router.push(`/practica?nivel=${nivel.id}`)}
                                title="Práctica extra"
                              >
                                🎯
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Modo Desafío */}
        <div
          className={`niv-desafio${algunoDificilCompletado ? "" : " locked"}`}
          onClick={() => algunoDificilCompletado && router.push("/desafio")}
          style={{ cursor: algunoDificilCompletado ? "pointer" : "default" }}
        >
          <div className="niv-desafio-shimmer" />
          <div className="niv-desafio-ico">⚡</div>
          <div className="niv-desafio-body">
            <div className="niv-desafio-title">Modo Desafío</div>
            <div className="niv-desafio-sub">
              {algunoDificilCompletado
                ? "10 preguntas · 15 s por pregunta · Todos los niveles"
                : "Completa al menos un nivel difícil para desbloquear"}
            </div>
          </div>
          <div className="niv-desafio-arrow">{algunoDificilCompletado ? "→" : "🔒"}</div>
        </div>

        <div className="dash-bottom-spacer" />
      </div>

      <Navbar />
    </div>
  )
}

function Dif({ done, kind }) {
  const conf = {
    facil:   { dot: "#22c55e", lbl: "Fácil" },
    normal:  { dot: "#fbbf24", lbl: "Normal" },
    dificil: { dot: "#ef4444", lbl: "Difícil" },
  }[kind]
  return (
    <div className={`niv-dif${done ? " done" : ""}`} style={{ "--c": conf.dot }}>
      <span className="niv-dif-dot" />
      <span className="niv-dif-lbl">{conf.lbl}</span>
      {done && <span className="niv-dif-tick">✓</span>}
    </div>
  )
}
