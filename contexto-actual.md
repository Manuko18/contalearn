# ContaLearn — Contexto actual
> Última actualización: 2026-05-12

---

## Estado de la app (qué funciona hoy)

- Login / registro / recuperar contraseña ✅
- Dashboard: XP, vidas, racha, rango, misiones del día ✅
- **8 niveles lineales** agrupados en 4 categorías (Básico/Intermedio/Avanzado/Experto) ✅
- Niveles 1–5: contabilidad básica → avanzada ✅
- Niveles 6–8: tributación (IVA/DIAN, Renta, Liquidación) ✅
- **Modo 🧪 Test**: desbloquea todo, da 99 vidas, NO guarda XP/progreso ✅
- Teoría con voz sincronizada palabra por palabra ✅
- Juego: timer 30s, vidas, combo, sonidos, partículas ✅
- **Feedback inmediato al fallar**: muestra respuesta correcta + explicación del campo `explicacion_error` ✅
- **Explicaciones IA al final** (pantalla resultados): Claude Haiku genera concepto, ejemplo numérico ecuatoriano, error específico y qué practicar ✅ *(pendiente: pagar créditos Anthropic)*
- XP y progreso guardados en Supabase (solo fuera de modo Test) ✅
- Ranking global ✅
- Recarga automática de vidas (+1 cada 30 min) ✅
- Misiones diarias con progreso y XP bonus ✅
- Sistema de rangos (Bronce → Maestro, 0–300 XP) ✅
- Sistema de logros con toasts animados ✅
- RLS habilitado en Supabase (todas las tablas protegidas) ✅
- BD limpia: 119 lecciones, solo `multiple_choice` y `verdadero_falso` ✅
- Deploy en Vercel: contalearn.vercel.app ✅

---

## En qué punto quedamos

Última sesión (2026-05-12): limpieza BD + integración Claude API.

- 9 lecciones `completar_espacio` convertidas a `multiple_choice` con opciones (SQL ejecutado).
- RLS confirmado activo — ya estaba aplicado de sesión anterior.
- `@anthropic-ai/sdk` instalado en el proyecto.
- `app/api/explicar/route.js` creado: recibe errores al final de sesión, llama a Claude Haiku, retorna 4 campos por error (concepto, ejemplo, error, practica).
- Pantalla de resultados actualizada: muestra spinner "Conti analizando..." y luego las 4 secciones IA por cada respuesta incorrecta.
- **Bloqueante**: créditos Anthropic en $0 — la API retorna 400. Usuario va a cargar $5.

---

## Pendientes inmediatos

### 1. Cargar créditos Anthropic ($5)
- console.anthropic.com → Billing → Add credits
- Una vez cargados, la integración Claude funciona sin cambios de código

### 2. Quitar el modo 🧪 Test cuando terminen las pruebas
- `app/niveles/page.jsx`: eliminar botón y state `modoTest`
- `app/lecciones/page.jsx`: eliminar todos los `if (!modoTest)` y ramas test
- `localStorage.removeItem("modoTest")`

### 3. Para futuros cambios
```
git add .
git commit -m "descripción"
git push origin HEAD:main
```
Vercel redespliega automáticamente. **Siempre usar `HEAD:main`** desde el worktree.

---

## Problemas activos

| Problema | Impacto | Notas |
|----------|---------|-------|
| Créditos Anthropic en $0 | Alto | API devuelve 400, IA no funciona. Solución: pagar $5 |
| Logros sin columnas en BD (`max_combo`, etc.) | Bajo | Funciona con `?? 0`, columnas opcionales |
| `transicionDif` feature incompleta | Ninguno | Siempre `null`, placeholder futuro |
| Imágenes en preguntas (`imagen_url`) | Bajo | Columna existe, ninguna pregunta tiene URL |
| Modo 🧪 Test activo en producción | Medio | Quitar cuando terminen pruebas |

---

## Stack y archivos clave

**Stack:** Next.js 16 · React 19 · Tailwind CSS v4 · Supabase · Anthropic SDK · Web Audio API · Web Speech API

**Deploy:** contalearn.vercel.app · GitHub: Manuko18/contalearn (rama `main`)

```
app/
  page.jsx                Dashboard principal
  layout.jsx              Layout raíz (AmbientProvider aquí)
  login/page.jsx          Login + Registro
  niveles/page.jsx        Mapa de 8 niveles + botón 🧪 Test
  lecciones/page.jsx      Motor del juego (archivo más grande)
  ranking/page.jsx        Tabla de posiciones
  api/explicar/route.js   API route → Claude Haiku (explicaciones IA)

components/
  AmbientProvider.jsx     Ambient global
  Mascota.jsx             Conti Core SVG evolutivo
  Navbar.jsx              Navegación glassmorphism
  FondoDinamico.jsx       Canvas reactivo
  EpicMoment.jsx          Overlay cinematográfico
  AchievementToast.jsx    Toast de logros con cola

lib/
  audio.js        Sonidos UI (Web Audio API)
  ambient.js      Lo-fi gaming arpeggio (singleton)
  achievements.js 12 logros, localStorage
  particles.js    7 presets de partículas
```

**BD:** `users` · `niveles` · `lecciones` · `progreso_usuario` · `misiones_diarias`

**Env vars requeridas:**
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (en Vercel y `.env.local`)
- `ANTHROPIC_API_KEY` (en Vercel + `.env.local`) — key ya configurada, falta saldo

**Campos `contenido_json` (multiple_choice):**
```json
{ "pregunta": "...", "opciones": ["A","B","C","D"], "respuesta_correcta": "A", "explicacion_error": "..." }
```
**Campos `contenido_json` (verdadero_falso):**
```json
{ "enunciado": "...", "respuesta_correcta": "true", "explicacion_error": "..." }
```
