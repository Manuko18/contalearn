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
        content: `Eres generador de casos contables para una empresa ecuatoriana ficticia llamada "Distribuidora Andes S.A." ubicada en Quito.

Mes actual: ${mesNombre}. Dificultad: ${dificultad}.${evitar}

Genera UNA situación contable realista que le ocurre a esta empresa en ${mesNombre}. Usa montos en USD, menciona SRI/IESS/RUC cuando aplique.

Responde SOLO con este JSON exacto, sin texto adicional:
{
  "situacion": "descripción breve de la situación que ocurrió (1-2 oraciones)",
  "pregunta": "¿Qué debe hacer el contador?",
  "opciones": ["opción A", "opción B", "opción C", "opción D"],
  "respuesta_correcta": "texto exacto de la opción correcta",
  "explicacion": "por qué esa es la acción correcta (2 líneas máx)"
}`,
      }],
    })

    const texto = content[0].text.trim()
    const jsonMatch = texto.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("Respuesta no es JSON válido")

    const caso = JSON.parse(jsonMatch[0])
    return Response.json({ caso, mes: mesNombre })
  } catch (err) {
    console.error("Error en /api/empresa:", err?.message || err)
    return Response.json({ error: err?.message }, { status: 500 })
  }
}
