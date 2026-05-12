import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req) {
  try {
    const { pregunta_id, pregunta_texto, respuesta_correcta, explicacion, reportado_por } = await req.json()

    // Claude Sonnet analiza si la pregunta realmente tiene un error
    const { content } = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      messages: [{
        role: "user",
        content: `Eres un experto en contabilidad y tributación ecuatoriana. Analiza esta pregunta de práctica y determina si tiene un error.

PREGUNTA: ${pregunta_texto}
RESPUESTA MARCADA COMO CORRECTA: ${respuesta_correcta}
EXPLICACIÓN: ${explicacion}

¿La respuesta correcta y la explicación son consistentes y correctas según la normativa ecuatoriana (SRI, NIIF, NIC)?

Responde SOLO con este JSON:
{
  "tiene_error": true o false,
  "razon": "explicación breve de por qué tiene error o por qué está correcta"
}`,
      }],
    })

    const texto = content[0].text.trim()
    const jsonMatch = texto.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("Respuesta Sonnet inválida")

    const analisis = JSON.parse(jsonMatch[0])

    if (analisis.tiene_error) {
      // Guardar reporte solo si Sonnet confirma que está mal
      await supabase.from("reportes_preguntas").insert([{
        pregunta_id: pregunta_id || null,
        pregunta_texto,
        respuesta_correcta,
        explicacion,
        reportado_por: reportado_por || null,
      }])
      return Response.json({ guardado: true, razon: analisis.razon })
    }

    // La pregunta está bien — no guardar reporte
    return Response.json({ guardado: false, razon: analisis.razon })
  } catch (err) {
    console.error("Error en /api/reportar:", err?.message || err)
    // Si falla Sonnet, guardar el reporte igual para no perderlo
    return Response.json({ guardado: true, razon: "Error al analizar — guardado para revisión manual" })
  }
}
