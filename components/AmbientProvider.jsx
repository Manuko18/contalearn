"use client"

import { useEffect } from "react"
import { startAmbient, stopAmbient } from "../lib/ambient"

/**
 * Monta el ambient una sola vez para toda la app.
 * Arranca con el primer clic/toque del usuario (requisito del navegador).
 */
export default function AmbientProvider() {
  useEffect(() => {
    const start = () => {
      startAmbient()
      window.removeEventListener("click",      start)
      window.removeEventListener("touchstart", start)
    }
    window.addEventListener("click",      start, { passive: true })
    window.addEventListener("touchstart", start, { passive: true })
    return () => {
      stopAmbient()
      window.removeEventListener("click",      start)
      window.removeEventListener("touchstart", start)
    }
  }, [])

  return null
}
