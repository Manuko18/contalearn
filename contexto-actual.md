# ContaLearn — Contexto actual
> Última actualización: 2026-05-13 (sesión 3)

---

## Estado de la app (qué funciona hoy)

- Login / registro / recuperar contraseña ✅
- Dashboard: XP, vidas, racha, rango, misiones del día ✅
- 8 niveles lineales agrupados en 4 categorías (Básico/Intermedio/Avanzado/Experto) ✅
- Modo 🧪 Test: desbloquea todo, 99 vidas, sin guardar XP ✅
- Teoría con voz sincronizada ✅
- Juego: timer 30s, vidas, combo, sonidos, partículas ✅
- Feedback inmediato al fallar: respuesta correcta + `explicacion_error` de BD ✅
- **Explicaciones IA al final**: Claude Haiku + historial de errores del usuario (`user_mistakes`) ✅
- XP, progreso, ranking, misiones, logros, RLS ✅
- BD limpia: 119 lecciones, solo `multiple_choice` y `verdadero_falso` ✅
- Deploy: contalearn.vercel.app ✅

### Modos IA (todos funcionando) ✅
- **Tutor conversacional** (`/tutor?nivel=ID`): chat restringido a contabilidad/Ecuador, botones rápidos + campo libre
- **Práctica extra** (`/practica?nivel=ID`): ejercicios generados por Haiku, sin XP, banco reutilizable
- **Historial de errores** (`user_mistakes`): guarda errores al jugar, Claude detecta patrones repetidos
- **Empresa simulada** (`/empresa`): Distribuidora Andes S.A., +5 XP por acierto, avance mensual, títulos en ranking
  - Dificultad adaptativa: fácil (2 fallos) → normal → difícil (6 aciertos)
  - Banco de preguntas (`empresa_preguntas`) con dificultad guardada, reutilizable entre usuarios
  - Meses anteriores jugables sin XP (repaso)
  - Pregunta actual persistida en localStorage (no regenera al recargar)

### Sistema de reportes ✅
- Botón "⚠️ Reportar" en empresa y práctica
- **Claude Sonnet** pre-filtra: solo guarda si confirma que la pregunta está mal
- Panel admin (`/admin`): accesible solo por `lotor210799@gmail.com` y `lotor5252@gmail.com`
- Admin puede eliminar del banco o descartar reporte

---

## En qué punto quedamos

Última sesión (2026-05-13): 4 modos IA completos + sistema de reportes con pre-filtro Sonnet.

- Tutor `/tutor`, práctica `/practica`, empresa `/empresa` todos en producción
- `/api/tutor`, `/api/generar-ejercicio`, `/api/empresa`, `/api/reportar` operativos
- Sonnet solo se usa para revisar reportes (Haiku para todo lo demás)
- Dificultad adaptativa en empresa: fácil/normal/difícil según rachas

---

## Pendientes inmediatos

### 1. Quitar el modo 🧪 Test cuando terminen las pruebas
- `app/niveles/page.jsx`: eliminar botón y state `modoTest`
- `app/lecciones/page.jsx`: eliminar todos los `if (!modoTest)` y ramas test
- `localStorage.removeItem("modoTest")`

### 2. Para futuros cambios
```
git add .
git commit -m "descripción"
git push origin HEAD:main
```

---

## Tablas BD (completas)

- `users` — xp_total, racha_actual, vidas, empresa_mes, titulo_empresa
- `niveles` · `lecciones` · `progreso_usuario` · `misiones_diarias`
- `user_mistakes` — errores del juego principal por usuario/nivel
- `empresa_preguntas` — banco de preguntas empresa con campo `dificultad`
- `reportes_preguntas` — reportes pre-filtrados por Sonnet

---

## Problemas activos

| Problema | Impacto | Notas |
|----------|---------|-------|
| Logros sin columnas en BD (`max_combo`, etc.) | Bajo | Funciona con `?? 0` |
| Imágenes en preguntas (`imagen_url`) | Bajo | Columna existe, sin URLs |
| Modo 🧪 Test activo en producción | Medio | Quitar cuando terminen pruebas |

---

## Stack y archivos clave

**Stack:** Next.js 16 · React 19 · Tailwind CSS v4 · Supabase · Anthropic SDK (Haiku + Sonnet) · Web Audio/Speech API

**Deploy:** contalearn.vercel.app · GitHub: Manuko18/contalearn (rama `main`)

```
app/
  page.jsx                  Dashboard (botón 🏢 Modo Empresa)
  layout.jsx                Layout raíz (AmbientProvider)
  login/page.jsx            Login + Registro
  niveles/page.jsx          8 niveles + botón 🧪 Test + botones 🤖 tutor y 🎯 práctica
  lecciones/page.jsx        Motor del juego (archivo más grande)
  ranking/page.jsx          Tabla de posiciones + titulo_empresa
  tutor/page.jsx            Chat tutor IA por nivel
  practica/page.jsx         Práctica extra sin XP
  empresa/page.jsx          Modo empresa simulada
  admin/page.jsx            Panel admin (solo emails autorizados)
  api/explicar/route.js     Haiku — explicaciones al final de sesión + historial
  api/tutor/route.js        Haiku — chat tutor
  api/generar-ejercicio/    Haiku — ejercicios de práctica
  api/empresa/route.js      Haiku — casos empresa con banco y dificultad
  api/reportar/route.js     Sonnet — pre-filtro de reportes

components/  AmbientProvider · Mascota · Navbar · FondoDinamico · EpicMoment · AchievementToast
lib/         audio.js · ambient.js · achievements.js · particles.js
```

**Env vars:** `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `ANTHROPIC_API_KEY`
