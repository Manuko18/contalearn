# ContaLearn — Contexto actual
> Última actualización: 2026-05-11

---

## Estado de la app (qué funciona hoy)

- Login / registro / recuperar contraseña ✅
- Dashboard: XP, vidas, racha, rango, misiones del día ✅
- **8 niveles lineales** agrupados en 4 categorías (Básico/Intermedio/Avanzado/Experto) ✅
- Niveles 1–5: contabilidad básica → avanzada ✅
- Niveles 6–8: tributación (IVA/DIAN, Renta, Liquidación) ✅
- **Modo 🧪 Test**: desbloquea todo, da 99 vidas, NO guarda XP/progreso ✅
- Teoría con voz sincronizada palabra por palabra ✅
- Bug de voz corregido: ya no sigue sonando al cambiar slide o salir de teoría ✅
- Botón "Siguiente" con animación de relleno (previene skip ultra-rápido) ✅
- Juego: timer 30s, vidas, combo, sonidos, partículas ✅
- XP y progreso guardados en Supabase (solo fuera de modo Test) ✅
- Ranking global ✅
- Recarga automática de vidas (+1 cada 30 min) ✅
- Misiones diarias con progreso y XP bonus ✅
- Sistema de rangos (Bronce → Maestro, 0–300 XP) ✅
- Sistema de logros con toasts animados ✅
- Ambient lo-fi gaming (arpeggio pentatónico, persiste en todas las páginas) ✅
- Partículas centralizadas (`lib/particles.js`, 7 presets) ✅
- Conti Core evolutivo (añade anillos y símbolos según XP) ✅
- EpicMoment overlay (levelComplete, perfectRun, comboMax, rankUp…) ✅
- FondoDinamico reactivo ✅
- Transiciones de página (PageTransition) ✅
- Loading premium (LoadingConti) ✅
- Navbar glassmorphism ✅
- **Deploy en Vercel: contalearn.vercel.app** ✅

---

## En qué punto quedamos

Última sesión (2026-05-11): reestructura 5→8 niveles + tributación + fixes voz + modo test.

- Reestructura de niveles: de 5 niveles con 4 sub-tiers (Junior/Semi-Junior/Senior) a 8 niveles lineales agrupados por categoría. El feedback era que los sub-tiers confundían y no se sentían distintos.
- Niveles 6/7/8 creados en Supabase (SQL `seed-niveles-6-7-8.sql` ejecutado + fixes de campos).
- Teoría de niveles 1/2 reescrita para alinearla con sus preguntas (referenciaban NIC/NIIF que la teoría no mencionaba). SQL ejecutado: `fix-contenido-completo.sql`.
- Bugs de Web Speech API resueltos definitivamente (ver sección Problemas activos → resueltos).
- Modo test implementado: botón 🧪 en `/niveles`, `localStorage["modoTest"]`, 99 vidas al cargar, sin guardar XP.
- Verdadero/Falso siempre marcado incorrecto → corregido con SQL (BD ahora usa `"true"`/`"false"`).
- Git push al repo `Manuko18/contalearn` rama `main` → Vercel redesplegado.

---

## Pendientes inmediatos

### 1. Aplicar políticas de seguridad en Supabase (RLS)
- SQL Editor → ejecutar `supabase-policies.sql`
- Columnas opcionales para logros:
  ```sql
  ALTER TABLE users ADD COLUMN IF NOT EXISTS max_combo INTEGER DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS perfect_sessions INTEGER DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS clean_sessions INTEGER DEFAULT 0;
  ```

### 2. Quitar el modo 🧪 Test cuando terminen las pruebas
- `app/niveles/page.jsx`: eliminar el botón y el state `modoTest`
- `app/lecciones/page.jsx`: eliminar todos los `if (!modoTest)` y las ramas test
- Limpiar `localStorage.removeItem("modoTest")`

### 3. Para futuros cambios al código
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
| RLS deshabilitado en Supabase | Seguridad alta | `supabase-policies.sql` listo, falta ejecutar |
| Logros sin columnas en BD (`max_combo`, etc.) | Bajo | Funciona con `?? 0`, columnas opcionales |
| `transicionDif` feature incompleta | Ninguno | Siempre `null`, placeholder futuro |
| Imágenes en preguntas (`imagen_url`) | Bajo | Columna existe, ninguna pregunta tiene URL |

---

## Stack y archivos clave

**Stack:** Next.js 16 · React 19 · Tailwind CSS v4 · Supabase · Web Audio API · Web Speech API

**Deploy:** contalearn.vercel.app · GitHub: Manuko18/contalearn (rama `main`)

```
app/
  page.jsx              Dashboard principal
  layout.jsx            Layout raíz (AmbientProvider aquí)
  login/page.jsx        Login + Registro
  niveles/page.jsx      Mapa de 8 niveles agrupados por categoría + botón 🧪 Test
  lecciones/page.jsx    Motor del juego (archivo más grande)
  ranking/page.jsx      Tabla de posiciones

components/
  AmbientProvider.jsx   Ambient global (montado en layout)
  Mascota.jsx           Conti Core SVG evolutivo
  Navbar.jsx            Navegación glassmorphism
  FondoDinamico.jsx     Canvas reactivo
  EpicMoment.jsx        Overlay cinematográfico
  AchievementToast.jsx  Toast de logros con cola

lib/
  audio.js              Sonidos UI (Web Audio API)
  ambient.js            Lo-fi gaming arpeggio (singleton)
  achievements.js       12 logros, localStorage
  particles.js          7 presets de partículas

seed-niveles-3-4-5.sql     Contenido niveles 3/4/5 (ya ejecutado)
seed-niveles-6-7-8.sql     Contenido niveles 6/7/8 (ya ejecutado + fixes)
fix-contenido-completo.sql Reescritura teoría/preguntas niveles 1/2 (ya ejecutado)
fix-tipo-ejercicio.sql     opcion_multiple → multiple_choice (ya ejecutado)
supabase-policies.sql      RLS pendiente de ejecutar
```

**BD:** `users` · `niveles` · `lecciones` · `progreso_usuario` · `misiones_diarias`

**Columnas lecciones usadas:** `nivel_id` · `orden` · `tipo_ejercicio` · `dificultad` · `contenido_json`

**Columnas niveles usadas:** `titulo` · `descripcion` · `emoji` · `orden` · `teoria_json`

**Campos `contenido_json` (múltiple choice):**
```json
{
  "pregunta": "...",
  "opciones": ["A", "B", "C", "D"],
  "respuesta_correcta": "A",
  "explicacion_error": "..."
}
```

**Campos `contenido_json` (verdadero/falso):**
```json
{
  "enunciado": "...",
  "respuesta_correcta": "true",
  "explicacion_error": "..."
}
```
