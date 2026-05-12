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
        content: `Eres un experto en contabilidad ecuatoriana. Genera un ejercicio de práctica para ContaLearn.

Tema: ${nivelNombre}
Descripción: ${nivelDescripcion}${evitar}

INSTRUCCIONES (sigue este orden exacto):
1. Elige un concepto específico del tema.
2. Determina la respuesta CORRECTA según normativa ecuatoriana (SRI, NIC, NIIF).
3. Escribe la explicación de POR QUÉ esa respuesta es correcta.
4. Crea 3 opciones incorrectas pero plausibles.
5. Verifica que la explicación justifique exactamente la respuesta_correcta antes de responder.

Responde SOLO con este JSON exacto, sin texto adicional:
{
  "pregunta": "pregunta clara sobre el tema (usa USD y contexto ecuatoriano)",
  "respuesta_correcta": "la respuesta correcta",
  "explicacion": "por qué ESA respuesta es correcta (debe coincidir 100% con respuesta_correcta)",
  "opciones": ["respuesta_correcta va aquí también", "opción incorrecta 1", "opción incorrecta 2", "opción incorrecta 3"]
}

IMPORTANTE: opciones[0] debe ser igual a respuesta_correcta. El orden se mezclará automáticamente.`,
      }],
    })

    const texto = content[0].text.trim()
    const jsonMatch = texto.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("Respuesta no es JSON válido")

    const ejercicio = JSON.parse(jsonMatch[0])
    ejercicio.opciones = ejercicio.opciones.sort(() => Math.random() - 0.5)
    return Response.json({ ejercicio })
  } catch (err) {
    console.error("Error en /api/generar-ejercicio:", err?.message || err)
    return Response.json({ error: err?.message }, { status: 500 })
  }
}
