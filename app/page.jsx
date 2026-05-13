"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../lib/supabaseClient"
import Navbar from "../components/Navbar"
import Mascota from "../components/Mascota"
import PageTransition from "../components/PageTransition"
import LoadingConti from "../components/LoadingConti"
import AchievementToast from "../components/AchievementToast"
import { getFrase, getDiasDesdeUltimaLeccion } from "../lib/frases"
import { getRankTheme } from "../lib/rankTheme"
import { sound } from "../lib/audio"
import { checkNewAchievements } from "../lib/achievements"

// ── Pool de misiones disponibles ──
const MISIONES_POOL = [
  // Fáciles (+10 XP)
  { tipo: "responder_preguntas_5",  descripcion: "Responde 5 preguntas hoy",                    icono: "📝", meta: 5,   xp: 10 },
  { tipo: "racha_combo_3",          descripcion: "Consigue un combo de 3 correctas seguidas",   icono: "🔥", meta: 3,   xp: 10 },
  // Normales (+15 XP)
  { tipo: "responder_preguntas",    descripcion: "Responde 10 preguntas hoy",                   icono: "📝", meta: 10,  xp: 15 },
  { tipo: "completar_subniveles",   descripcion: "Completa 2 sub-niveles hoy",                  icono: "🏆", meta: 2,   xp: 15 },
  { tipo: "sin_perder_vida",        descripcion: "Termina una sesión sin perder ninguna vida",  icono: "❤️", meta: 1,   xp: 15 },
  { tipo: "xp_ganar",               descripcion: "Gana 50 XP jugando hoy",                     icono: "⚡", meta: 50,  xp: 15 },
  // Difíciles (+25 XP)
  { tipo: "correctas_seguidas",     descripcion: "Consigue 5 respuestas correctas seguidas",    icono: "🎯", meta: 5,   xp: 25 },
  { tipo: "xp_ganar_100",           descripcion: "Gana 100 XP en un día",                      icono: "💎", meta: 100, xp: 25 },
  { tipo: "completar_subniveles_3", descripcion: "Completa 3 sub-niveles hoy",                  icono: "🏅", meta: 3,   xp: 25 },
  { tipo: "racha_combo_5",          descripcion: "Alcanza un combo de 5 correctas seguidas",    icono: "⚡", meta: 5,   xp: 25 },
]

function mezclarPool(arr) { return [...arr].sort(() => Math.random() - 0.5) }

const RANGOS = [
  { nombre: "Bronce",   emoji: "🥉", color: "#cd7f32", min: 0   },
  { nombre: "Plata",    emoji: "🥈", color: "#a8a8a8", min: 60  },
  { nombre: "Oro",      emoji: "🥇", color: "#ffd700", min: 120 },
  { nombre: "Platino",  emoji: "💎", color: "#00d4aa", min: 180 },
  { nombre: "Diamante", emoji: "💠", color: "#60a5fa", min: 240 },
  { nombre: "Maestro",  emoji: "👑", color: "#c084fc", min: 300 },
]

export default function Home() {
  const router = useRouter()
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tiempoVida, setTiempoVida] = useState(null)
  const [misiones, setMisiones] = useState([])
  const [achQueue, setAchQueue]     = useState([])
  const [curAch, setCurAch]         = useState(null)

  // ── cargarOGenerarMisiones declarada ANTES del useEffect que la llama ──
  async function cargarOGenerarMisiones(userId) {
    const hoy = new Date().toISOString().split("T")[0]
    const { data: existentes } = await supabase
      .from("misiones_diarias")
      .select("*")
      .eq("user_id", userId)
      .eq("fecha", hoy)

    if (existentes && existentes.length >= 3) {
      setMisiones(existentes)
      return
    }

    const tiposExistentes = (existentes || []).map(m => m.tipo)
    const disponibles = MISIONES_POOL.filter(m => !tiposExistentes.includes(m.tipo))
    const nuevas = mezclarPool(disponibles).slice(0, 3 - (existentes?.length || 0))

    if (nuevas.length > 0) {
      const { data: insertadas } = await supabase
        .from("misiones_diarias")
        .insert(nuevas.map(m => ({
          user_id: userId,
          fecha: hoy,
          tipo: m.tipo,
          descripcion: m.descripcion,
          icono: m.icono,
          meta: m.meta,
          xp_recompensa: m.xp ?? 15,
        })))
        .select()
      setMisiones([...(existentes || []), ...(insertadas || [])])
    } else {
      setMisiones(existentes || [])
    }
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      let { data: p } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()

      if (!p) {
        const { data: nuevo } = await supabase
          .from("users")
          .insert([{ id: user.id, email: user.email, xp_total: 0, racha_actual: 0, vidas: 5, ultima_vida_recargada: new Date().toISOString() }])
          .select()
          .single()
        p = nuevo
      }

      // Recargar vidas: 1 vida cada 30 minutos si vidas < 5
      if (p && p.vidas < 5 && p.ultima_vida_recargada) {
        const ahora = new Date()
        const ultima = new Date(p.ultima_vida_recargada)
        const minutos = Math.floor((ahora - ultima) / 60000)
        const vidasARecuperar = Math.floor(minutos / 30)

        if (vidasARecuperar > 0) {
          const nuevasVidas = Math.min(5, p.vidas + vidasARecuperar)
          await supabase.from("users").update({
            vidas: nuevasVidas,
            ultima_vida_recargada: new Date().toISOString(),
          }).eq("id", user.id)
          p = { ...p, vidas: nuevasVidas }
        } else {
          const minutosRestantes = 30 - (minutos % 30)
          setTiempoVida(minutosRestantes)
        }
      }

      setPerfil({ ...p, email: user.email })
      await cargarOGenerarMisiones(user.id)

      // Sonido de bienvenida — una vez por día
      const hoy = new Date().toISOString().split("T")[0]
      const keyLogin = `cl_login_${hoy}`
      if (!localStorage.getItem(keyLogin)) {
        localStorage.setItem(keyLogin, "1")
        setTimeout(() => sound.dailyLogin(), 600)
      }

      // Logros: chequear al cargar perfil
      if (p) {
        const newAchs = checkNewAchievements({
          xp:              p.xp_total         ?? 0,
          racha:           p.racha_actual     ?? 0,
          maxCombo:        p.max_combo        ?? 0,
          perfectSessions: p.perfect_sessions ?? 0,
          cleanSessions:   p.clean_sessions   ?? 0,
        })
        if (newAchs.length > 0) {
          setCurAch(newAchs[0])
          setAchQueue(newAchs.slice(1))
        }
      }

      setLoading(false)
    }
    init()
  }, [router])

  // Countdown en tiempo real: cada minuto re-evalúa si corresponde recargar una vida
  useEffect(() => {
    if (!perfil || perfil.vidas >= 5) return
    const userId = perfil.id
    const tick = async () => {
      const { data: fresh } = await supabase
        .from("users")
        .select("vidas, ultima_vida_recargada")
        .eq("id", userId)
        .single()
      if (!fresh || fresh.vidas >= 5) { setTiempoVida(null); return }
      const minutos = Math.floor((Date.now() - new Date(fresh.ultima_vida_recargada).getTime()) / 60000)
      const vidasGanadas = Math.floor(minutos / 30)
      if (vidasGanadas > 0) {
        const nuevasVidas = Math.min(5, fresh.vidas + vidasGanadas)
        await supabase.from("users").update({
          vidas: nuevasVidas,
          ultima_vida_recargada: new Date().toISOString(),
        }).eq("id", userId)
        setPerfil(prev => ({ ...prev, vidas: nuevasVidas }))
        setTiempoVida(nuevasVidas < 5 ? 30 : null)
      } else {
        setTiempoVida(30 - (minutos % 30))
      }
    }
    const id = setInterval(tick, 60000)
    return () => clearInterval(id)
  }, [perfil?.id, perfil?.vidas])

  const salir = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) return <LoadingConti texto="Preparando tu sesión..." />

  const xp = perfil?.xp_total || 0
  const rangoActual = [...RANGOS].reverse().find((r) => xp >= r.min) || RANGOS[0]
  const rangoIdx = RANGOS.indexOf(rangoActual)
  const rangoSiguiente = RANGOS[rangoIdx + 1]
  const xpBase = rangoActual.min
  const xpLimite = rangoSiguiente ? rangoSiguiente.min - xpBase : 60
  const xpEnRango = Math.min(xp - xpBase, xpLimite)
  const xpParaSiguiente = rangoSiguiente ? xpLimite - xpEnRango : 0
  const vidas = perfil?.vidas ?? 5
  const racha = perfil?.racha_actual ?? 0

  const diasSinEntrar = getDiasDesdeUltimaLeccion(perfil?.ultima_leccion_fecha)
  const fraseBuho     = getFrase({ diasSinEntrar, racha, vidas, xp })
  const rankTheme     = getRankTheme(xp)

  const estadoMascota = vidas === 0
    ? "triste"
    : diasSinEntrar >= 3
    ? "triste"
    : racha > 0
    ? "celebrando"
    : "hablando"

  return (
    <div
      className="min-h-screen pb-20 md:pt-20"
      style={{ background: "transparent" }}
    >
      <Navbar />

      {/* ── Wrapper responsive ── */}
      <PageTransition>
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-zinc-400 text-sm">Bienvenido de vuelta</p>
            <h1 className="text-2xl font-extrabold truncate max-w-xs">
              {perfil?.username || perfil?.email?.split("@")[0]}
            </h1>
          </div>
          <button
            onClick={salir}
            className="text-xs px-4 py-2 rounded-xl text-zinc-400 hover:text-white transition-all hover:bg-white/5"
            style={{ border: "1px solid var(--color-border)" }}
          >
            Salir
          </button>
        </div>

        {/* ── Grid principal: 1 col móvil · 2 col desktop ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

          {/* ══ Columna izquierda ══ */}
          <div className="flex flex-col gap-5">

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard icon="🔥" value={racha} label="Racha" color="var(--color-warning)" />
              <StatCard icon="⚡" value={xp}    label="XP Total" color="var(--color-info)" />
              <div
                className="rounded-2xl p-4 text-center"
                style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
              >
                <div className="text-2xl mb-1">❤️</div>
                <div className="text-xl font-extrabold" style={{ color: "var(--color-danger)" }}>{vidas}</div>
                <div className="text-xs text-zinc-400">Vidas</div>
                {vidas < 5 && tiempoVida && (
                  <div className="text-xs mt-1" style={{ color: "var(--color-warning)" }}>
                    +1 en {tiempoVida}min
                  </div>
                )}
              </div>
            </div>

            {/* Rango + barra XP */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-lg" style={{ color: rangoActual.color }}>
                  {rangoActual.emoji} {rangoActual.nombre}
                </span>
                <span className="text-sm text-zinc-400">
                  {rangoSiguiente ? `${xpEnRango}/${xpLimite} XP` : `${xp} XP total`}
                </span>
              </div>
              <div className="w-full rounded-full h-4" style={{ background: "#0d1a20" }}>
                <div
                  className="h-4 rounded-full transition-all duration-700"
                  style={{
                    width: rangoSiguiente ? `${(xpEnRango / xpLimite) * 100}%` : "100%",
                    background: rankTheme.bar,
                    boxShadow: `0 0 14px ${rankTheme.glow}`,
                  }}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                {rangoSiguiente
                  ? `${xpParaSiguiente} XP para ${rangoSiguiente.emoji} ${rangoSiguiente.nombre}`
                  : "¡Rango máximo alcanzado! 👑"}
              </p>
            </div>

            {/* Mascota + CTA */}
            <div
              className="flex items-center gap-4 rounded-2xl p-5"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
            >
              <Mascota
                estado={estadoMascota}
                size={90}
                mensaje={fraseBuho}
                xp={xp}
              />
              <div className="flex-1 flex flex-col gap-3">
                <p className="text-sm text-zinc-300 leading-relaxed">{fraseBuho}</p>
                <button
                  onClick={() => router.push("/niveles")}
                  className="w-full rounded-xl py-3 font-extrabold text-sm text-white transition-all active:scale-95 hover:brightness-110"
                  style={{
                    background: "var(--color-primary)",
                    boxShadow: "0 4px 0 var(--color-primary-dark), 0 0 20px rgba(88,204,2,0.25)",
                  }}
                >
                  ¡Continuar aprendiendo! 🚀
                </button>
              </div>
            </div>

            {/* Temario */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
            >
              <h2 className="font-bold mb-4 text-sm text-zinc-300 uppercase tracking-widest">
                Ruta de aprendizaje
              </h2>
              <div className="flex flex-col gap-3">
                {[
                  { emoji: "📖", title: "Fundamentos",      desc: "Activos, pasivos y patrimonio" },
                  { emoji: "⚖️", title: "Ecuación contable", desc: "A = P + Patrimonio" },
                  { emoji: "📝", title: "Asientos",          desc: "Partida doble y débitos" },
                  { emoji: "📊", title: "Estados financieros", desc: "Balance y P&G" },
                  { emoji: "🌍", title: "NIIF & Avanzado",   desc: "Normas internacionales" },
                ].map(({ emoji, title, desc }, i) => (
                  <div key={title} className="flex items-center gap-3 group">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: "rgba(88,204,2,0.08)", border: "1px solid rgba(88,204,2,0.15)" }}
                    >
                      {emoji}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{title}</p>
                      <p className="text-xs text-zinc-500">{desc}</p>
                    </div>
                    <div className="ml-auto">
                      <span className="text-xs text-zinc-600 font-mono">Nivel {i + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ══ Columna derecha ══ */}
          <div className="flex flex-col gap-5">

            {/* Misiones del día */}
            {misiones.length > 0 && (
              <div
                className="rounded-2xl p-5"
                style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold">🎯 Misiones de hoy</h2>
                  <span className="text-xs text-zinc-500">+15 XP c/u</span>
                </div>
                <div className="flex flex-col gap-4">
                  {misiones.map(m => {
                    const pct = Math.min(100, Math.round((m.progreso / m.meta) * 100))
                    return (
                      <div key={m.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold flex items-center gap-2">
                            <span>{m.icono}</span>
                            <span style={{ color: m.completada ? "var(--color-primary)" : "white" }}>
                              {m.descripcion}
                            </span>
                          </span>
                          <span className="text-xs font-bold flex-shrink-0 ml-2" style={{ color: "var(--color-warning)" }}>
                            {m.completada ? "✅" : `+${m.xp_recompensa} XP`}
                          </span>
                        </div>
                        <div className="w-full rounded-full h-2" style={{ background: "#0d1a20" }}>
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background: m.completada ? "var(--color-primary)" : "var(--color-info)",
                              boxShadow: m.completada ? "0 0 8px rgba(88,204,2,0.5)" : "0 0 8px rgba(28,176,246,0.4)",
                            }}
                          />
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">{m.progreso}/{m.meta}</p>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-zinc-600 mt-4 text-center">↺ Resetean a medianoche</p>
              </div>
            )}

            {/* Progreso rápido */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
            >
              <h2 className="font-bold mb-4">📈 Tu progreso</h2>
              <div className="grid grid-cols-2 gap-4">
                <MiniStat
                  label="Rango actual"
                  value={`${rangoActual.emoji} ${rangoActual.nombre}`}
                  color={rangoActual.color}
                />
                <MiniStat
                  label="XP ganado"
                  value={`${xp} XP`}
                  color="var(--color-info)"
                />
                <MiniStat
                  label="Racha actual"
                  value={`${racha} día${racha !== 1 ? "s" : ""}`}
                  color="var(--color-warning)"
                />
                <MiniStat
                  label="Vidas"
                  value={`${"❤️".repeat(Math.min(vidas, 5))}`}
                  color="var(--color-danger)"
                />
              </div>
            </div>

            {/* Acceso rápido */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
            >
              <h2 className="font-bold mb-4">⚡ Acceso rápido</h2>
              <div className="flex flex-col gap-3">
                <QuickBtn
                  icon="📚"
                  label="Ir a los niveles"
                  sub="Elige tu lección"
                  onClick={() => router.push("/niveles")}
                  color="var(--color-primary)"
                />
                <QuickBtn
                  icon="🏆"
                  label="Ver el ranking"
                  sub="¿Dónde estás?"
                  onClick={() => router.push("/ranking")}
                  color="var(--color-warning)"
                />
                <QuickBtn
                  icon="🏢"
                  label="Modo Empresa"
                  sub="Distribuidora Andes S.A."
                  onClick={() => router.push("/empresa")}
                  color="#eab308"
                />
                <QuickBtn
                  icon="🏅"
                  label="Mis logros"
                  sub="Ver todos tus logros"
                  onClick={() => router.push("/logros")}
                  color="#c084fc"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
      </PageTransition>

      {/* Achievement toast queue */}
      <AchievementToast
        achievement={curAch}
        onDone={() => {
          const next = achQueue[0] ?? null
          setCurAch(next)
          setAchQueue(q => q.slice(1))
        }}
      />

    </div>
  )
}

/* ── Componentes auxiliares ── */

function StatCard({ icon, value, label, color }) {
  return (
    <div
      className="rounded-2xl p-4 text-center"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xl font-extrabold" style={{ color }}>{value}</div>
      <div className="text-xs text-zinc-400">{label}</div>
    </div>
  )
}

function MiniStat({ label, value, color }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: "#0d1a20", border: "1px solid var(--color-border)" }}
    >
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className="text-sm font-bold" style={{ color }}>{value}</p>
    </div>
  )
}

function QuickBtn({ icon, label, sub, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 w-full text-left rounded-xl px-4 py-3 transition-all hover:brightness-110 active:scale-[0.98]"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${color}33`,
      }}
    >
      <span
        className="text-2xl w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18` }}
      >
        {icon}
      </span>
      <div>
        <p className="font-bold text-sm" style={{ color }}>{label}</p>
        <p className="text-xs text-zinc-500">{sub}</p>
      </div>
      <span className="ml-auto text-zinc-600">›</span>
    </button>
  )
}

