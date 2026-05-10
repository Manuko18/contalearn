# ContaLearn — Contexto actual
> Última actualización: 2026-05-10

---

## Estado de la app (qué funciona hoy)

- Login / registro / recuperar contraseña ✅
- Dashboard: XP, vidas, racha, rango, misiones del día ✅
- 5 niveles con 4 sub-niveles desbloqueables ✅
- **Contenido real en los 5 niveles** (63 preguntas nuevas en niveles 3/4/5) ✅
- Teoría con voz sincronizada palabra por palabra ✅
- Juego: timer 30s, vidas, combo, sonidos, partículas ✅
- XP y progreso guardados en Supabase ✅
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

Última sesión (2026-05-10): contenido niveles 3/4/5 + fixes de bugs + deploy.

- Contenido cargado en Supabase: 21 lecciones × 3 niveles (63 total)
- Bug verdadero/falso corregido (UI usaba `"true"`/`"false"`, BD tenía `"Verdadero"`/`"Falso"`)
- Voz que seguía sonando al salir/quedarse sin vidas → corregida
- Ambient movido al layout (persiste entre páginas), rediseñado como lo-fi gaming
- Deploy exitoso en Vercel conectado al repo GitHub `Manuko18/contalearn`

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

### 2. Corregir pregunta con referencia al PUC colombiano
- Nivel 3, orden 5 y orden 16 tienen referencias al "PUC colombiano" que no corresponden a NIC/NIIF
- SQL de corrección listo (ver última sesión del historial)

### 3. Para futuros cambios al código
```
git add .
git commit -m "descripción"
git push
```
Vercel redespliega automáticamente.

---

## Problemas activos

| Problema | Impacto | Notas |
|----------|---------|-------|
| RLS deshabilitado en Supabase | Seguridad alta | `supabase-policies.sql` listo, falta ejecutar |
| 2 preguntas nivel 3 mencionan PUC colombiano | Bajo | SQL de fix pendiente de ejecutar |
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
  niveles/page.jsx      Mapa de niveles
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

seed-niveles-3-4-5.sql  Contenido niveles 3/4/5 (ya ejecutado)
supabase-policies.sql   RLS pendiente de ejecutar
```

**BD:** `users` · `niveles` · `lecciones` · `progreso_usuario` · `misiones_diarias`

**Columnas lecciones usadas:** `nivel_id` · `orden` · `tipo_ejercicio` · `dificultad` · `contenido_json`

**Columnas niveles usadas:** `titulo` · `descripcion` · `emoji` · `orden` · `teoria_json`
