import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const TIPOS = ["multiple_choice", "verdadero_falso", "completar_espacio"]

const ANGULOS = [
  "Pregunta sobre la DEFINICIÓN o concepto principal del tema.",
  "Pregunta con un EJEMPLO PRÁCTICO o caso numérico concreto (usa montos en USD).",
  "Pregunta que COMPARE o distinga entre dos conceptos relacionados del tema.",
  "Pregunta sobre una NORMA, artículo o reglamento específico (SRI, NIC, NIIF, Código Tributario).",
  "Pregunta que identifique un ERROR COMÚN o concepto erróneo frecuente en este tema.",
]

function promptPorTipo(tipo, slideTema, nivelDificultad, tipoAngulo, evitar) {
  if (tipo === "verdadero_falso") {
    return `Eres un experto en contabilidad ecuatoriana. Genera una pregunta de verdadero o falso sobre este tema:

${slideTema}

Dificultad: ${nivelDificultad}
Enfoque: ${tipoAngulo}${evitar}

Pasos obligatorios:
- Escribe una AFIRMACIÓN corta sobre el tema (no una pregunta).
- Decide si es verdadera o falsa según normativa ecuatoriana (SRI, NIC, NIIF).
- La explicacion justifica por qué es verdadera o falsa.

Reglas de formato OBLIGATORIAS:
- La afirmación debe tener máximo 12 palabras.
- Varía entre afirmaciones verdaderas y falsas (no siempre el mismo).

Responde SOLO con este JSON, sin texto extra:
{
  "pregunta": "afirmación corta sobre el tema (máx 12 palabras)",
  "respuesta_correcta": "true",
  "explicacion": "justificación breve (máx 2 líneas)"
}`
  }

  if (tipo === "completar_espacio") {
    return `Eres un experto en contabilidad ecuatoriana. Genera un ejercicio de completar el espacio sobre este tema:

${slideTema}

Dificultad: ${nivelDificultad}
Enfoque: ${tipoAngulo}${evitar}

Pasos obligatorios:
- Escribe una oración con un espacio en blanco indicado con _____.
- La respuesta debe ser UNA SOLA PALABRA o término técnico exacto (sin alternativas, sin "o", sin barras).
- El espacio debe poder completarse con una única respuesta correcta obvia.
- La explicacion justifica por qué esa es la respuesta correcta.

Reglas de formato OBLIGATORIAS:
- La oración completa debe tener máximo 15 palabras.
- La respuesta_correcta debe ser MÁXIMO 2 PALABRAS, sin alternativas ni sinónimos.
- NUNCA uses "X o Y", "X / Y" ni múltiples opciones como respuesta.

Responde SOLO con este JSON, sin texto extra:
{
  "pregunta": "oración con _____ en el lugar de la respuesta (máx 15 palabras)",
  "respuesta_correcta": "una sola palabra o término exacto (máx 2 palabras)",
  "explicacion": "justificación breve (máx 2 líneas)"
}`
  }

  // multiple_choice (default)
  return `Eres un experto en contabilidad ecuatoriana. Genera una pregunta de opción múltiple sobre este tema:

${slideTema}

Dificultad: ${nivelDificultad}
Tipo de pregunta OBLIGATORIO: ${tipoAngulo}${evitar}

Pasos obligatorios:
- La pregunta debe ser EXCLUSIVAMENTE sobre el tema indicado.
- Define la respuesta correcta según normativa ecuatoriana (SRI, NIC, NIIF).
- La explicacion justifica exactamente por qué esa es la respuesta correcta.
- Crea 3 opciones incorrectas plausibles pero erróneas.

Reglas de formato OBLIGATORIAS:
- La pregunta debe tener máximo 12 palabras (corta y directa).
- Las opciones deben tener máximo 8 palabras cada una.

Responde SOLO con este JSON, sin texto extra:
{
  "pregunta": "pregunta corta y directa (máx 12 palabras)",
  "opciones": ["opción correcta (máx 8 palabras)", "incorrecta 1", "incorrecta 2", "incorrecta 3"],
  "respuesta_correcta": "debe ser idéntica a opciones[0]",
  "explicacion": "justificación breve de por qué esa opción es correcta (máx 2 líneas)"
}`
}

export async function POST(req) {
  try {
    const { nivelId, teoriaJson, preguntasVistasIds = [], preguntasEnSesion = [], dificultad = "normal", angulo = 0, tipo: tipoParam } = await req.json()

    const allSlides = teoriaJson || []
    const slideIdx = allSlides.length > 0 ? angulo % allSlides.length : 0
    const slideActual = allSlides[slideIdx]
    const slideTema = slideActual
      ? `${slideActual.titulo}: ${slideActual.contenido}`
      : allSlides.map(s => `${s.titulo}: ${s.contenido}`).join("\n\n")

    // tipo viene del cliente (orden aleatorio por sesión); fallback al patrón fijo
    const tipo = TIPOS.includes(tipoParam) ? tipoParam : TIPOS[angulo % TIPOS.length]

    const MAX_POR_DIFICULTAD = 10

    // Contar total en banco para este nivel+dificultad
    const { count: totalBanco } = await supabase
      .from("nivel_preguntas")
      .select("*", { count: "exact", head: true })
      .eq("nivel_id", nivelId)
      .eq("dificultad", dificultad)

    const bancoLleno = (totalBanco ?? 0) >= MAX_POR_DIFICULTAD

    // 1. Buscar en banco: mismo slide, mismo tipo, misma dificultad
    // Si banco lleno: ignorar vistas (rota preguntas existentes, no genera más)
    let query = supabase
      .from("nivel_preguntas")
      .select("*")
      .eq("nivel_id", nivelId)
      .eq("dificultad", dificultad)
      .eq("slide_idx", slideIdx)
      .eq("tipo", tipo)
    if (!bancoLleno && preguntasVistasIds.length > 0) {
      query = query.not("id", "in", `(${preguntasVistasIds.join(",")})`)
    }
    const { data: guardadas } = await query.limit(30)

    if (guardadas && guardadas.length > 0) {
      const p = guardadas[Math.floor(Math.random() * guardadas.length)]
      return Response.json({
        pregunta: {
          id: p.id,
          tipo,
          pregunta: p.pregunta,
          opciones: p.opciones ? p.opciones.sort(() => Math.random() - 0.5) : null,
          respuesta_correcta: p.respuesta_correcta,
          explicacion: p.explicacion,
        },
        fromCache: true,
      })
    }

    // Si banco lleno pero no hay para este slide+tipo específico, buscar sin filtro slide+tipo
    if (bancoLleno) {
      const { data: cualquiera } = await supabase
        .from("nivel_preguntas")
        .select("*")
        .eq("nivel_id", nivelId)
        .eq("dificultad", dificultad)
        .limit(30)
      if (cualquiera && cualquiera.length > 0) {
        const p = cualquiera[Math.floor(Math.random() * cualquiera.length)]
        return Response.json({
          pregunta: {
            id: p.id,
            tipo: p.tipo || tipo,
            pregunta: p.pregunta,
            opciones: p.opciones ? p.opciones.sort(() => Math.random() - 0.5) : null,
            respuesta_correcta: p.respuesta_correcta,
            explicacion: p.explicacion,
          },
          fromCache: true,
        })
      }
    }

    // 2. Leer existentes del mismo slide+tipo para evitar duplicados
    const { data: existentes } = await supabase
      .from("nivel_preguntas")
      .select("pregunta")
      .eq("nivel_id", nivelId)
      .eq("dificultad", dificultad)
      .eq("slide_idx", slideIdx)
      .eq("tipo", tipo)
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

    const prompt = promptPorTipo(tipo, slideTema, nivelDificultad, tipoAngulo, evitar)

    const { content } = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    })

    const texto = content[0].text.trim()
    const jsonMatch = texto.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("Respuesta no es JSON válido")
    const p = JSON.parse(jsonMatch[0])

    // 3. Guardar en banco
    const { data: nueva } = await supabase
      .from("nivel_preguntas")
      .insert([{
        nivel_id: nivelId,
        pregunta: p.pregunta,
        opciones: p.opciones || null,
        respuesta_correcta: p.respuesta_correcta,
        explicacion: p.explicacion,
        dificultad,
        slide_idx: slideIdx,
        tipo,
      }])
      .select("id")
      .single()

    if (p.opciones) p.opciones = p.opciones.sort(() => Math.random() - 0.5)
    return Response.json({
      pregunta: { id: nueva?.id, tipo, ...p },
      fromCache: false,
    })
  } catch (err) {
    console.error("Error en /api/generar-leccion:", err?.message || err)
    return Response.json({ error: err?.message }, { status: 500 })
  }
}
