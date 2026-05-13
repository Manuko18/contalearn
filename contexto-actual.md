# ContaLearn — Contexto actual
> Última actualización: 2026-05-13 (sesión 11)

---

## Estado de la app (qué funciona hoy)

- Auth: login / registro / recuperar contraseña ✅
- Dashboard: XP, vidas (countdown tiempo real), racha, rango, misiones diarias (10 tipos), misión semanal, bonus regreso +20 XP, onboarding 3 slides ✅
- 8 niveles lineales (Básico/Intermedio/Avanzado/Experto) con desbloqueo Fácil→Normal→Difícil ✅
- Teoría con voz sincronizada por slide ✅
- Juego: timer 30s, vidas, combo, sonidos, partículas, rankUp, error boundary ✅
- Preguntas IA: 10/sesión, 3 tipos (mc/vf/completar), banco `nivel_preguntas` (20/dif, 60 máx/nivel), anti-duplicados ✅
- Explicaciones IA al final (Haiku) con historial `user_mistakes` ✅
- Tutor IA (`/tutor?nivel=ID`) con contexto de últimos 5 errores del usuario ✅
- Práctica extra (`/practica?nivel=ID`): sin XP, banco reutilizable ✅
- Empresa simulada (`/empresa`): dificultad adaptativa, banco `empresa_preguntas` ✅
- Reportes: ⚠️ → Sonnet pre-filtra → panel `/admin` ✅
- Logros (`/logros`): 19 logros con datos acumulativos reales en BD ✅
- Modo Desafío (`/desafio`): 10 preguntas multi-nivel, timer 15s, récord localStorage ✅
- Ciclo de errores (`/repasar`): estudio puro, elimina `user_mistakes` al dominar ✅
- Badge rojo en navbar cuando hay misiones pendientes ✅
- **Rediseño visual completo** (sesión 11): design system dark navy, Manrope, tokens CSS, todas las pantallas rediseñadas ✅
  - `globals.css`: tokens `--bg-0/--surface/--accent-*`, clases `.qs/.scr-scroll/.bnav/.dash-*/.niv-*/.res-*/.rk-*/.logros-*/.emp-*`
  - Desktop: contenido centrado a 520px max-width en ≥768px
  - Mobile: `overflow-x: hidden` en body + `.qs` previene scroll lateral

---

## En qué punto quedamos

**Sesión 11 (2026-05-13):** Rediseño visual completo aplicado al proyecto Next.js. Todas las pantallas (Dashboard, Niveles, Lecciones/Resultados, Empresa, Ranking, Logros, Desafío, Repasar) usan el nuevo design system. Navbar reescrita con bottom nav 5 ítems. Mascota/ContiCore reescrita. Desktop responsivo a 520px. Fix overflow horizontal en móvil.

**Sesión 10 (2026-05-12):** 9 rangos extendidos (Gran Maestro/Leyenda/Élite), 19 logros, migración retroactiva, ruta de aprendizaje dinámica.

---

## Pendientes inmediatos

_(ninguno urgente)_

---

## Problemas activos

| Problema | Impacto | Notas |
|----------|---------|-------|
| Imágenes en preguntas (`imagen_url`) | Bajo | Columna existe en BD, sin URLs reales |
| Tabla `lecciones` sin uso | Info | Existe en BD pero el juego ya usa solo IA |
| 7 lint warnings pre-existentes | Info | En admin, desafio, empresa, lecciones, practica, Navbar, Onboarding — ninguno es nuevo |

---

## Stack y archivos clave

**Stack:** Next.js 16 · React 19 · Tailwind CSS v4 · Supabase · Anthropic SDK

**Deploy:** contalearn.vercel.app · GitHub: Manuko18/contalearn (`main`)

**Env vars:** `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `ANTHROPIC_API_KEY`

**Modelos:** Haiku (`claude-haiku-4-5-20251001`) para todo · Sonnet (`claude-sonnet-4-6`) solo reportes

**Admin emails:** lotor210799@gmail.com · lotor5252@gmail.com (URL `/admin` no vinculada en la app)

**Git push siempre:** `git push origin HEAD:main`

```
app/
  page.jsx                  Dashboard
  niveles/page.jsx          8 niveles + desbloqueo por progreso_nivel
  lecciones/page.jsx        Motor del juego (IA, banco, rankUp, error boundary)
  logros/page.jsx           19 logros con datos reales de BD
  ranking/page.jsx          Tabla + titulo_empresa (usa getRankTheme)
  tutor/page.jsx            Chat tutor IA
  practica/page.jsx         Práctica extra sin XP
  empresa/page.jsx          Modo empresa simulada
  admin/page.jsx            Panel admin (Sonnet pre-filtra)
  desafio/page.jsx          Timer 15s, 10 preguntas, récord localStorage
  repasar/page.jsx          Ciclo errores: estudio puro, elimina user_mistakes al dominar
  api/generar-leccion/      Haiku — banco nivel_preguntas + logging tokens
  api/generar-ejercicio/    Haiku — práctica (sin banco)
  api/empresa/route.js      Haiku — empresa (banco empresa_preguntas)
  api/explicar/route.js     Haiku — explicaciones fin de sesión
  api/tutor/route.js        Haiku — chat tutor (Bearer token + user_mistakes)
  api/reportar/route.js     Sonnet — pre-filtro reportes

components/
  Onboarding.jsx            3 slides primera vez (localStorage cl_onboarding_v1)
  Particles.jsx             Partículas (presets en lib/particles.js)
  EpicMoment.jsx            Overlays: rankUp/levelComplete/perfectRun/missionComplete/comboMax/unlock
  AchievementToast.jsx      Toast de logros
  Mascota.jsx               Conti Core evolutivo por XP (reescrito sesión 11)
  Navbar.jsx                Bottom nav 5 ítems + badge rojo misiones (reescrito sesión 11)

lib/
  rankTheme.js              9 rangos + getRankTheme()
  achievements.js           19 logros + checkNewAchievements()
  particles.js              Presets partículas
  audio.js                  Web Audio API — sonidos sin archivos externos
  ambient.js                4 capas de ambient sound

sql/
  add_achievement_columns.sql        ← ya corrida
  add_tipo_periodo.sql               ← ya corrida
  add_rls_delete_user_mistakes.sql   ← ya corrida
```

**BD tabla `users`:** xp_total, racha_actual, vidas, ultima_vida_recargada, ultima_leccion_fecha, empresa_mes, titulo_empresa, max_combo, perfect_sessions, clean_sessions

**BD tabla `nivel_preguntas`:** id, nivel_id, pregunta, opciones (jsonb), respuesta_correcta, explicacion, dificultad (`facil`|`normal`|`dificil`), slide_idx, tipo (`multiple_choice`|`verdadero_falso`|`completar_espacio`)

**BD tabla `progreso_nivel`:** user_id, nivel_id, dificultad — unique(user_id, nivel_id, dificultad)

**BD tabla `misiones_diarias`:** id, user_id, fecha, tipo, tipo_periodo (`diaria`|`semanal`), descripcion, icono, meta, progreso, completada, xp_recompensa

**BD otras tablas:** niveles · lecciones (sin uso) · user_mistakes · empresa_preguntas · reportes_preguntas · progreso_usuario (legacy)
