# ContaLearn — Contexto actual
> Última actualización: 2026-05-13 (sesión 3)

---

## Estado de la app (qué funciona hoy)

- Login / registro / recuperar contraseña ✅
- Dashboard: XP, vidas, racha, rango, misiones, botón 🏢 Modo Empresa ✅
- 8 niveles lineales (Básico/Intermedio/Avanzado/Experto), desbloqueo secuencial ✅
- Modo 🧪 Test (activo en producción — pendiente quitar) ✅
- Teoría con voz sincronizada + juego: timer 30s, vidas, combo, sonidos, partículas ✅
- Explicaciones IA al final (Haiku + historial `user_mistakes`) ✅
- XP, progreso, ranking con títulos empresa, misiones, logros, RLS ✅
- **Tutor IA** (`/tutor?nivel=ID`): chat solo temas contables/Ecuador, botones rápidos ✅
- **Práctica extra** (`/practica?nivel=ID`): ejercicios Haiku sin XP, banco reutilizable ✅
- **Empresa simulada** (`/empresa`): Distribuidora Andes S.A., +5 XP/acierto, avance mensual ✅
  - Dificultad adaptativa: 2 fallos→fácil, 6 aciertos→difícil, 3 fallos difícil→normal
  - Banco `empresa_preguntas` con campo `dificultad`, reutilizable entre usuarios
  - Meses anteriores jugables sin XP · pregunta actual en localStorage
- **Sistema reportes**: botón ⚠️ en empresa/práctica → Sonnet pre-filtra → panel `/admin` ✅
- **Panel admin** (`/admin`): solo `lotor210799@gmail.com` y `lotor5252@gmail.com` ✅

---

## En qué punto quedamos

Sesión 2026-05-13: 4 modos IA completos + sistema de reportes con pre-filtro Sonnet. Todo en producción.

---

## Pendientes inmediatos

### 1. Quitar modo 🧪 Test
- `app/niveles/page.jsx`: eliminar botón y state `modoTest`
- `app/lecciones/page.jsx`: eliminar todos los `if (!modoTest)` y ramas test
- `localStorage.removeItem("modoTest")`

---

## Problemas activos

| Problema | Impacto | Notas |
|----------|---------|-------|
| Modo 🧪 Test activo en producción | Medio | Quitar cuando terminen pruebas |
| Logros sin columnas BD (`max_combo`, etc.) | Bajo | Funciona con `?? 0` |
| Imágenes en preguntas (`imagen_url`) | Bajo | Columna existe, sin URLs |

---

## Stack y archivos clave

**Stack:** Next.js 16 · React 19 · Tailwind CSS v4 · Supabase · Anthropic SDK (Haiku + Sonnet)

**Deploy:** contalearn.vercel.app · GitHub: Manuko18/contalearn (rama `main`)

**Env vars:** `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `ANTHROPIC_API_KEY`

**Modelos:** Haiku (`claude-haiku-4-5-20251001`) para todo · Sonnet (`claude-sonnet-4-6`) solo para reportes

```
app/
  page.jsx                  Dashboard
  niveles/page.jsx          8 niveles + 🤖 tutor + 🎯 práctica por nivel
  lecciones/page.jsx        Motor del juego (archivo más grande)
  ranking/page.jsx          Tabla + titulo_empresa
  tutor/page.jsx            Chat tutor IA
  practica/page.jsx         Práctica extra sin XP
  empresa/page.jsx          Modo empresa simulada
  admin/page.jsx            Panel admin (emails autorizados)
  api/explicar/route.js     Haiku — explicaciones fin de sesión + historial errores
  api/tutor/route.js        Haiku — chat tutor
  api/generar-ejercicio/    Haiku — ejercicios práctica
  api/empresa/route.js      Haiku — casos empresa (banco + dificultad adaptativa)
  api/reportar/route.js     Sonnet — pre-filtro reportes
```

**BD:**
- `users` — xp_total, racha_actual, vidas, empresa_mes, titulo_empresa
- `niveles` · `lecciones` · `progreso_usuario` · `misiones_diarias`
- `user_mistakes` — errores juego principal por usuario/nivel
- `empresa_preguntas` — banco preguntas empresa (campo `dificultad`: facil/normal/dificil)
- `reportes_preguntas` — reportes pre-filtrados por Sonnet

**Git push siempre:** `git push origin HEAD:main`
