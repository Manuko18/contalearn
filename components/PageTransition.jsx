"use client"

import { useEffect, useState } from "react"

/**
 * Envuelve contenido con una animación fade+slide al montar.
 * Uso: <PageTransition> ... contenido ... </PageTransition>
 */
export default function PageTransition({ children, className = "" }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Un pequeño delay para que el browser pinte el frame inicial
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div
      className={className}
      style={{
        opacity:    ready ? 1 : 0,
        transform:  ready ? "translateY(0)" : "translateY(14px)",
        transition: "opacity 0.38s cubic-bezier(.16,1,.3,1), transform 0.38s cubic-bezier(.16,1,.3,1)",
      }}
    >
      {children}
    </div>
  )
}
