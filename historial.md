# ContaLearn — Historial del proyecto
> Registro acumulativo. No borrar. Agregar al final con fecha.

---

## Referencia técnica permanente

### Base de datos (Supabase)

**`users`**
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK, viene de auth.users |
| email | text | Correo |
| username | text | Nombre elegido en registro |
| xp_total | integer | XP acumulado |
| racha_actual | integer | Días seguidos jugando |
| vidas | integer | 0–5 |
| ultima_vida_recargada | timestamptz | Para recarga automática |
| ultima_leccion_fecha | date | Para calcular días sin entrar |

**`niveles`** — id, titulo, descripcion, emoji, color, orden, teoria_json (array de slides)

**`lecciones`** — id, nivel_id, tipo_ejercicio, contenido_json, orden, dificultad (1–4)

**`progreso_usuario`** — id, user_id, leccion_id, completado, puntaje

**`misiones_diarias`** — id, user_id, fecha, tipo, descripcion, icono, meta, progreso, completada, xp_recompensa

Índices SQL aplicados:
```sql
CREATE INDEX idx_lecciones_nivel_dif ON lecciones(nivel_id, dificultad);
CREATE INDEX idx_progreso_user       ON progreso_usuario(user_id, completado);
CREATE INDEX idx_users_xp            ON users(xp_total DESC);
CREATE INDEX idx_misiones_user_fecha ON misiones_diarias(user_id, fecha);
```

### Sistema de sub-niveles

Cada nivel principal tiene 4 sub-niveles desbloqueables en orden:
- 🟢 Junior (preguntas 1–2) · teoría solo aquí
- 🔵 Semi-Junior (3–4) · va directo al juego
- 🟣 Semi-Senior (5) · va directo al juego
- 🔴 Senior (6) · va directo al juego

### Rangos

| Rango | XP mínimo |
|-------|-----------|
| 🥉 Bronce | 0 |
| 🥈 Plata | 60 |
| 🥇 Oro | 120 |
| 💎 Platino | 180 |
| 💠 Diamante | 240 |
| 👑 Maestro | 300 |

5 niveles × 6 preguntas × 10 XP = 300 XP = Maestro 👑

### Conti Core (Mascota.jsx) — niveles de evolución

| evolutionLevel | XP | Cambio visual |
|---|---|---|
| 0 | 0–59 | 3 anillos base |
| 1 | 60+ | +Anillo 4 cyan dasharray |
| 2 | 120+ | +Anillo 5 azul |
| 3 | 180+ | +Anillo 6 morado |
| 4 | 240+ | +Anillo 7 dorado (dual dot) |
| 5 | 300 | +Símbolos ∑ % $ orbitando |

### Partículas — presets disponibles

`combo` · `xpGain` · `rankUp` · `levelComplete` · `error` · `achievement` · `confetti` · `mission`

### Logros — 12 en total

Rareza: common · uncommon · rare · epic · legendary
Condiciones: xp (10/100/200/300) · maxCombo (3/5/8) · racha (3/7/30) · perfectSessions · cleanSessions
Storage: localStorage key `cl_achievements_v2`

### Sonidos (lib/audio.js — Web Audio API, sin archivos externos)

Escala ESCALA[combo-1] para correcto. rankUp = arpeggio 5 notas + acorde. Master vol 0.38.

### Ambient (lib/ambient.js)

4 capas: 55 Hz sine · 110 Hz triangle · 880 Hz sine · 221 Hz sine. Fade-in 3–5s. Vol master 0.032.

### Misiones diarias — pool de tipos

| Tipo | Meta |
|------|------|
| responder_preguntas | 10 preguntas |
| correctas_seguidas | 5 seguidas |
| completar_subniveles | 2 subniveles |
| sin_perder_vida | 1 sesión limpia |
| racha_combo | combo 3 |
| xp_ganar | 50 XP |

Recompensa: +15 XP por misión. Resetean a medianoche por fecha.

### Configuración

```
next.config.ts     turbopack + allowedDevOrigins ngrok
.env.local         NEXT_PUBLIC_SUPABASE_URL / ANON_KEY
SMTP               Gmail smtp.gmail.com:587 App Password
```

---

## [2026-05-09] — Sesión: UX premium completa + corrección técnica

### Decisiones tomadas

- **Partículas centralizadas en `lib/particles.js`** para no hardcodear en cada componente. Patrón mount-to-play con `key` cambiante.
- **Logros en localStorage** (`cl_achievements_v2`) en lugar de tabla Supabase adicional. Más simple, sin migración de BD. Trade-off: no persiste entre dispositivos.
- **Ambient sound singleton** (`lib/ambient.js`): solo un AudioContext global, se inicia con primer gesto del usuario (política de autoplay del navegador).
- **`useMemo` para opciones mezcladas** en lecciones: eliminó el useEffect+setState que causaba cascadas de render. `mezclar()` re-ejecuta solo cuando cambia `indice`.
- **Anti-farmeo XP**: se consulta `progreso_usuario` antes de sumar XP. Si la lección ya existe, el combo y feedback visual siguen funcionando pero no se suma XP ni se inserta progreso.
- **Bonus de misiones acumulado**: se suma `totalBonus` de todas las misiones que completan juntas y se hace una sola lectura+escritura a BD, evitando sobrescribir con valor stale de closure.
- **`xpSesionRef`** para trackear XP real ganado en la sesión (solo primeras veces correctas). Reemplaza el cálculo incorrecto `preguntasRespRef * 10` que contaba incorrectas.
- **`transicionDif = null` constante**: la pantalla de transición de dificultad es feature futura, se dejó como placeholder sin useState para no tener setter unused.
- **`function` declarations en lugar de `const` arrows** para `hablar`, `manejarTiempoAgotado`, `cargarOGenerarMisiones`: necesario porque el ESLint plugin `react-hooks/immutability` no respeta hoisting de `const` y reporta "accessed before declared".

### Funcionalidades completadas en esta sesión

- `lib/particles.js` — 7 presets, `generateParticles()`
- `components/Particles.jsx` — mount-to-play, sin hydration mismatch
- `lib/achievements.js` — 12 logros, RARITY, check/get/getAll
- `components/AchievementToast.jsx` — toast con cola, fases hidden→enter→visible→exit
- `lib/ambient.js` — sonido ambiente 4 capas
- `components/Mascota.jsx` — Conti Core evolutivo (anillos 4–7 + símbolos financieros)
- `app/globals.css` — `particle-fly` usa `var(--tx)`, `achievement-pulse` keyframe
- `app/page.jsx` — ambient integrado, logros al cargar perfil, `xp={xp}` a Mascota, AchievementToast con cola
- `app/lecciones/page.jsx` — logros al terminar sesión, anti-farmeo XP, misiones corregidas

### Problemas resueltos

| Problema | Fix |
|----------|-----|
| 22 errores/warnings ESLint | → 0 (ver arriba) |
| `vidas \|\| 5` roto con 0 vidas | `?? 5` |
| XP duplicado por repetir lecciones | Check `progreso_usuario` antes de sumar |
| Misiones: XP calculado con preguntas totales | `xpSesionRef` solo correcto-primera vez |
| Bonuses de misiones se pisaban | `totalBonus` acumulado + una sola escritura |
| `useRef` en render (Particles) | `useState + useEffect + setTimeout(0)` |
| setState síncrono en 6 efectos | `setTimeout(0)` o `useMemo` según caso |
| Funciones usadas antes de declararse | `function` declarations + reordenamiento físico |
| `resto`, `emoji`, `textoSlide`, `Pantalla` unused | Eliminados |

---

## [2026-05-10] — Sesión: Contenido niveles 3/4/5 + fixes + deploy

### Decisiones tomadas

- **Columnas reales de la BD**: `niveles` usa `titulo`/`emoji` (no `nombre`/`icono`). `lecciones` no tiene columna `titulo`. Descubierto al ejecutar el seed SQL.
- **Verdadero/Falso en BD como `"true"`/`"false"`** (strings), no `"Verdadero"`/`"Falso"`. El UI hardcodea esos valores internamente. Función `mostrarRespuesta()` convierte para display.
- **Ambient movido al layout**: `AmbientProvider.jsx` en `layout.jsx` para que persista entre páginas sin reiniciarse. El dashboard ya no maneja el ambient.
- **Lo-fi gaming ambient**: arpeggio pentatónico menor de La (A C D E G A G E), scheduler de Web Audio API sin drift, bajo continuo en A1. Reemplazó el pad de acordes Am7 y el drone "Espacio".
- **DELETE antes de INSERT en seed**: necesario porque nivel 3 tenía lecciones previas. Se borran también registros de `progreso_usuario` para respetar FK.

### Funcionalidades completadas

- 63 lecciones nuevas en niveles 3/4/5 (21 × 3), 4 dificultades cada uno
- Teoría (5 slides) para niveles 3/4/5 en `teoria_json`
- `mostrarRespuesta()` en `lecciones/page.jsx` — convierte `"true"`/`"false"` a `"Verdadero"`/`"Falso"` en resultados
- `AmbientProvider.jsx` — Client Component para ambient global en layout
- Deploy en Vercel: contalearn.vercel.app (conectado a GitHub Manuko18/contalearn)
- Repo GitHub inicializado y subido desde cero

### Problemas resueltos

| Problema | Fix |
|----------|-----|
| Voz sigue al navegar a otra página | `useEffect` unmount cancela `speechSynthesis` |
| Voz sigue al avanzar rápido entre slides | `return () => cancel()` en useEffect de teoría |
| Voz suena en pantalla "Sin vidas" | `useEffect` que cancela cuando `vidas <= 0` |
| Voz suena aunque `PantallaFin` esté activa | `if (vidas <= 0) return` en useEffect de teoría |
| Botones X no detenían voz al instante | `detenerVoz()` antes de `router.push` |
| Preguntas verdadero/falso siempre incorrectas | BD tenía `"Verdadero"`, UI compara `"true"` → UPDATE SQL |
| Ambient se cortaba al cambiar de página | Movido a layout como singleton global |
| Seed SQL fallaba por columnas inexistentes | Corregido `nombre`→`titulo`, `icono`→`emoji`, removido `titulo` de lecciones |
| FK constraint al borrar lecciones | DELETE de `progreso_usuario` primero, luego DELETE de `lecciones` |

<!-- Agregar nuevas sesiones aquí arriba de esta línea, con formato [YYYY-MM-DD] -->
