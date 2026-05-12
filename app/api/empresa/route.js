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
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `Eres un experto en contabilidad ecuatoriana. Genera un caso contable para "Distribuidora Andes S.A." (Quito).

Mes: ${mesNombre}. Dificultad: ${dificultad}.${evitar}

Pasos obligatorios antes de responder:
- Define la respuesta correcta según normativa ecuatoriana (SRI, NIC, NIIF).
- Escribe la explicacion justificando ESA respuesta. La explicacion debe describir exactamente lo que dice respuesta_correcta.
- Crea 3 opciones incorrectas plausibles.

Responde SOLO con este JSON, sin texto extra:
{
  "situacion": "situación real de la empresa en ${mesNombre} (1-2 oraciones, montos en USD)",
  "pregunta": "¿Qué debe hacer el contador?",
  "opciones": ["opción correcta", "incorrecta 1", "incorrecta 2", "incorrecta 3"],
  "respuesta_correcta": "debe ser idéntica a opciones[0]",
  "explicacion": "justificación de por qué esa opción es la correcta (máx 2 líneas)"
}`,
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
