import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req) {
  try {
    const { nivelId, teoriaJson, preguntasVistasIds = [], preguntasEnSesion = [], dificultad = "normal" } = await req.json()

    // 1. Buscar en banco: misma dificultad, no vistas
    let query = supabase
      .from("nivel_preguntas")
      .select("*")
      .eq("nivel_id", nivelId)
      .eq("dificultad", dificultad)
    if (preguntasVistasIds.length > 0) {
      query = query.not("id", "in", `(${preguntasVistasIds.join(",")})`)
    }
    const { data: guardadas } = await query.limit(30)

    if (guardadas && guardadas.length > 0) {
      const p = guardadas[Math.floor(Math.random() * guardadas.length)]
      return Response.json({
        pregunta: {
          id: p.id,
          pregunta: p.pregunta,
          opciones: p.opciones.sort(() => Math.random() - 0.5),
          respuesta_correcta: p.respuesta_correcta,
          explicacion: p.explicacion,
        },
        fromCache: true,
      })
    }

    // 2. No hay en banco — leer preguntas existentes para evitar duplicados
    const { data: existentes } = await supabase
      .from("nivel_preguntas")
      .select("pregunta")
      .eq("nivel_id", nivelId)
      .eq("dificultad", dificultad)
      .limit(30)

    const todasAEvitar = [
      ...(existentes || []).map(e => e.pregunta),
      ...preguntasEnSesion,
    ]
    const evitar = todasAEvitar.length > 0
      ? `\n\nDEBES generar una pregunta COMPLETAMENTE DIFERENTE a estas (ni el mismo concepto ni parecida):\n${todasAEvitar.map(q => `- ${q}`).join("\n")}`
      : ""

    const slides = (teoriaJson || [])
      .map(s => `${s.titulo}: ${s.contenido}`)
      .join("\n\n")

    const nivelDificultad =
      dificultad === "facil"   ? "FÁCIL — conceptos básicos y directos, sin ambigüedad" :
      dificultad === "dificil" ? "DIFÍCIL — aplicación de normas, casos con múltiples pasos o situaciones ambiguas" :
                                 "NORMAL — comprensión y aplicación básica del concepto"

    const { content } = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `Eres un experto en contabilidad ecuatoriana. Genera una pregunta de evaluación basada en esta teoría:

${slides}

Dificultad: ${nivelDificultad}${evitar}

Pasos obligatorios antes de responder:
- La pregunta debe evaluar un concepto específico de la teoría.
- Define la respuesta correcta según normativa ecuatoriana (SRI, NIC, NIIF).
- La explicacion justifica exactamente por qué esa es la respuesta correcta.
- Crea 3 opciones incorrectas plausibles pero erróneas.

Reglas de formato OBLIGATORIAS:
- La pregunta debe tener máximo 12 palabras (corta y directa).
- Las opciones deben tener máximo 8 palabras cada una.
- Nada de párrafos largos ni casos narrativos.

Responde SOLO con este JSON, sin texto extra:
{
  "pregunta": "pregunta corta y directa (máx 12 palabras)",
  "opciones": ["opción correcta (máx 8 palabras)", "incorrecta 1", "incorrecta 2", "incorrecta 3"],
  "respuesta_correcta": "debe ser idéntica a opciones[0]",
  "explicacion": "justificación breve de por qué esa opción es correcta (máx 2 líneas)"
}`,
      }],
    })

    const texto = content[0].text.trim()
    const jsonMatch = texto.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("Respuesta no es JSON válido")
    const p = JSON.parse(jsonMatch[0])

    // 3. Guardar en banco con dificultad
    const { data: nueva } = await supabase
      .from("nivel_preguntas")
      .insert([{
        nivel_id: nivelId,
        pregunta: p.pregunta,
        opciones: p.opciones,
        respuesta_correcta: p.respuesta_correcta,
        explicacion: p.explicacion,
        dificultad,
      }])
      .select("id")
      .single()

    p.opciones = p.opciones.sort(() => Math.random() - 0.5)
    return Response.json({
      pregunta: { id: nueva?.id, ...p },
      fromCache: false,
    })
  } catch (err) {
    console.error("Error en /api/generar-leccion:", err?.message || err)
    return Response.json({ error: err?.message }, { status: 500 })
  }
}
