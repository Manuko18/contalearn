"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../lib/supabaseClient"
import Navbar from "../components/Navbar"
import Mascota from "../components/Mascota"
import LoadingConti from "../components/LoadingConti"
import AchievementToast from "../components/AchievementToast"
import { getFrase, getDiasDesdeUltimaLeccion } from "../lib/frases"
import { getRankTheme } from "../lib/rankTheme"
import { sound } from "../lib/audio"
import { checkNewAchievements } from "../lib/achievements"
import Onboarding from "../components/Onboarding"
import Particles from "../components/Particles"

// ── Pool de misiones disponibles ──
const MISIONES_POOL = [
  { tipo: "responder_preguntas_5",  descripcion: "Responde 5 preguntas hoy",                    icono: "📝", meta: 5,   xp: 10 },
  { tipo: "racha_combo_3",          descripcion: "Consigue un combo de 3 correctas seguidas",   icono: "🔥", meta: 3,   xp: 10 },
  { tipo: "responder_preguntas",    descripcion: "Responde 10 preguntas hoy",                   icono: "📝", meta: 10,  xp: 15 },
  { tipo: "completar_subniveles",   descripcion: "Completa 2 sub-niveles hoy",                  icono: "🏆", meta: 2,   xp: 15 },
  { tipo: "sin_perder_vida",        descripcion: "Termina una sesión sin perder ninguna vida",  icono: "❤️", meta: 1,   xp: 15 },
  { tipo: "xp_ganar",               descripcion: "Gana 50 XP jugando hoy",                     icono: "⚡", meta: 50,  xp: 15 },
  { tipo: "correctas_seguidas",     descripcion: "Consigue 5 respuestas correctas seguidas",    icono: "🎯", meta: 5,   xp: 25 },
  { tipo: "xp_ganar_100",           descripcion: "Gana 100 XP en un día",                      icono: "💎", meta: 100, xp: 25 },
  { tipo: "completar_subniveles_3", descripcion: "Completa 3 sub-niveles hoy",                  icono: "🏅", meta: 3,   xp: 25 },
  { tipo: "racha_combo_5",          descripcion: "Alcanza un combo de 5 correctas seguidas",    icono: "⚡", meta: 5,   xp: 25 },
]

function mezclarPool(arr) { return [...arr].sort(() => Math.random() - 0.5) }

const RANGOS = [
  { nombre: "Bronce",      emoji: "🥉", color: "#cd7f32", min: 0    },
  { nombre: "Plata",       emoji: "🥈", color: "#a8a8a8", min: 60   },
  { nombre: "Oro",         emoji: "🥇", color: "#ffd700", min: 120  },
  { nombre: "Platino",     emoji: "💎", color: "#00d4aa", min: 180  },
  { nombre: "Diamante",    emoji: "💠", color: "#60a5fa", min: 240  },
  { nombre: "Maestro",     emoji: "👑", color: "#c084fc", min: 300  },
  { nombre: "Gran Maestro",emoji: "🔮", color: "#e879f9", min: 500  },
  { nombre: "Leyenda",     emoji: "⚡", color: "#fbbf24", min: 800  },
  { nombre: "Élite",       emoji: "🌟", color: "#f472b6", min: 1200 },
]

export default function Home() {
  const router = useRouter()
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tiempoVida, setTiempoVida] = useState(null)
  const [misiones, setMisiones] = useState([])
  const [achQueue, setAchQueue]     = useState([])
  const [curAch, setCurAch]         = useState(null)
  const [bonusBanner, setBonusBanner] = useState(null)
  const [bonusKey, setBonusKey]       = useState(0)
  const [misionSemanal, setMisionSemanal] = useState(null)
  const [tieneErrores, setTieneErrores] = useState(false)
  const [nivelesRuta, setNivelesRuta] = useState([])

  function getLunes() {
    const hoy = new Date()
    const dia = hoy.getDay()
    const diff = dia === 0 ? -6 : 1 - dia
    const lunes = new Date(hoy)
    lunes.setDate(hoy.getDate() + diff)
    return lunes.toISOString().split("T")[0]
  }

  async function cargarOGenerarMisionSemanal(userId) {
    const lunes = getLunes()
    const { data: existente } = await supabase
      .from("misiones_diarias")
      .select("*")
      .eq("user_id", userId)
      .eq("fecha", lunes)
      .eq("tipo", "completar_niveles_semana")
      .maybeSingle()

    if (existente) {
      setMisionSemanal(existente)
      return
    }

    const { data: nueva } = await supabase
      .from("misiones_diarias")
      .insert([{
        user_id:       userId,
        fecha:         lunes,
        tipo:          "completar_niveles_semana",
        tipo_periodo:  "semanal",
        descripcion:   "Completa 3 niveles esta semana",
        icono:         "📅",
        meta:          3,
        progreso:      0,
        xp_recompensa: 100,
      }])
      .select()
      .single()
    setMisionSemanal(nueva ?? null)
  }

  async function cargarOGenerarMisiones(userId) {
    const hoy = new Date().toISOString().split("T")[0]
    const { data: existentes } = await supabase
      .from("misiones_diarias")
      .select("*")
      .eq("user_id", userId)
      .eq("fecha", hoy)

    if (existentes && existentes.length >= 3) {
      setMisiones(existentes)
      localStorage.setItem("cl_misiones_pendientes", existentes.filter(m => !m.completada).length.toString())
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
      const todas = [...(existentes || []), ...(insertadas || [])]
      setMisiones(todas)
      localStorage.setItem("cl_misiones_pendientes", todas.filter(m => !m.completada).length.toString())
    } else {
      setMisiones(existentes || [])
      localStorage.setItem("cl_misiones_pendientes", (existentes || []).filter(m => !m.completada).length.toString())
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
          setTiempoVida(30 - (minutos % 30))
        }
      }

      const { data: nivelesData } = await supabase
        .from("niveles")
        .select("id, titulo, descripcion, emoji, orden")
        .order("orden", { ascending: true })
      setNivelesRuta(nivelesData || [])

      const { data: erroresCheck } = await supabase
        .from("user_mistakes")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
      setTieneErrores((erroresCheck?.length ?? 0) > 0)

      setPerfil({ ...p, email: user.email })
      await cargarOGenerarMisiones(user.id)
      await cargarOGenerarMisionSemanal(user.id)

      const hoy = new Date().toISOString().split("T")[0]
      const keyLogin = `cl_login_${hoy}`
      if (!localStorage.getItem(keyLogin)) {
        localStorage.setItem(keyLogin, "1")
        setTimeout(() => sound.dailyLogin(), 600)
      }

      const keyRegreso = `cl_regreso_${hoy}`
      if (!localStorage.getItem(keyRegreso) && p?.ultima_leccion_fecha) {
        const ultima = new Date(p.ultima_leccion_fecha)
        const diasAusente = Math.floor((Date.now() - ultima.getTime()) / 86400000)
        if (diasAusente >= 2) {
          localStorage.setItem(keyRegreso, "1")
          const xpActual = p.xp_total ?? 0
          await supabase.from("users").update({ xp_total: xpActual + 20 }).eq("id", user.id)
          p = { ...p, xp_total: xpActual + 20 }
          setBonusBanner({ msg: `¡Volviste después de ${diasAusente} días!`, xp: 20 })
          setBonusKey(k => k + 1)
          setTimeout(() => setBonusBanner(null), 5000)
        }
      }

      if (!localStorage.getItem("cl_migracion_xp_v1") && p) {
        localStorage.setItem("cl_migracion_xp_v1", "1")
        const STORAGE_KEY = "cl_achievements_v2"
        const xpActual = p.xp_total ?? 0
        const desbloqueados = (() => {
          try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") } catch { return [] }
        })()
        const nuevosLogros = [
          { id: "xp_500",  name: "Gran Maestro", icon: "🔮", rarity: "epic",      rarityInfo: { label: "Épico",      color: "#c084fc", glow: "rgba(192,132,252,0.45)" }, umbral: 500  },
          { id: "xp_800",  name: "Leyenda",       icon: "⚡", rarity: "epic",      rarityInfo: { label: "Épico",      color: "#c084fc", glow: "rgba(192,132,252,0.45)" }, umbral: 800  },
          { id: "xp_1200", name: "Élite",         icon: "🌟", rarity: "legendary", rarityInfo: { label: "Legendario", color: "#ffd700", glow: "rgba(255,215,0,0.55)"   }, umbral: 1200 },
        ].filter(l => xpActual >= l.umbral && !desbloqueados.includes(l.id))
        if (nuevosLogros.length) {
          const actualizados = [...desbloqueados, ...nuevosLogros.map(l => l.id)]
          localStorage.setItem(STORAGE_KEY, JSON.stringify(actualizados))
          setCurAch(nuevosLogros[0])
          setAchQueue(nuevosLogros.slice(1))
        }
      }

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
  const vidas = perfil?.vidas ?? 5
  const racha = perfil?.racha_actual ?? 0
  const diasSinEntrar = getDiasDesdeUltimaLeccion(perfil?.ultima_leccion_fecha)

  const estadoMascota = vidas === 0 ? "triste"
    : diasSinEntrar >= 3 ? "triste"
    : racha > 0 ? "celebrando"
    : "hablando"

  const nombre = perfil?.username || perfil?.email?.split("@")[0] || "?"
  const inicial = nombre[0]?.toUpperCase() || "?"
  const rangoProgresoPct = rangoSiguiente
    ? Math.min(100, ((xp - rangoActual.min) / (rangoSiguiente.min - rangoActual.min)) * 100)
    : 100

  return (
    <div className="qs">
      <div className="qs-bg-orb qs-bg-orb-1" />
      <div className="qs-bg-orb qs-bg-orb-2" />

      <Navbar />

      <div className="scr-scroll" style={{ paddingTop: 24 }}>

        {/* Greeting */}
        <header className="dash-greet">
          <div>
            <div className="dash-hello">¡Hola, <b>{nombre}</b>!</div>
            <div className="dash-sub">Sigamos aprendiendo contabilidad</div>
          </div>
          <button className="dash-avatar" onClick={salir} title="Salir">{inicial}</button>
        </header>

        {/* Stats row */}
        <div className="dash-stats">
          <div className="dash-stat stat-streak">
            <div className="dash-stat-ico">🔥</div>
            <div className="dash-stat-num">{racha}</div>
            <div className="dash-stat-lbl">días de racha</div>
          </div>
          <div className="dash-stat stat-xp">
            <div className="dash-stat-ico">✨</div>
            <div className="dash-stat-num">{xp}</div>
            <div className="dash-stat-lbl">XP total</div>
          </div>
          <div className="dash-stat stat-lives">
            <div className="dash-stat-ico-lives">
              {[0,1,2,3,4].map(i => (
                <span key={i} className={`mini-heart${i < vidas ? " on" : ""}`}>♥</span>
              ))}
            </div>
            <div className="dash-stat-num">{vidas}/5</div>
            <div className="dash-stat-lbl">{vidas < 5 && tiempoVida ? `+1 en ${tiempoVida}m` : "vidas"}</div>
          </div>
        </div>

        {/* Rango + mascota */}
        <div className="dash-rank-card">
          <div className="dash-rank-mascot">
            <Mascota estado={estadoMascota} size={80} xp={xp} />
          </div>
          <div className="dash-rank-info">
            <div className="dash-rank-row">
              <span className="dash-rank-emoji">{rangoActual.emoji}</span>
              <span className="dash-rank-name" style={{ color: rangoActual.color }}>{rangoActual.nombre}</span>
            </div>
            <div className="dash-rank-track">
              <div className="dash-rank-fill" style={{
                width: `${rangoProgresoPct}%`,
                background: rangoSiguiente
                  ? `linear-gradient(90deg, ${rangoActual.color}, ${rangoSiguiente.color})`
                  : rangoActual.color,
              }} />
            </div>
            <div className="dash-rank-meta">
              <span>{xp} XP</span>
              {rangoSiguiente
                ? <span>Faltan <b style={{ color: rangoSiguiente.color }}>{rangoSiguiente.min - xp} XP</b> para {rangoSiguiente.emoji} {rangoSiguiente.nombre}</span>
                : <b>¡Rango máximo! 👑</b>}
            </div>
          </div>
        </div>

        {/* Misión semanal */}
        {misionSemanal && (() => {
          const pct = Math.min(100, Math.round((misionSemanal.progreso / misionSemanal.meta) * 100))
          return (
            <>
              <div className="dash-section-hdr">
                <span>Misión semanal</span>
                <span className="dash-section-sub">{misionSemanal.completada ? "✅ Completada" : `${misionSemanal.progreso}/${misionSemanal.meta} niveles`}</span>
              </div>
              <div className="dash-mission-weekly">
                <div className="dash-weekly-glow" />
                <div className="dash-weekly-row">
                  <div className="dash-weekly-ico">🎯</div>
                  <div className="dash-weekly-text">
                    <div className="dash-weekly-title">{misionSemanal.descripcion}</div>
                    <div className="dash-weekly-sub">{misionSemanal.progreso} de {misionSemanal.meta} niveles completados</div>
                  </div>
                  <div className="dash-weekly-rew">
                    <span className="dash-rew-num">+{misionSemanal.xp_recompensa}</span>
                    <span className="dash-rew-lbl">XP</span>
                  </div>
                </div>
                <div className="dash-weekly-track">
                  <div className="dash-weekly-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </>
          )
        })()}

        {/* Misiones diarias */}
        {misiones.length > 0 && (
          <>
            <div className="dash-section-hdr">
              <span>Misiones diarias</span>
              <span className="dash-section-sub">↺ Reset a medianoche</span>
            </div>
            <div className="dash-daily-list">
              {misiones.map(m => {
                const pct = Math.min(100, Math.round((m.progreso / m.meta) * 100))
                return (
                  <div key={m.id} className={`dash-daily${m.completada ? " done" : ""}`}>
                    <div className="dash-daily-ico">{m.icono}</div>
                    <div className="dash-daily-body">
                      <div className="dash-daily-title">{m.descripcion}</div>
                      <div className="dash-daily-track">
                        <div className="dash-daily-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="dash-daily-meta">
                        <span>{m.progreso}/{m.meta}</span>
                        <span className="dash-daily-rew">+{m.xp_recompensa} XP {m.completada ? "✓" : ""}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Acceso rápido */}
        <div className="dash-section-hdr"><span>Acceso rápido</span></div>
        <div className="dash-grid">
          <button className="dash-quick tone-green" onClick={() => router.push("/niveles")}>
            <div className="dash-quick-ico">📚</div>
            <div className="dash-quick-body">
              <div className="dash-quick-label">Niveles</div>
              <div className="dash-quick-sub">Lecciones 1–8</div>
            </div>
          </button>
          <button className="dash-quick tone-gold" onClick={() => router.push("/ranking")}>
            <div className="dash-quick-ico">🏆</div>
            <div className="dash-quick-body">
              <div className="dash-quick-label">Ranking</div>
              <div className="dash-quick-sub">¿Dónde estás?</div>
            </div>
          </button>
          <button className="dash-quick tone-cyan" onClick={() => router.push("/empresa")}>
            <div className="dash-quick-ico">🏢</div>
            <div className="dash-quick-body">
              <div className="dash-quick-label">Empresa</div>
              <div className="dash-quick-sub">Distribuidora Andes</div>
            </div>
          </button>
          <button className="dash-quick tone-violet" onClick={() => router.push("/logros")}>
            <div className="dash-quick-ico">🎖</div>
            <div className="dash-quick-body">
              <div className="dash-quick-label">Logros</div>
              <div className="dash-quick-sub">Tus medallas</div>
            </div>
          </button>
        </div>

        {/* Repasar errores */}
        {tieneErrores && (
          <button className="dash-repasar" onClick={() => router.push("/repasar")}>
            <div className="dash-repasar-ico">🔁</div>
            <div className="dash-repasar-body">
              <div className="dash-repasar-title">Repasar errores</div>
              <div className="dash-repasar-sub">Tienes preguntas pendientes · sin XP</div>
            </div>
            <div className="dash-repasar-arrow">→</div>
          </button>
        )}

        <div className="dash-bottom-spacer" />
      </div>

      {bonusKey > 0 && <Particles key={bonusKey} preset="xpGain" />}

      {bonusBanner && (
        <div className="fixed top-20 left-1/2 z-[80] animate-pop-in" style={{ transform: "translateX(-50%)", pointerEvents: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderRadius: 16, fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", background: "rgba(6,20,10,0.97)", border: "1.5px solid var(--accent-green)", boxShadow: "0 4px 24px rgba(34,197,94,0.3)", color: "#fff" }}>
            <span style={{ fontSize: 20 }}>🎉</span>
            <div>
              <p>{bonusBanner.msg}</p>
              <p style={{ color: "var(--accent-green-bright)" }}>+{bonusBanner.xp} XP de bienvenida</p>
            </div>
          </div>
        </div>
      )}

      <Onboarding />

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
