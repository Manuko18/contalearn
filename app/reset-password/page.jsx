"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const router = useRouter()

  useEffect(() => {
    // Supabase maneja el token automáticamente al cargar la página
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // Listo para cambiar contraseña
      }
    })
  }, [])

  const cambiar = async () => {
    if (!password || !confirmar) {
      setMensaje({ tipo: "error", texto: "Completa todos los campos" })
      return
    }
    if (password.length < 6) {
      setMensaje({ tipo: "error", texto: "Mínimo 6 caracteres" })
      return
    }
    if (password !== confirmar) {
      setMensaje({ tipo: "error", texto: "Las contraseñas no coinciden" })
      return
    }

    setCargando(true)
    const { error } = await supabase.auth.updateUser({ password })
    setCargando(false)

    if (error) {
      setMensaje({ tipo: "error", texto: error.message })
    } else {
      setMensaje({ tipo: "ok", texto: "✅ Contraseña actualizada" })
      setTimeout(() => router.push("/"), 1500)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--color-bg)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔑</div>
          <h1 className="text-2xl font-extrabold">Nueva contraseña</h1>
          <p className="text-zinc-400 text-sm mt-1">Elige una contraseña segura</p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          {mensaje && (
            <div
              className="rounded-xl px-4 py-3 mb-4 text-sm font-medium"
              style={{
                background: mensaje.tipo === "ok" ? "#0d2e14" : "#2e0d0d",
                border: `1px solid ${mensaje.tipo === "ok" ? "var(--color-primary)" : "var(--color-danger)"}`,
                color: mensaje.tipo === "ok" ? "var(--color-primary)" : "var(--color-danger)",
              }}
            >
              {mensaje.texto}
            </div>
          )}

          <div className="mb-3">
            <label className="block text-sm text-zinc-400 mb-1">Nueva contraseña</label>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl px-4 py-3 outline-none text-white"
              style={{ background: "#0d1a20", border: "2px solid var(--color-border)" }}
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm text-zinc-400 mb-1">Confirmar contraseña</label>
            <input
              type="password"
              placeholder="Repite la contraseña"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && cambiar()}
              className="w-full rounded-xl px-4 py-3 outline-none text-white"
              style={{ background: "#0d1a20", border: "2px solid var(--color-border)" }}
            />
          </div>

          <button
            onClick={cambiar}
            disabled={cargando}
            className="w-full rounded-xl py-3 font-bold text-white transition-all active:scale-95 disabled:opacity-50"
            style={{ background: "var(--color-primary)", boxShadow: "0 4px 0 var(--color-primary-dark)" }}
          >
            {cargando ? "Guardando..." : "Guardar contraseña"}
          </button>
        </div>
      </div>
    </div>
  )
}
