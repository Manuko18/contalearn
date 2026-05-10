import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req) {
  const { errores, nivel } = await req.json()

  if (!errores?.length) {
    return Response.json({ explicaciones: [] })
  }

  const listaErrores = errores.map((e, i) =>
    `${i + 1}. Pregunta: "${e.pregunta}"
   Respuesta del estudiante: "${e.tuRespuesta}"
   Respuesta correcta: "${e.respuestaCorrecta}"`
  ).join("\n\n")

  const { content } = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `Eres un tutor de contabilidad para Ecuador. Analiza estos errores del estudiante en el nivel "${nivel}".

${listaErrores}

Para cada error responde en este formato exacto (sin markdown, sin asteriscos):

[N] CONCEPTO: (1 línea explicando el concepto clave)
EJEMPLO: (ejemplo numérico concreto con datos ecuatorianos: USD, RUC, SRI, IESS según aplique)
ERROR: (qué parte específica del cálculo o asiento falló)
PRACTICA: (qué debe repasar o ejercitar)

Máximo 3 líneas por sección. Directo y útil.`,
    }],
  })

  const texto = content[0].text
  const bloques = texto.split(/\[\d+\]/).filter(Boolean)

  const explicaciones = errores.map((_, i) => {
    const bloque = bloques[i] || ""
    const get = (label) => {
      const match = bloque.match(new RegExp(`${label}:([\\s\\S]*?)(?=CONCEPTO:|EJEMPLO:|ERROR:|PRACTICA:|$)`))
      return match ? match[1].trim() : ""
    }
    return {
      concepto: get("CONCEPTO"),
      ejemplo: get("EJEMPLO"),
      error: get("ERROR"),
      practica: get("PRACTICA"),
    }
  })

  return Response.json({ explicaciones })
}
