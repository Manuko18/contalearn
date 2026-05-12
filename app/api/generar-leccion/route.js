import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const ANGULOS = [
  "Pregunta sobre la DEFINICIÓN o concepto principal del tema.",
  "Pregunta con un EJEMPLO PRÁCTICO o caso numérico concreto (usa montos en USD).",
  "Pregunta que COMPARE o distinga entre dos conceptos relacionados del tema.",
  "Pregunta sobre una NORMA, artículo o reglamento específico (SRI, NIC, NIIF, Código Tributario).",
  "Pregunta que identifique un ERROR COMÚN o concepto erróneo frecuente en este tema.",
]

export async function POST(req) {
  try {
    const { nivelId, teoriaJson, preguntasVistasIds = [], preguntasEnSesion = [], dificultad = "normal", angulo = 0 } = await req.json()

    // Asignar slide específico según ángulo — cada pregunta cubre un slide diferente
    const allSlides = teoriaJson || []
    const slideIdx = allSlides.length > 0 ? angulo % allSlides.length : 0
    const slideActual = allSlides[slideIdx]
    const slideTema = slideActual
      ? `${slideActual.titulo}: ${slideActual.contenido}`
      : allSlides.map(s => `${s.titulo}: ${s.contenido}`).join("\n\n")

    // 1. Buscar en banco: mismo slide, misma dificultad, no vistas
    let query = supabase
      .from("nivel_preguntas")
      .select("*")
      .eq("nivel_id", nivelId)
      .eq("dificultad", dificultad)
      .eq("slide_idx", slideIdx)
    if (preguntasVistasIds.length > 0) {
      query = query.not("id", "in", `(${preguntasVistasIds.join(",")})`)
    }
    const { data: guardadas } = await query.limit(30)

    if (guardadas && guardadas.length > 0) {
      const p = guardadas[Math.floor(Math.random() * guardadas.length)]
      return Response.json({
        pregunta: {
          id: p.id,
          pregunta: p.pregunta,
          opciones: p.opciones.sort(() => Math.random() - 0.5),
          respuesta_correcta: p.respuesta_correcta,
          explicacion: p.explicacion,
        },
        fromCache: true,
      })
    }

    // 2. No hay en banco — leer existentes del mismo slide para evitar duplicados
    const { data: existentes } = await supabase
      .from("nivel_preguntas")
      .select("pregunta")
      .eq("nivel_id", nivelId)
      .eq("dificultad", dificultad)
      .eq("slide_idx", slideIdx)
      .limit(30)

    const todasAEvitar = [
      ...(existentes || []).map(e => e.pregunta),
      ...preguntasEnSesion,
    ]
    const evitar = todasAEvitar.length > 0
      ? `\n\nDEBES generar una pregunta COMPLETAMENTE DIFERENTE a estas:\n${todasAEvitar.map(q => `- ${q}`).join("\n")}`
      : ""

    const nivelDificultad =
      dificultad === "facil"   ? "FÁCIL — conceptos básicos y directos, sin ambigüedad" :
      dificultad === "dificil" ? "DIFÍCIL — aplicación de normas, casos con múltiples pasos o situaciones ambiguas" :
                                 "NORMAL — comprensión y aplicación básica del concepto"

    const tipoAngulo = ANGULOS[angulo % ANGULOS.length]

    const { content } = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `Eres un experto en contabilidad ecuatoriana. Genera una pregunta de evaluación sobre este tema específico:

${slideTema}

Dificultad: ${nivelDificultad}
Tipo de pregunta OBLIGATORIO: ${tipoAngulo}${evitar}

Pasos obligatorios:
- La pregunta debe ser EXCLUSIVAMENTE sobre el tema indicado arriba.
- Sigue ESTRICTAMENTE el tipo de pregunta indicado.
- Define la respuesta correcta según normativa ecuatoriana (SRI, NIC, NIIF).
- La explicacion justifica exactamente por qué esa es la respuesta correcta.
- Crea 3 opciones incorrectas plausibles pero erróneas.

Reglas de formato OBLIGATORIAS:
- La pregunta debe tener máximo 12 palabras (corta y directa).
- Las opciones deben tener máximo 8 palabras cada una.
- Nada de párrafos largos ni casos narrativos.

Responde SOLO con este JSON, sin texto extra:
{
  "pregunta": "pregunta corta y directa (máx 12 palabras)",
  "opciones": ["opción correcta (máx 8 palabras)", "incorrecta 1", "incorrecta 2", "incorrecta 3"],
  "respuesta_correcta": "debe ser idéntica a opciones[0]",
  "explicacion": "justificación breve de por qué esa opción es correcta (máx 2 líneas)"
}`,
      }],
    })

    const texto = content[0].text.trim()
    const jsonMatch = texto.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("Respuesta no es JSON válido")
    const p = JSON.parse(jsonMatch[0])

    // 3. Guardar en banco con slide_idx y dificultad
    const { data: nueva } = await supabase
      .from("nivel_preguntas")
      .insert([{
        nivel_id: nivelId,
        pregunta: p.pregunta,
        opciones: p.opciones,
        respuesta_correcta: p.respuesta_correcta,
        explicacion: p.explicacion,
        dificultad,
        slide_idx: slideIdx,
      }])
      .select("id")
      .single()

    p.opciones = p.opciones.sort(() => Math.random() - 0.5)
    return Response.json({
      pregunta: { id: nueva?.id, ...p },
      fromCache: false,
    })
  } catch (err) {
    console.error("Error en /api/generar-leccion:", err?.message || err)
    return Response.json({ error: err?.message }, { status: 500 })
  }
}
