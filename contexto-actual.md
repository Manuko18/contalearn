# ContaLearn — Contexto actual
> Última actualización: 2026-05-09

---

## Estado de la app (qué funciona hoy)

- Login / registro / recuperar contraseña ✅
- Dashboard: XP, vidas, racha, rango, misiones del día ✅
- 5 niveles con 4 sub-niveles desbloqueables ✅
- Teoría con voz sincronizada palabra por palabra ✅
- Juego: timer 30s, vidas, combo, sonidos, partículas ✅
- XP y progreso guardados en Supabase ✅
- Ranking global ✅
- Recarga automática de vidas (+1 cada 30 min) ✅
- Misiones diarias con progreso y XP bonus ✅
- Sistema de rangos (Bronce → Maestro, 0–300 XP) ✅
- Sistema de logros con toasts animados ✅
- Sonido ambiente (Web Audio API, 4 capas, arranca con primer click) ✅
- Partículas centralizadas (`lib/particles.js`, 7 presets) ✅
- Conti Core evolutivo (añade anillos y símbolos según XP) ✅
- EpicMoment overlay (levelComplete, perfectRun, comboMax, rankUp…) ✅
- FondoDinamico reactivo (canvas cambia color/velocidad con eventos) ✅
- Transiciones de página (PageTransition) ✅
- Loading premium (LoadingConti) ✅
- Navbar glassmorphism ✅
- **Lint: 0 errores · Build: exitoso** ✅

---

## En qué punto quedamos

Última sesión (2026-05-09): corrección técnica completa.
- 22 errores/warnings de ESLint → 0
- Bug de `vidas || 5` corregido → `??`
- Anti-farmeo de XP implementado (check de `progreso_usuario` antes de sumar)
- Misiones: XP calculado con `xpSesionRef` (solo correctas-primera vez), bonus acumulado en una sola escritura a BD
- `supabase-policies.sql` creado (pendiente aplicar en Supabase)

---

## Pendientes inmediatos

### 1. Aplicar políticas de seguridad en Supabase
- Abrir SQL Editor en Supabase → ejecutar `supabase-policies.sql`
- Agregar columnas opcionales para logros si se quieren en BD:
  ```sql
  ALTER TABLE users ADD COLUMN IF NOT EXISTS max_combo INTEGER DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS perfect_sessions INTEGER DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS clean_sessions INTEGER DEFAULT 0;
  ```

### 2. Contenido de niveles 3, 4 y 5
- Niveles 1 y 2 tienen contenido técnico real (NIC/NIIF)
- Niveles 3 (Débitos/Créditos), 4 (Estados Financieros), 5 (Avanzado) necesitan preguntas y teoría

### 3. Deploy en Vercel
- La app nunca ha sido desplegada en producción
- `.env.local` con las variables de Supabase

---

## Problemas activos

| Problema | Impacto | Notas |
|----------|---------|-------|
| RLS deshabilitado en Supabase | Seguridad alta | Políticas listas en `supabase-policies.sql`, falta ejecutar |
| Logros dependen de campos que podrían no existir en BD (`max_combo`, etc.) | Bajo (usa `?? 0`) | El sistema funciona sin ellos; los campos son opcionales |
| `transicionDif` feature incompleta | Ninguno | La pantalla de cambio de dificultad nunca se muestra, es `null` constante |
| Imágenes en preguntas (`imagen_url`) | Bajo | Columna existe en BD, ninguna pregunta tiene URL aún |

---

## Stack y archivos clave

**Stack:** Next.js 16 · React 19 · Tailwind CSS v4 · Supabase · Web Audio API · Web Speech API

```
app/
  page.jsx              Dashboard principal
  login/page.jsx        Login + Registro
  niveles/page.jsx      Mapa de niveles
  lecciones/page.jsx    Motor del juego (archivo más grande)
  ranking/page.jsx      Tabla de posiciones
  globals.css           Tema, colores CSS y todas las animaciones

components/
  Mascota.jsx           Conti Core SVG (evolutivo por XP)
  Navbar.jsx            Navegación glassmorphism
  FondoDinamico.jsx     Canvas reactivo (fondo)
  PageTransition.jsx    Fade+slide entre páginas
  LoadingConti.jsx      Pantalla de carga premium
  EpicMoment.jsx        Overlay cinematográfico de eventos
  AchievementToast.jsx  Toast de logros con cola
  Particles.jsx         Sistema de partículas

lib/
  supabaseClient.js     Cliente Supabase
  audio.js              Todos los sonidos (Web Audio API)
  ambient.js            Sonido ambiente 4 capas
  achievements.js       12 logros, rareza, localStorage
  particles.js          7 presets de partículas
  rankTheme.js          Temas visuales por rango
  motion.js             Constantes de animación centralizadas
  frases.js             Frases contextuales del búho
  
supabase-policies.sql   SQL de RLS y constraints (pendiente aplicar)
```

**BD (Supabase):** `users` · `niveles` · `lecciones` · `progreso_usuario` · `misiones_diarias`

**Variables de entorno:** `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Dev local:** `npm run dev` → localhost:3000 | ngrok para exponer externamente
