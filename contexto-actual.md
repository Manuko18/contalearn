# ContaLearn — Contexto actual
> Última actualización: 2026-05-15 (sesión 5)

---

## Estado de la app (qué funciona hoy)

- Login / registro / recuperar contraseña ✅
- Dashboard: XP, vidas, racha, rango, misiones, botón 🏢 Modo Empresa ✅
- 8 niveles lineales (Básico/Intermedio/Avanzado/Experto) ✅
- **Desbloqueo por progresión**: Fácil → Normal → Difícil → desbloquea siguiente nivel ✅
- Teoría con voz sincronizada + juego: timer 30s, vidas, combo, sonidos, partículas ✅
- **Preguntas IA** en lecciones: 10 preguntas/sesión, 3 tipos (mc/vf/completar), banco `nivel_preguntas` ✅
  - Rota entre slides de `teoria_json` — cubre toda la teoría del nivel
  - Orden de tipos aleatorio por sesión
  - Anti-duplicados: pasa preguntas existentes + sesión actual a Haiku
  - Límite banco: 20 por dificultad (60 máximo por nivel)
  - Badge de dificultad en juego (🟢/🟡/🔴)
- Explicaciones IA al final (Haiku + historial `user_mistakes`) ✅
- XP +10 por acierto · vidas · combo · ranking con títulos empresa · misiones · logros ✅
- **Vidas en tiempo real**: countdown activo cada 60s, recarga sin recargar página ✅
- **Misiones diarias**: pool de 10 tipos (3 niveles: 10/15/25 XP), generación automática ✅
- **Logros** (`/logros`): 16 logros, datos acumulativos reales en BD (`max_combo`, etc.) ✅
- **Tutor IA** (`/tutor?nivel=ID`) ✅
- **Práctica extra** (`/practica?nivel=ID`): Haiku sin XP, banco reutilizable ✅
- **Empresa simulada** (`/empresa`): dificultad adaptativa, banco `empresa_preguntas` ✅
- **Sistema reportes**: ⚠️ → Sonnet pre-filtra → panel `/admin` ✅

---

## Historial de sesiones

| Fecha | Sesión | Qué se hizo |
|-------|--------|-------------|
| 2026-05-10 | 1 | Commit inicial: app base con 8 niveles, juego, XP, vidas, racha, rango, misiones |
| 2026-05-11 | 2 | Modo prueba, explicaciones IA con Claude al final de sesión, respuesta correcta inmediata, fixes de voz Chrome |
| 2026-05-12 | 3 | Tutor IA conversacional, práctica extra sin XP, modo empresa simulada (Distribuidora Andes), banco `empresa_preguntas` |
| 2026-05-13 | 4 | Reportes de preguntas + panel admin, pre-filtro Sonnet, migración lecciones a IA pura con banco `nivel_preguntas` |
| 2026-05-14 | 4b | Progresión fácil→normal→difícil, 3 tipos de pregunta, límite banco 20/dificultad, anti-duplicados |
| 2026-05-15 | 5 | Eliminar modo 🧪 Test, vidas countdown en tiempo real, pool misiones 6→10 tipos con XP variable, logros con datos reales en BD, página `/logros` |

---

## En qué punto quedamos

Sesión 2026-05-15: vidas en tiempo real, misiones ampliadas, logros con datos reales y página `/logros`. Columnas `max_combo`/`perfect_sessions`/`clean_sessions` añadidas a BD (SQL corrido por el usuario).

---

## Pendientes inmediatos

_(ninguno urgente)_

---

## Problemas activos

| Problema | Impacto | Notas |
|----------|---------|-------|
| Imágenes en preguntas (`imagen_url`) | Bajo | Columna existe en BD, sin URLs todavía |
| Tabla `lecciones` ya no se usa en el juego | Bajo | Existe en BD pero lecciones usa solo IA |

---

## Stack y archivos clave

**Stack:** Next.js 16 · React 19 · Tailwind CSS v4 · Supabase · Anthropic SDK (Haiku + Sonnet)

**Deploy:** contalearn.vercel.app · GitHub: Manuko18/contalearn (rama `main`)

**Env vars:** `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `ANTHROPIC_API_KEY`

**Modelos:** Haiku (`claude-haiku-4-5-20251001`) para todo · Sonnet (`claude-sonnet-4-6`) solo para reportes

```
app/
  page.jsx                    Dashboard
  niveles/page.jsx            8 niveles + desbloqueo por progreso_nivel
  lecciones/page.jsx          Motor del juego (IA, banco, progresión dificultad)
  logros/page.jsx             Página de logros (/logros)
  ranking/page.jsx            Tabla + titulo_empresa
  tutor/page.jsx              Chat tutor IA
  practica/page.jsx           Práctica extra sin XP
  empresa/page.jsx            Modo empresa simulada
  admin/page.jsx              Panel admin (emails autorizados)
  api/explicar/route.js       Haiku — explicaciones fin de sesión
  api/tutor/route.js          Haiku — chat tutor
  api/generar-ejercicio/      Haiku — ejercicios práctica (sin banco)
  api/generar-leccion/        Haiku — preguntas lecciones (banco nivel_preguntas)
  api/empresa/route.js        Haiku — casos empresa (banco empresa_preguntas)
  api/reportar/route.js       Sonnet — pre-filtro reportes
  sql/add_achievement_columns.sql  Migration logros (ya corrida)
```

**BD:**
- `users` — xp_total, racha_actual, vidas, ultima_vida_recargada, empresa_mes, titulo_empresa, **max_combo, perfect_sessions, clean_sessions**
- `niveles` — titulo, descripcion, emoji, orden, teoria_json (slides)
- `lecciones` — existe pero ya no se usa en el juego (migrado a IA)
- `progreso_nivel` — user_id, nivel_id, dificultad (PK triple) — controla desbloqueo
- `nivel_preguntas` — banco IA lecciones (nivel_id, pregunta, opciones jsonb, respuesta_correcta, explicacion, dificultad, slide_idx, tipo)
- `user_mistakes` — errores juego por usuario/nivel
- `empresa_preguntas` — banco IA empresa (dificultad: facil/normal/dificil)
- `reportes_preguntas` — reportes pre-filtrados
- `misiones_diarias` · `progreso_usuario` (legacy)

**Git push siempre:** `git push origin HEAD:main`
