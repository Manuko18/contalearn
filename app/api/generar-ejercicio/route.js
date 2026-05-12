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
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `Eres un experto en contabilidad ecuatoriana. Genera un ejercicio de práctica para ContaLearn.

Tema: ${nivelNombre}
Descripción: ${nivelDescripcion}${evitar}

Pasos obligatorios antes de responder:
- Define la respuesta correcta según normativa ecuatoriana (SRI, NIC, NIIF).
- Escribe la explicacion justificando ESA respuesta. La explicacion debe describir exactamente lo que dice respuesta_correcta.
- Crea 3 opciones incorrectas plausibles.

Responde SOLO con este JSON, sin texto extra:
{
  "pregunta": "pregunta sobre el tema (usa USD y contexto ecuatoriano)",
  "opciones": ["opción correcta", "incorrecta 1", "incorrecta 2", "incorrecta 3"],
  "respuesta_correcta": "debe ser idéntica a opciones[0]",
  "explicacion": "justificación de por qué esa opción es la correcta (máx 2 líneas)"
}`,
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
