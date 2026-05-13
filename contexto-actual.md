# ContaLearn — Contexto actual
> Última actualización: 2026-05-15 (sesión 5)

---

## Estado de la app (qué funciona hoy)

- Login / registro / recuperar contraseña ✅
- Dashboard: XP, vidas (countdown en tiempo real), racha, rango, misiones (10 tipos, 3 niveles XP) ✅
- 8 niveles lineales agrupados en Básico/Intermedio/Avanzado/Experto ✅
- **Desbloqueo por progresión**: completar Fácil→Normal→Difícil desbloquea el siguiente nivel ✅
- Teoría con voz sincronizada + juego: timer 30s, vidas, combo, sonidos, partículas ✅
- **Preguntas IA** en lecciones: 10/sesión, 3 tipos (mc/vf/completar), banco `nivel_preguntas` ✅
  - Anti-duplicados, rota por slide, límite 20/dificultad (60 máx por nivel)
- Explicaciones IA al final con historial `user_mistakes` ✅
- **Tutor IA** (`/tutor?nivel=ID`) ✅
- **Práctica extra** (`/practica?nivel=ID`): sin XP, banco reutilizable ✅
- **Empresa simulada** (`/empresa`): dificultad adaptativa, banco `empresa_preguntas` ✅
- **Reportes**: ⚠️ → Sonnet pre-filtra → panel `/admin` ✅
- **Logros** (`/logros`): 16 logros, datos acumulativos reales en BD ✅

---

## En qué punto quedamos

Sesión 2026-05-15: vidas en tiempo real, pool misiones ampliado (6→10), logros con datos reales en BD, página `/logros`. SQL de columnas logros ya corrido en Supabase.

---

## Pendientes inmediatos

_(ninguno urgente)_

---

## Problemas activos

| Problema | Impacto | Notas |
|----------|---------|-------|
| Imágenes en preguntas (`imagen_url`) | Bajo | Columna existe en BD, sin URLs |
| Tabla `lecciones` sin uso | Bajo | Existe en BD pero el juego ya usa solo IA |

---

## Stack y archivos clave

**Stack:** Next.js 16 · React 19 · Tailwind CSS v4 · Supabase · Anthropic SDK

**Deploy:** contalearn.vercel.app · GitHub: Manuko18/contalearn (`main`)

**Env vars:** `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `ANTHROPIC_API_KEY`

**Modelos:** Haiku (`claude-haiku-4-5-20251001`) para todo · Sonnet (`claude-sonnet-4-6`) solo reportes

```
app/
  page.jsx                  Dashboard
  niveles/page.jsx          8 niveles + desbloqueo por progreso_nivel
  lecciones/page.jsx        Motor del juego (IA, banco, progresión dificultad)
  logros/page.jsx           Página de logros
  ranking/page.jsx          Tabla + titulo_empresa
  tutor/page.jsx            Chat tutor IA
  practica/page.jsx         Práctica extra sin XP
  empresa/page.jsx          Modo empresa simulada
  admin/page.jsx            Panel admin
  api/explicar/route.js     Haiku — explicaciones fin de sesión
  api/tutor/route.js        Haiku — chat tutor
  api/generar-ejercicio/    Haiku — práctica (sin banco)
  api/generar-leccion/      Haiku — lecciones (banco nivel_preguntas)
  api/empresa/route.js      Haiku — empresa (banco empresa_preguntas)
  api/reportar/route.js     Sonnet — pre-filtro reportes
  sql/add_achievement_columns.sql  ← ya corrida en Supabase
```

**BD tabla `users`:** xp_total, racha_actual, vidas, ultima_vida_recargada, empresa_mes, titulo_empresa, **max_combo, perfect_sessions, clean_sessions**

**BD otras tablas:** niveles · lecciones (sin uso) · progreso_nivel · nivel_preguntas · user_mistakes · empresa_preguntas · reportes_preguntas · misiones_diarias · progreso_usuario (legacy)

**Git push siempre:** `git push origin HEAD:main`
