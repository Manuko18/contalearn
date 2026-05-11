import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req) {
  try {
    const { errores, nivel, historial = [] } = await req.json()

    if (!errores?.length) {
      return Response.json({ explicaciones: [] })
    }

    const listaErrores = errores.map((e, i) =>
      `ERROR_${i + 1}:\nPregunta: "${e.pregunta}"\nEstudiante respondió: "${e.tuRespuesta}"\nRespuesta correcta: "${e.respuestaCorrecta}"`
    ).join("\n\n")

    const contextoHistorial = historial.length > 0
      ? `\n\nHISTORIAL DE ERRORES PREVIOS DEL ESTUDIANTE EN ESTE NIVEL (últimas sesiones):\n${historial.map(h => `- "${h.pregunta}" → respondió "${h.tu_respuesta}" (correcto: "${h.respuesta_correcta}")`).join("\n")}\n\nSi ves un patrón de error repetido, menciónalo en el campo PRACTICA.`
      : ""

    const { content } = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: `Eres un tutor de contabilidad para Ecuador. Analiza estos ${errores.length} errores.${contextoHistorial}

${listaErrores}

Responde EXACTAMENTE en este formato, sin markdown, sin asteriscos, separando cada error con "===":

CONCEPTO: (1 línea)
EJEMPLO: (ejemplo con datos ecuatorianos: USD, RUC, SRI, IESS)
ERROR: (qué confundió exactamente)
PRACTICA: (qué repasar)
===
CONCEPTO: ...
EJEMPLO: ...
ERROR: ...
PRACTICA: ...
===

Un bloque por cada error, en el mismo orden. Máximo 2 líneas por campo.`,
      }],
    })

    const texto = content[0].text
    const bloques = texto.split(/===+/).map(b => b.trim()).filter(Boolean)

    const explicaciones = errores.map((_, i) => {
      const bloque = bloques[i] || ""
      const get = (label) => {
        const match = bloque.match(new RegExp(`${label}:\\s*([\\s\\S]*?)(?=\\n(?:CONCEPTO|EJEMPLO|ERROR|PRACTICA):|$)`))
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
  } catch (err) {
    console.error("Error en /api/explicar:", err?.message || err)
    return Response.json({ explicaciones: [], error: err?.message }, { status: 500 })
  }
}
