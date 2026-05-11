import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const TEMAS_PERMITIDOS = [
  "contabilidad", "tributación", "impuestos", "SRI", "IESS", "RUC",
  "factura", "balance", "activo", "pasivo", "patrimonio", "debe", "haber",
  "asiento", "diario", "mayor", "inventario", "depreciación", "amortización",
  "IVA", "retención", "declaración", "estados financieros", "flujo de caja",
  "cuentas por cobrar", "cuentas por pagar", "nómina", "rol de pagos",
]

export async function POST(req) {
  try {
    const { messages, nivelNombre, nivelDescripcion } = await req.json()

    if (!messages?.length) {
      return Response.json({ error: "Sin mensajes" }, { status: 400 })
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
Descripción: ${nivelDescripcion || "Principios de contabilidad ecuatoriana"}

Ayuda al estudiante a entender este tema de forma práctica.`

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
