# ContaLearn — Contexto actual
> Última actualización: 2026-05-12 (sesión 10)

---

## Estado de la app (qué funciona hoy)

- Auth: login / registro / recuperar contraseña ✅
- Dashboard: XP, vidas (countdown tiempo real), racha, rango, misiones diarias (10 tipos), misión semanal separada ✅
- 8 niveles lineales (Básico/Intermedio/Avanzado/Experto) con desbloqueo Fácil→Normal→Difícil ✅
- Teoría con voz sincronizada por slide ✅
- Juego: timer 30s, vidas, combo, sonidos, partículas ✅
- **Preguntas IA**: 10/sesión, 3 tipos (mc/vf/completar), banco `nivel_preguntas` (20/dif, 60 máx/nivel) ✅
  - Anti-duplicados, rotación por slide, `angulo` controla tipo+slide
- Explicaciones IA al final (Haiku) con historial `user_mistakes` ✅
- **RankUp**: al cruzar umbral XP → EpicMoment + partículas `rankUp` + `sound.rankUp()` ✅
- **Bonus de regreso**: +20 XP si ≥ 2 días sin entrar (clave `cl_regreso_[fecha]`) ✅
- **Misión semanal**: "Completa 3 niveles esta semana", 100 XP, borde púrpura, separada en dashboard ✅
- **Onboarding** 3 slides (primera vez, clave `cl_onboarding_v1`) ✅
- **Badge rojo** en navbar ícono Inicio cuando hay misiones pendientes (`cl_misiones_pendientes`) ✅
- **Error boundary** en lecciones: si IA falla 10/10 → pantalla con mensaje + reintentar ✅
- Tutor IA (`/tutor?nivel=ID`) ✅
- Práctica extra (`/practica?nivel=ID`): sin XP, banco reutilizable ✅
- Empresa simulada (`/empresa`): dificultad adaptativa, banco `empresa_preguntas` ✅
- Reportes: ⚠️ → Sonnet pre-filtra → panel `/admin` ✅
- Logros (`/logros`): 19 logros con datos acumulativos reales en BD ✅
  - 3 logros nuevos: xp_500 Gran Maestro (epic), xp_800 Leyenda (epic), xp_1200 Élite (legendary)
  - xp_300 bajado de legendary → epic
  - Migración retroactiva en dashboard (`cl_migracion_xp_v1`) para usuarios con XP previo
- Logging de tokens Haiku en `api/generar-leccion` (visible en Vercel logs) ✅
- **Modo Desafío** (`/desafio`) ✅
  - 10 preguntas mc/vf mezcladas de todos los niveles (2 por nivel, shuffle global)
  - Countdown 15 s por pregunta, barra color-coded (verde→amarillo→rojo)
  - Tiempo agotado = error + avance automático; sin vidas ni anti-farmeo
  - +10 XP por correcta, guardado en BD al terminar
  - Récord personal en `localStorage cl_desafio_best`; nuevo récord → partículas `rankUp` + `sound.rankUp()`
  - Tarjeta "⚡ Modo Desafío" en `/niveles` visible siempre: bloqueada hasta que usuario complete un nivel entero (fácil+normal+difícil), luego dorada y clickeable
- **Ciclo de errores** ✅
  - Tutor IA recibe últimos 5 `user_mistakes` del usuario en el system prompt (via Bearer token → Supabase autenticado)
  - `/repasar`: modo estudio puro, carga errores por nivel, genera opciones MC (correcta + tu_respuesta + distractores del banco), elimina el registro al responder bien. Sin XP ni vidas.
  - Dashboard muestra botón "🔁 Repasar errores" solo si hay registros en `user_mistakes`
  - localStorage `cl_mastered_mistakes` como fallback si RLS bloquea DELETE
  - Política RLS DELETE en `user_mistakes` activa (`sql/add_rls_delete_user_mistakes.sql` ya corrida)

---

## En qué punto quedamos

**Sesión 10 (2026-05-12):** Extensión de rangos: 9 rangos (Gran Maestro 500 XP, Leyenda 800 XP, Élite 1200 XP) en `lib/rankTheme.js`. Ranking usa `getRankTheme` en vez de constante local. 3 logros nuevos sincronizados en `lib/achievements.js`. Migración retroactiva en dashboard para desbloquear logros a usuarios con XP previo. Dashboard fix: quitado frase duplicada del búho, ruta de aprendizaje dinámica (fetch 8 niveles reales de BD).

**Sesión 9 (2026-05-12):** Modo Desafío completo — `/desafio` con timer 15 s, 10 preguntas multi-nivel (solo niveles desbloqueados, 2 por nivel), récord en `cl_desafio_best`. Tarjeta siempre visible en `/niveles`, bloqueada hasta completar un nivel entero.

**Sesión 8 (2026-05-12):** Ciclo de errores completo — `/repasar` (modo estudio, elimina errores dominados), tutor con contexto `user_mistakes` en system prompt (Bearer token), botón condicional en dashboard. Fix RLS DELETE en `user_mistakes` (`sql/add_rls_delete_user_mistakes.sql` ya corrida).

**Sesión 7 (2026-05-12):** RankUp visual (EpicMoment + partículas + sound), bonus regreso +20 XP, misión semanal con EpicMoment al completar. Fix build: `badge` no destructurado en desktop navbar.

---

## Pendientes inmediatos

_(ninguno urgente)_

---

## Problemas activos

| Problema | Impacto | Notas |
|----------|---------|-------|
| Imágenes en preguntas (`imagen_url`) | Bajo | Columna existe en BD, sin URLs reales |
| Tabla `lecciones` sin uso | Info | Existe en BD pero el juego ya usa solo IA |

---

## Stack y archivos clave

**Stack:** Next.js 16 · React 19 · Tailwind CSS v4 · Supabase · Anthropic SDK

**Deploy:** contalearn.vercel.app · GitHub: Manuko18/contalearn (`main`)

**Env vars:** `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `ANTHROPIC_API_KEY`

**Modelos:** Haiku (`claude-haiku-4-5-20251001`) para todo · Sonnet (`claude-sonnet-4-6`) solo reportes

**Admin emails:** lotor210799@gmail.com · lotor5252@gmail.com (URL `/admin` no vinculada en la app)

```
app/
  page.jsx                  Dashboard (misiones, misión semanal, bonus regreso, onboarding)
  niveles/page.jsx          8 niveles + desbloqueo por progreso_nivel
  lecciones/page.jsx        Motor del juego (IA, banco, rankUp, misión semanal, error boundary)
  logros/page.jsx           19 logros con datos reales de BD
  ranking/page.jsx          Tabla + titulo_empresa (usa getRankTheme)
  tutor/page.jsx            Chat tutor IA
  practica/page.jsx         Práctica extra sin XP
  empresa/page.jsx          Modo empresa simulada
  admin/page.jsx            Panel admin (Sonnet pre-filtra)
  api/generar-leccion/      Haiku — lecciones (banco nivel_preguntas) + logging tokens
  api/generar-ejercicio/    Haiku — práctica (sin banco)
  api/empresa/route.js      Haiku — empresa (banco empresa_preguntas)
  api/explicar/route.js     Haiku — explicaciones fin de sesión
  api/tutor/route.js        Haiku — chat tutor
  api/reportar/route.js     Sonnet — pre-filtro reportes
  desafio/page.jsx          Modo desafío: timer 15 s, 10 preguntas, récord localStorage
  repasar/page.jsx          Ciclo errores: estudio puro, elimina user_mistakes al dominar

components/
  Onboarding.jsx            3 slides primera vez (localStorage cl_onboarding_v1)
  Particles.jsx             Partículas (presets en lib/particles.js)
  EpicMoment.jsx            Overlays: rankUp/levelComplete/perfectRun/missionComplete/comboMax/unlock
  AchievementToast.jsx      Toast de logros
  Mascota.jsx               Conti Core evolutivo por XP
  Navbar.jsx                Badge rojo misiones en ícono Inicio

sql/
  add_achievement_columns.sql        ← ya corrida en Supabase
  add_tipo_periodo.sql               ← ya corrida en Supabase
  add_rls_delete_user_mistakes.sql   ← ya corrida en Supabase
```

**BD tabla `users`:** xp_total, racha_actual, vidas, ultima_vida_recargada, ultima_leccion_fecha, empresa_mes, titulo_empresa, max_combo, perfect_sessions, clean_sessions

**BD tabla `nivel_preguntas`:** id, nivel_id, pregunta, opciones (jsonb), respuesta_correcta, explicacion, dificultad (`facil`|`normal`|`dificil`), slide_idx, tipo (`multiple_choice`|`verdadero_falso`|`completar_espacio`) — límite 20/dificultad (60 máx/nivel)

**BD tabla `progreso_nivel`:** user_id, nivel_id, dificultad — unique(user_id, nivel_id, dificultad) — controla desbloqueo de siguiente nivel

**BD tabla `misiones_diarias`:** id, user_id, fecha, tipo, tipo_periodo (`diaria`|`semanal`), descripcion, icono, meta, progreso, completada, xp_recompensa — diarias: fecha=hoy · semanal: fecha=lunes de la semana

**BD otras tablas:** niveles · lecciones (sin uso) · user_mistakes · empresa_preguntas · reportes_preguntas · progreso_usuario (legacy)

**Git push siempre:** `git push origin HEAD:main`
