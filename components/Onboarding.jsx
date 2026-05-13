"use client"

import { useState, useEffect } from "react"

const SLIDES = [
  {
    emoji: "❤️",
    title: "Tus vidas",
    body: "Tienes 5 vidas. Pierdes 1 por cada respuesta incorrecta o cuando se acaba el tiempo. Se recarga 1 vida cada 30 minutos — ¡no las desperdicies!",
  },
  {
    emoji: "⚡",
    title: "XP y rangos",
    body: "Cada respuesta correcta te da +10 XP. Acumula XP para subir de Bronce a Plata, Oro, Platino, Diamante y Maestro. Las misiones diarias dan XP extra.",
  },
  {
    emoji: "📚",
    title: "Niveles y progresión",
    body: "Hay 8 niveles de contabilidad. Dentro de cada nivel debes superar Fácil → Normal → Difícil (≥70% de aciertos) para desbloquear el siguiente nivel.",
  },
]

const KEY = "cl_onboarding_v1"

export default function Onboarding() {
  const [visible, setVisible] = useState(false)
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setVisible(true)
  }, [])

  function cerrar() {
    localStorage.setItem(KEY, "1")
    setVisible(false)
  }

  if (!visible) return null

  const { emoji, title, body } = SLIDES[slide]
  const esUltimo = slide === SLIDES.length - 1

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-7 flex flex-col items-center text-center gap-4"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "0 8px 48px rgba(88,204,2,0.12)" }}
      >
        {/* Indicadores */}
        <div className="flex gap-2 self-center">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{ width: i === slide ? 24 : 8, background: i <= slide ? "var(--color-primary)" : "var(--color-border)" }}
            />
          ))}
        </div>

        <span className="text-6xl">{emoji}</span>
        <h2 className="text-2xl font-extrabold">{title}</h2>
        <p className="text-zinc-400 leading-relaxed text-sm">{body}</p>

        <button
          onClick={() => esUltimo ? cerrar() : setSlide(s => s + 1)}
          className="w-full rounded-2xl py-4 font-extrabold text-white transition-all active:scale-95"
          style={{ background: "var(--color-primary)", boxShadow: "0 4px 0 var(--color-primary-dark)" }}
        >
          {esUltimo ? "¡Empezar a aprender! 🚀" : "Siguiente →"}
        </button>

        {!esUltimo && (
          <button onClick={cerrar} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            Saltar tutorial
          </button>
        )}
      </div>
    </div>
  )
}
