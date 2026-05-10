"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"
import Mascota from "../../components/Mascota"
import PageTransition from "../../components/PageTransition"

export default function LoginPage() {
  const [tab, setTab]         = useState("login")
  const [nombre, setNombre]   = useState("")
  const [email, setEmail]     = useState("")
  const [password, setPassword] = useState("")
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje]   = useState(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push("/")
    })
  }, [router])

  const registrar = async () => {
    if (!nombre.trim() || !email || !password) {
      setMensaje({ tipo: "error", texto: "Completa todos los campos" }); return
    }
    if (password.length < 6) {
      setMensaje({ tipo: "error", texto: "La contraseña debe tener al menos 6 caracteres" }); return
    }
    setCargando(true); setMensaje(null)

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setMensaje({ tipo: "error", texto: error.message }); setCargando(false); return }

    if (data.user) {
      await supabase.from("users").upsert([{
        id: data.user.id, email, username: nombre.trim(),
        xp_total: 0, racha_actual: 0, vidas: 5,
        ultima_vida_recargada: new Date().toISOString(),
      }])
    }

    setCargando(false)
    setMensaje({ tipo: "ok", texto: "✅ Revisa tu correo para confirmar tu cuenta. Luego inicia sesión." })
    setTab("login")
  }

  const ingresar = async () => {
    if (!email || !password) { setMensaje({ tipo: "error", texto: "Completa todos los campos" }); return }
    setCargando(true); setMensaje(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const texto = error.message.includes("Email not confirmed")
        ? "Confirma tu correo primero"
        : error.message.includes("Invalid login")
        ? "Correo o contraseña incorrectos"
        : error.message
      setMensaje({ tipo: "error", texto })
      setCargando(false); return
    }
    router.push("/")
  }

  const cambiarTab = (t) => {
    setTab(t); setMensaje(null)
    setEmail(""); setPassword(""); setNombre("")
  }

  const estadoMascota = mensaje?.tipo === "error" ? "triste" : mensaje?.tipo === "ok" ? "celebrando" : "hablando"

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: "transparent" }}
    >
      <PageTransition className="w-full max-w-sm">

        {/* Logo + Mascota */}
        <div className="text-center mb-8">
          <Mascota
            estado={estadoMascota}
            size={100}
            mensaje={tab === "login" ? "¡Hola! Ingresa para aprender 🎓" : "¡Crea tu cuenta y empieza! 🚀"}
          />
          <h1
            className="text-4xl font-extrabold mt-3 tracking-tight"
            style={{
              color: "var(--color-primary)",
              textShadow: "0 0 30px rgba(88,204,2,0.4)",
            }}
          >
            ContaLearn
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">Aprende contabilidad jugando ⚡</p>
        </div>

        {/* Card glassmorphism */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(31,45,53,0.75)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(88,204,2,0.14)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
          }}
        >
          {/* Tabs */}
          <div className="flex" style={{ borderBottom: "1px solid rgba(45,63,74,0.8)" }}>
            {["login", "registro"].map((t) => (
              <button
                key={t}
                onClick={() => cambiarTab(t)}
                className="flex-1 py-3.5 font-bold text-sm transition-all duration-200"
                style={{
                  color: tab === t ? "var(--color-primary)" : "#6b7280",
                  background: tab === t ? "rgba(88,204,2,0.06)" : "transparent",
                  borderBottom: tab === t ? "2px solid var(--color-primary)" : "2px solid transparent",
                  boxShadow: tab === t ? "0 0 20px rgba(88,204,2,0.1)" : "none",
                }}
              >
                {t === "login" ? "Iniciar sesión" : "Registrarse"}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Mensaje de estado */}
            {mensaje && (
              <div
                className="rounded-xl px-4 py-3 mb-5 text-sm font-medium animate-pop-in"
                style={{
                  background: mensaje.tipo === "ok" ? "rgba(88,204,2,0.1)" : "rgba(255,75,75,0.1)",
                  border: `1px solid ${mensaje.tipo === "ok" ? "rgba(88,204,2,0.4)" : "rgba(255,75,75,0.4)"}`,
                  color: mensaje.tipo === "ok" ? "var(--color-primary)" : "var(--color-danger)",
                }}
              >
                {mensaje.texto}
              </div>
            )}

            {/* Nombre (registro) */}
            {tab === "registro" && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  placeholder="ej: contamaster99"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="input-glow w-full rounded-xl px-4 py-3 text-white text-sm"
                  style={{
                    background: "rgba(13,26,32,0.8)",
                    border: "1.5px solid var(--color-border)",
                    outline: "none",
                  }}
                />
              </div>
            )}

            {/* Email */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Correo electrónico
              </label>
              <input
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-glow w-full rounded-xl px-4 py-3 text-white text-sm"
                style={{
                  background: "rgba(13,26,32,0.8)",
                  border: "1.5px solid var(--color-border)",
                  outline: "none",
                }}
              />
            </div>

            {/* Contraseña */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Contraseña
              </label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (tab === "login" ? ingresar() : registrar())}
                className="input-glow w-full rounded-xl px-4 py-3 text-white text-sm"
                style={{
                  background: "rgba(13,26,32,0.8)",
                  border: "1.5px solid var(--color-border)",
                  outline: "none",
                }}
              />
            </div>

            {/* Botón principal */}
            <button
              onClick={tab === "login" ? ingresar : registrar}
              disabled={cargando}
              className="btn-glow w-full rounded-xl py-3.5 font-extrabold text-white disabled:opacity-50"
              style={{
                background: cargando
                  ? "var(--color-primary-dark)"
                  : "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
                boxShadow: "0 4px 0 var(--color-primary-dark)",
              }}
            >
              {cargando ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Cargando...
                </span>
              ) : tab === "login" ? "⚡ Entrar" : "🚀 Crear cuenta"}
            </button>

            {/* Recuperar contraseña */}
            {tab === "login" && (
              <button
                onClick={async () => {
                  if (!email) { setMensaje({ tipo: "error", texto: "Escribe tu correo primero" }); return }
                  setCargando(true)
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                  })
                  setCargando(false)
                  setMensaje(error
                    ? { tipo: "error", texto: error.message }
                    : { tipo: "ok",   texto: "📩 Revisa tu correo para resetear tu contraseña" }
                  )
                }}
                className="w-full text-center text-xs mt-4 py-2 transition-colors duration-200 hover:text-white"
                style={{ color: "#64748b" }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </div>
        </div>

        {/* Features grid */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: "🎯", label: "Lecciones cortas" },
            { icon: "🏆", label: "Gana XP"         },
            { icon: "🔥", label: "Racha diaria"     },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl"
              style={{ background: "rgba(31,45,53,0.5)", border: "1px solid var(--color-border)" }}
            >
              <span className="text-2xl">{icon}</span>
              <span className="text-xs text-zinc-400 font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </PageTransition>
    </div>
  )
}
