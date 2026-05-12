import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
               "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

export async function POST(req) {
  try {
    const { mes, preguntasVistasIds = [], dificultad: difUsuario = "normal" } = await req.json()

    const mesNombre = MESES[mes % 12]
    const dificultadMes = mes < 3 ? "básica" : mes < 6 ? "intermedia" : "avanzada"

    // 1. Buscar pregunta guardada que no haya visto el usuario, filtrando por dificultad si aplica
    let query = supabase
      .from("empresa_preguntas")
      .select("*")
      .eq("mes", mes)
    if (difUsuario === "facil") query = query.eq("dificultad", "facil")
    if (preguntasVistasIds.length > 0) {
      query = query.not("id", "in", `(${preguntasVistasIds.join(",")})`)
    }
    const { data: guardadas } = await query.limit(20)

    if (guardadas && guardadas.length > 0) {
      // Elegir una al azar del banco
      const pregunta = guardadas[Math.floor(Math.random() * guardadas.length)]
      const caso = {
        situacion: pregunta.situacion,
        pregunta: pregunta.pregunta,
        opciones: pregunta.opciones.sort(() => Math.random() - 0.5),
        respuesta_correcta: pregunta.respuesta_correcta,
        explicacion: pregunta.explicacion,
      }
      return Response.json({ caso, mes: mesNombre, id: pregunta.id, fromCache: true })
    }

    // 2. No hay en el banco — generar con IA
    const { content } = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `Eres un experto en contabilidad ecuatoriana. Genera un caso contable para "Distribuidora Andes S.A." (Quito).

Mes: ${mesNombre}. Dificultad: ${difUsuario === "facil" ? "FÁCIL — concepto básico y directo, sin ambigüedad" : dificultadMes}.

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

    // 3. Guardar en el banco para futuros usuarios
    const { data: nueva } = await supabase
      .from("empresa_preguntas")
      .insert([{
        mes,
        situacion: caso.situacion,
        pregunta: caso.pregunta,
        opciones: caso.opciones,
        respuesta_correcta: caso.respuesta_correcta,
        explicacion: caso.explicacion,
        dificultad: difUsuario === "facil" ? "facil" : "normal",
      }])
      .select("id")
      .single()

    caso.opciones = caso.opciones.sort(() => Math.random() - 0.5)
    return Response.json({ caso, mes: mesNombre, id: nueva?.id, fromCache: false })
  } catch (err) {
    console.error("Error en /api/empresa:", err?.message || err)
    return Response.json({ error: err?.message }, { status: 500 })
  }
}
