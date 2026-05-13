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
- **Tutor IA** (`/tutor?nivel=ID`) ✅
- **Práctica extra** (`/practica?nivel=ID`): Haiku sin XP, banco reutilizable ✅
- **Empresa simulada** (`/empresa`): dificultad adaptativa, banco `empresa_preguntas` ✅
- **Sistema reportes**: ⚠️ → Sonnet pre-filtra → panel `/admin` ✅

---

## En qué punto quedamos

Sesión 2026-05-15: eliminado modo 🧪 Test de producción (botón, state, todas las ramas condicionales y limpieza del localStorage).

---

## Pendientes inmediatos

_(ninguno urgente)_

---

## Problemas activos

| Problema | Impacto | Notas |
|----------|---------|-------|
| Logros sin columnas BD (`max_combo`, etc.) | Bajo | Funciona con `?? 0` |
| Imágenes en preguntas (`imagen_url`) | Bajo | Columna existe, sin URLs |
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
```

**BD:**
- `users` — xp_total, racha_actual, vidas, empresa_mes, titulo_empresa
- `niveles` — titulo, descripcion, emoji, orden, teoria_json (slides)
- `lecciones` — existe pero ya no se usa en el juego (migrado a IA)
- `progreso_nivel` — user_id, nivel_id, dificultad (PK triple) — controla desbloqueo
- `nivel_preguntas` — banco IA lecciones (nivel_id, pregunta, opciones jsonb, respuesta_correcta, explicacion, dificultad, slide_idx, tipo)
- `user_mistakes` — errores juego por usuario/nivel
- `empresa_preguntas` — banco IA empresa (dificultad: facil/normal/dificil)
- `reportes_preguntas` — reportes pre-filtrados
- `misiones_diarias` · `progreso_usuario` (legacy)

**Git push siempre:** `git push origin HEAD:main`
