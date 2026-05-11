"use client"

export const dynamic = "force-dynamic"

import { useEffect, useRef, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"
import Navbar from "../../components/Navbar"
import LoadingConti from "../../components/LoadingConti"

const PREGUNTAS_RAPIDAS = [
  { icon: "📖", texto: "Explícame el tema principal de este nivel" },
  { icon: "🇪🇨", texto: "Dame un ejemplo práctico con datos ecuatorianos" },
  { icon: "🤔", texto: "¿Cuáles son los errores más comunes en este tema?" },
  { icon: "📝", texto: "¿Cómo se aplica esto en la vida real de una empresa?" },
]

function TutorInner() {
  const router = useRouter()
  const params = useSearchParams()
  const nivelId = params.get("nivel")

  const [nivel, setNivel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [pensando, setPensando] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      if (nivelId) {
        const { data } = await supabase
          .from("niveles")
          .select("id, titulo, descripcion, emoji")
          .eq("id", nivelId)
          .single()
        setNivel(data)
      }
      setLoading(false)
    }
    cargar()
  }, [nivelId, router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, pensando])

  const enviar = async (texto) => {
    const msg = texto.trim()
    if (!msg || pensando) return

    const nuevos = [...messages, { role: "user", content: msg }]
    setMessages(nuevos)
    setInput("")
    setPensando(true)

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nuevos,
          nivelNombre: nivel?.titulo ?? "",
          nivelDescripcion: nivel?.descripcion ?? "",
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: "assistant", content: data.respuesta || "Error al obtener respuesta." }])
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Ocurrió un error. Intenta de nuevo." }])
    } finally {
      setPensando(false)
      inputRef.current?.focus()
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <LoadingConti texto="Cargando tutor..." />
      </>
    )
  }

  return (
    <div className="min-h-screen flex flex-col md:pt-20" style={{ background: "transparent" }}>
      <Navbar />

      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-4 py-4">

        {/* Header tutor */}
        <div
          className="rounded-2xl p-4 mb-4 flex items-center gap-3"
          style={{
            background: "rgba(37,99,235,0.12)",
            border: "1.5px solid rgba(37,99,235,0.3)",
          }}
        >
          <button
            onClick={() => router.back()}
            className="text-zinc-400 hover:text-white transition-colors text-xl flex-shrink-0"
          >
            ←
          </button>
          <div className="text-2xl">{nivel?.emoji || "🤖"}</div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Tutor IA</p>
            <h1 className="text-base font-extrabold text-white">
              {nivel?.titulo || "Contabilidad"}
            </h1>
            <p className="text-xs text-zinc-400">Solo temas contables · Ecuador</p>
          </div>
        </div>

        {/* Mensajes */}
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto mb-4 min-h-0">

          {messages.length === 0 && (
            <div className="py-4">
              <p className="text-center text-zinc-500 text-sm mb-4">
                ¿Qué quieres preguntarme sobre <strong className="text-zinc-300">{nivel?.titulo || "este tema"}</strong>?
              </p>
              <div className="grid grid-cols-1 gap-2">
                {PREGUNTAS_RAPIDAS.map((q) => (
                  <button
                    key={q.texto}
                    onClick={() => enviar(q.texto)}
                    className="text-left rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 flex items-center gap-3"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1.5px solid rgba(255,255,255,0.08)",
                      color: "#d1d5db",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "rgba(37,99,235,0.15)"
                      e.currentTarget.style.borderColor = "rgba(37,99,235,0.4)"
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)"
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
                    }}
                  >
                    <span className="text-xl flex-shrink-0">{q.icon}</span>
                    {q.texto}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-1"
                  style={{ background: "rgba(37,99,235,0.2)", border: "1px solid rgba(37,99,235,0.4)" }}>
                  🤖
                </div>
              )}
              <div
                className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                style={
                  m.role === "user"
                    ? { background: "rgba(37,99,235,0.25)", border: "1px solid rgba(37,99,235,0.4)", color: "#e2e8f0" }
                    : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#d1d5db" }
                }
              >
                {m.content.split("\n").map((linea, j) => (
                  <p key={j} className={j > 0 ? "mt-2" : ""}>{linea}</p>
                ))}
              </div>
            </div>
          ))}

          {pensando && (
            <div className="flex justify-start items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: "rgba(37,99,235,0.2)", border: "1px solid rgba(37,99,235,0.4)" }}>
                🤖
              </div>
              <div
                className="rounded-2xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <span className="text-zinc-400 text-sm">Pensando</span>
                <span className="inline-flex gap-1 ml-2">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block"
                      style={{ animation: `bounce 1s infinite ${i * 0.2}s` }}
                    />
                  ))}
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          className="rounded-2xl p-2 flex gap-2 items-end"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1.5px solid rgba(255,255,255,0.1)",
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                enviar(input)
              }
            }}
            placeholder="Escribe tu pregunta sobre contabilidad..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 resize-none outline-none px-2 py-2 leading-relaxed"
            style={{ maxHeight: "120px" }}
            onInput={e => {
              e.target.style.height = "auto"
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"
            }}
          />
          <button
            onClick={() => enviar(input)}
            disabled={!input.trim() || pensando}
            className="rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 flex-shrink-0"
            style={{
              background: input.trim() && !pensando ? "#2563eb" : "rgba(255,255,255,0.06)",
              color: input.trim() && !pensando ? "#fff" : "#4b5563",
              cursor: input.trim() && !pensando ? "pointer" : "not-allowed",
            }}
          >
            Enviar
          </button>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-2">
          Solo respondo preguntas de contabilidad y tributación ecuatoriana
        </p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}

export default function TutorPage() {
  return (
    <Suspense fallback={<LoadingConti texto="Cargando tutor..." />}>
      <TutorInner />
    </Suspense>
  )
}
