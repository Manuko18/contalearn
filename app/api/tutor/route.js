import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req) {
  try {
    const { messages, nivelNombre, nivelDescripcion } = await req.json()

    if (!messages?.length) {
      return Response.json({ error: "Sin mensajes" }, { status: 400 })
    }

    // Obtener errores recientes del usuario si viene token de sesión
    let erroresContext = ""
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (token) {
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      )
      const { data: { user } } = await sb.auth.getUser()
      if (user) {
        const { data: mistakes } = await sb
          .from("user_mistakes")
          .select("pregunta, tu_respuesta, respuesta_correcta")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5)

        if (mistakes?.length) {
          erroresContext = `\n\nEl usuario ha cometido estos errores recientes:\n${mistakes
            .map(m => `- Pregunta: ${m.pregunta} | Su respuesta: ${m.tu_respuesta} | Correcta: ${m.respuesta_correcta}`)
            .join("\n")}`
        }
      }
    }

    const systemPrompt = `Eres Conti, tutor experto en contabilidad y tributación ecuatoriana de la app ContaLearn.

REGLAS ABSOLUTAS:
1. Solo respondes preguntas sobre contabilidad, tributación ecuatoriana, NIF/RUC, SRI, IESS, y el tema del nivel actual.
2. Si el usuario pregunta algo fuera de estos temas, responde EXACTAMENTE: "Solo puedo ayudarte con temas contables y tributarios. ¿Tienes alguna duda sobre ${nivelNombre || "el tema actual"}?"
3. Nunca hagas tareas ajenas (no escribas código, no hagas traducciones, no cuentes chistes, no ayudes con otras materias).
4. Usa siempre ejemplos con datos ecuatorianos: moneda USD, menciona SRI, IESS, RUC, documentos RIDE.
5. Sé conciso y didáctico. Máximo 4 párrafos cortos por respuesta.
6. Si no sabes algo específico del reglamento ecuatoriano, dilo claramente.

CONTEXTO DEL NIVEL ACTUAL:
Tema: ${nivelNombre || "Contabilidad general"}
Descripción: ${nivelDescripcion || "Principios de contabilidad ecuatoriana"}${erroresContext}

Ayuda al estudiante a entender este tema de forma práctica. Si hay errores recientes, aprovecha para aclarar esos conceptos cuando sea pertinente.`

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    })

    return Response.json({ respuesta: response.content[0].text })
  } catch (err) {
    console.error("Error en /api/tutor:", err?.message || err)
    return Response.json({ error: err?.message }, { status: 500 })
  }
}
