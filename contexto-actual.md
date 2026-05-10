# ContaLearn — Contexto actual
> Última actualización: 2026-05-12 (sesión 2)

---

## Estado de la app (qué funciona hoy)

- Login / registro / recuperar contraseña ✅
- Dashboard: XP, vidas, racha, rango, misiones del día ✅
- 8 niveles lineales agrupados en 4 categorías (Básico/Intermedio/Avanzado/Experto) ✅
- Modo 🧪 Test: desbloquea todo, 99 vidas, sin guardar XP ✅
- Teoría con voz sincronizada ✅
- Juego: timer 30s, vidas, combo, sonidos, partículas ✅
- Feedback inmediato al fallar: respuesta correcta + `explicacion_error` de BD ✅
- **Explicaciones IA al final**: Claude Haiku genera concepto, ejemplo ecuatoriano, error exacto y qué practicar — funciona para múltiples errores ✅
- XP, progreso, ranking, misiones, logros, RLS ✅
- BD limpia: 119 lecciones, solo `multiple_choice` y `verdadero_falso` ✅
- Deploy: contalearn.vercel.app ✅

---

## En qué punto quedamos

Última sesión (2026-05-12 tarde): Claude API integrada y funcionando.

- Créditos Anthropic cargados ($5). API operativa.
- `app/api/explicar/route.js`: separa errores con `===`, parsea 4 campos (CONCEPTO/EJEMPLO/ERROR/PRACTICA).
- Pantalla resultados: spinner + 4 secciones IA por cada respuesta incorrecta.
- Fix parseo: separador `===` en vez de `[N]` — resuelve que solo aparecía 1 explicación de 3.
- Todo commiteado y en producción.

---

## Pendientes inmediatos

### 1. Quitar el modo 🧪 Test cuando terminen las pruebas
- `app/niveles/page.jsx`: eliminar botón y state `modoTest`
- `app/lecciones/page.jsx`: eliminar todos los `if (!modoTest)` y ramas test
- `localStorage.removeItem("modoTest")`

### 2. Tarea 3 pendiente — IA mejorada (4 modos)
- A) Tutor conversacional (chat libre)
- B) Generador infinito de ejercicios
- C) Corrección inteligente con historial de errores (`user_mistakes` en BD)
- D) Empresa simulada (modo campaña)

### 3. Para futuros cambios
```
git add .
git commit -m "descripción"
git push origin HEAD:main
```

---

## Problemas activos

| Problema | Impacto | Notas |
|----------|---------|-------|
| Logros sin columnas en BD (`max_combo`, etc.) | Bajo | Funciona con `?? 0` |
| `transicionDif` feature incompleta | Ninguno | Siempre `null`, placeholder futuro |
| Imágenes en preguntas (`imagen_url`) | Bajo | Columna existe, sin URLs |
| Modo 🧪 Test activo en producción | Medio | Quitar cuando terminen pruebas |

---

## Stack y archivos clave

**Stack:** Next.js 16 · React 19 · Tailwind CSS v4 · Supabase · Anthropic SDK (Haiku) · Web Audio/Speech API

**Deploy:** contalearn.vercel.app · GitHub: Manuko18/contalearn (rama `main`)

```
app/
  page.jsx               Dashboard
  layout.jsx             Layout raíz (AmbientProvider)
  login/page.jsx         Login + Registro
  niveles/page.jsx       8 niveles + botón 🧪 Test
  lecciones/page.jsx     Motor del juego (archivo más grande)
  ranking/page.jsx       Tabla de posiciones
  api/explicar/route.js  Claude Haiku — explicaciones IA al final

components/  AmbientProvider · Mascota · Navbar · FondoDinamico · EpicMoment · AchievementToast
lib/         audio.js · ambient.js · achievements.js · particles.js
```

**BD:** `users` · `niveles` · `lecciones` · `progreso_usuario` · `misiones_diarias`

**Env vars:** `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `ANTHROPIC_API_KEY`

**contenido_json (multiple_choice):** `{ pregunta, opciones[], respuesta_correcta, explicacion_error }`
**contenido_json (verdadero_falso):** `{ enunciado, respuesta_correcta: "true"/"false", explicacion_error }`
