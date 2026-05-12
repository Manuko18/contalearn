import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
               "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

export async function POST(req) {
  try {
    const { mes, situacionesAnteriores = [] } = await req.json()

    const mesNombre = MESES[mes % 12]
    const dificultad = mes < 3 ? "básica" : mes < 6 ? "intermedia" : "avanzada"
    const evitar = situacionesAnteriores.length > 0
      ? `\nEvita repetir estas situaciones ya usadas: ${situacionesAnteriores.slice(-4).join(" | ")}`
      : ""

    const { content } = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{
        role: "user",
        content: `Eres un experto en contabilidad ecuatoriana. Genera un caso contable para "Distribuidora Andes S.A." (Quito).

Mes: ${mesNombre}. Dificultad: ${dificultad}.${evitar}

INSTRUCCIONES (sigue este orden exacto):
1. Piensa en una situación contable real que ocurre en ${mesNombre}.
2. Determina cuál es la acción contable CORRECTA según las normas ecuatorianas (SRI, NIC, NIIF).
3. Escribe la explicación de POR QUÉ esa acción es correcta.
4. Crea 3 opciones incorrectas pero plausibles.
5. Verifica que la explicación justifique exactamente la respuesta_correcta antes de responder.

Responde SOLO con este JSON exacto, sin texto adicional:
{
  "situacion": "descripción breve de la situación (1-2 oraciones, usa USD y datos ecuatorianos)",
  "pregunta": "¿Qué debe hacer el contador?",
  "respuesta_correcta": "la acción correcta según normativa ecuatoriana",
  "explicacion": "por qué ESA respuesta es correcta (debe coincidir 100% con respuesta_correcta)",
  "opciones": ["respuesta_correcta va aquí también", "opción incorrecta 1", "opción incorrecta 2", "opción incorrecta 3"]
}

IMPORTANTE: opciones[0] debe ser igual a respuesta_correcta. El orden se mezclará automáticamente.`,
      }],
    })

    const texto = content[0].text.trim()
    const jsonMatch = texto.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("Respuesta no es JSON válido")

    const caso = JSON.parse(jsonMatch[0])
    caso.opciones = caso.opciones.sort(() => Math.random() - 0.5)
    return Response.json({ caso, mes: mesNombre })
  } catch (err) {
    console.error("Error en /api/empresa:", err?.message || err)
    return Response.json({ error: err?.message }, { status: 500 })
  }
}
