import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req) {
  try {
    const { nivelNombre, nivelDescripcion, preguntasAnteriores = [] } = await req.json()

    const evitar = preguntasAnteriores.length > 0
      ? `\nEvita repetir estos temas ya preguntados: ${preguntasAnteriores.slice(-5).join(" | ")}`
      : ""

    const { content } = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{
        role: "user",
        content: `Eres un generador de ejercicios de contabilidad ecuatoriana para la app ContaLearn.

Tema del nivel: ${nivelNombre}
Descripción: ${nivelDescripcion}${evitar}

Genera UNA pregunta de opción múltiple sobre este tema. Usa contexto ecuatoriano (SRI, IESS, RUC, USD).

Responde SOLO con este JSON exacto, sin texto adicional:
{
  "pregunta": "texto de la pregunta",
  "opciones": ["opción A", "opción B", "opción C", "opción D"],
  "respuesta_correcta": "texto exacto de la opción correcta",
  "explicacion": "por qué esa es la respuesta correcta (2 líneas máx)"
}`,
      }],
    })

    const texto = content[0].text.trim()
    const jsonMatch = texto.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("Respuesta no es JSON válido")

    const ejercicio = JSON.parse(jsonMatch[0])
    return Response.json({ ejercicio })
  } catch (err) {
    console.error("Error en /api/generar-ejercicio:", err?.message || err)
    return Response.json({ error: err?.message }, { status: 500 })
  }
}
