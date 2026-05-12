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
| empresa_mes | int | Mes actual en modo empresa (default 0) |
| titulo_empresa | text | Título ganado en empresa (null si ninguno) |

**`niveles`** — id, titulo, descripcion, emoji, color, orden, teoria_json (array de slides)

**`lecciones`** — id, nivel_id, tipo_ejercicio, contenido_json, orden, dificultad (1–4)

**`progreso_usuario`** — id, user_id, leccion_id, completado, puntaje

**`misiones_diarias`** — id, user_id, fecha, tipo, descripcion, icono, meta, progreso, completada, xp_recompensa

**`user_mistakes`** — id, user_id, nivel_id, leccion_id, pregunta, tu_respuesta, respuesta_correcta, created_at

**`empresa_preguntas`** — id, mes, situacion, pregunta, opciones (jsonb), respuesta_correcta, explicacion, dificultad (facil/normal/dificil), created_at

**`reportes_preguntas`** — id, pregunta_id (→empresa_preguntas, nullable), pregunta_texto, respuesta_correcta, explicacion, reportado_por, created_at

Índices SQL aplicados:
```sql
CREATE INDEX idx_lecciones_nivel_dif ON lecciones(nivel_id, dificultad);
CREATE INDEX idx_progreso_user       ON progreso_usuario(user_id, completado);
CREATE INDEX idx_users_xp            ON users(xp_total DESC);
CREATE INDEX idx_misiones_user_fecha ON misiones_diarias(user_id, fecha);
```

### Sistema de rangos

| Rango | XP mínimo |
|-------|-----------|
| 🥉 Bronce | 0 |
| 🥈 Plata | 60 |
| 🥇 Oro | 120 |
| 💎 Platino | 180 |
| 💠 Diamante | 240 |
| 👑 Maestro | 300 |

### Títulos modo empresa

| Título | Desde mes |
|--------|-----------|
| 📋 Contador Jr. | 1 |
| 📊 Contador | 3 |
| 💼 Contador Sr. | 6 |
| 👔 CFO | 10 |

### Logros — 16 en total (12 base + 4 empresa)

Rareza: common · uncommon · rare · epic · legendary
Storage: localStorage key `cl_achievements_v2`
Empresa: empresa_mes1 · empresa_contador · empresa_senior · empresa_cfo

### Conti Core (Mascota.jsx) — niveles de evolución

| evolutionLevel | XP | Cambio visual |
|---|---|---|
| 0 | 0–59 | 3 anillos base |
| 1 | 60+ | +Anillo 4 cyan |
| 2 | 120+ | +Anillo 5 azul |
| 3 | 180+ | +Anillo 6 morado |
| 4 | 240+ | +Anillo 7 dorado |
| 5 | 300 | +Símbolos ∑ % $ orbitando |

### Partículas — presets disponibles

`combo` · `xpGain` · `rankUp` · `levelComplete` · `error` · `achievement` · `confetti` · `mission`

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

- **Partículas centralizadas en `lib/particles.js`** para no hardcodear en cada componente.
- **Logros en localStorage** (`cl_achievements_v2`) en lugar de tabla Supabase adicional. Trade-off: no persiste entre dispositivos.
- **Ambient sound singleton** (`lib/ambient.js`): solo un AudioContext global, se inicia con primer gesto del usuario.
- **`useMemo` para opciones mezcladas** en lecciones: eliminó el useEffect+setState que causaba cascadas de render.
- **Anti-farmeo XP**: se consulta `progreso_usuario` antes de sumar XP. Si ya existe, no suma.
- **`xpSesionRef`** para trackear XP real ganado en la sesión (solo primeras veces correctas).
- **`transicionDif = null` constante**: feature futura, placeholder sin useState.
- **`function` declarations** para `hablar`, `manejarTiempoAgotado`, `cargarOGenerarMisiones`: necesario por hoisting con ESLint.

### Funcionalidades completadas

- `lib/particles.js`, `components/Particles.jsx`, `lib/achievements.js`, `components/AchievementToast.jsx`
- `lib/ambient.js`, `components/Mascota.jsx` (Conti Core evolutivo)
- Anti-farmeo XP, misiones corregidas, logros al terminar sesión

### Problemas resueltos

| Problema | Fix |
|----------|-----|
| 22 errores/warnings ESLint | → 0 |
| `vidas \|\| 5` roto con 0 vidas | `?? 5` |
| XP duplicado por repetir lecciones | Check `progreso_usuario` antes de sumar |
| Bonuses de misiones se pisaban | `totalBonus` acumulado + una sola escritura |

---

## [2026-05-10] — Sesión: Contenido niveles 3/4/5 + fixes + deploy

### Decisiones tomadas

- **Columnas reales de la BD**: `niveles` usa `titulo`/`emoji` (no `nombre`/`icono`).
- **Verdadero/Falso en BD como `"true"`/`"false"`** (strings). `mostrarRespuesta()` convierte para display.
- **Ambient movido al layout**: `AmbientProvider.jsx` en `layout.jsx` para persistir entre páginas.
- **DELETE antes de INSERT en seed**: necesario por FK constraints.

### Funcionalidades completadas

- 63 lecciones nuevas en niveles 3/4/5, teoría para cada uno
- `AmbientProvider.jsx` — ambient global en layout
- Deploy en Vercel: contalearn.vercel.app

### Problemas resueltos

| Problema | Fix |
|----------|-----|
| Voz sigue al navegar | `useEffect` unmount cancela `speechSynthesis` |
| Ambient se cortaba al cambiar página | Movido a layout como singleton |
| Seed SQL fallaba por columnas inexistentes | Corregido `nombre`→`titulo`, `icono`→`emoji` |

---

## [2026-05-11] — Sesión: 8 niveles lineales + tributación + modo test

### Decisiones tomadas

- **Reestructura 5→8 niveles lineales**: eliminados los 4 sub-tiers por feedback (confusos). Ahora 8 niveles agrupados en 4 categorías visuales.
- **`vozIdRef` counter**: cada `hablar()` recibe ID único. Elimina race conditions en navegación rápida.
- **Botón con relleno de color** (`botonFill`): width 0→100% en 1.2s. Previene skip ultra-rápido.
- **Modo Test en localStorage**: persiste entre páginas. Vidas=99, sin guardar XP/progreso.

### Funcionalidades completadas

- `app/niveles/page.jsx` reescrito: 8 niveles lineales, categorías, botón 🧪 Test
- Niveles 6/7/8: IVA, Impuesto Renta, Liquidación (12 preguntas c/u)
- `vozIdRef`, `botonListo/botonFill`, modo test completo

### Problemas resueltos

| Problema | Fix |
|----------|-----|
| Voz sigue sonando al skip rápido | `vozIdRef` counter + `detenerVozGlobal()` |
| Race condition audio entre slides | `vozIdRef` — timeout abortado si ID no coincide |
| Preguntas VF siempre incorrectas | SQL UPDATE: `respuesta_correcta = "true"/"false"` |

---

## [2026-05-12] — Sesión: Limpieza BD + integración Claude API

### Decisiones tomadas

- **Claude Haiku** elegido sobre Sonnet para explicaciones: ~4× más barato (~$0.003/sesión).
- **Una sola llamada al final** de la sesión: todos los errores juntos, más eficiente.
- **Separador `===`** entre bloques (en vez de `[N]`): Claude lo respeta siempre.
- **`max_tokens: 2048`**: 1024 insuficiente para 3+ errores.
- **9 lecciones `completar_espacio`** convertidas a `multiple_choice`.

### Funcionalidades completadas

- `app/api/explicar/route.js` — Haiku, parseo 4 secciones por error con separador `===`
- Pantalla resultados: spinner + cards IA (📘 Concepto, 🔢 Ejemplo, ⚠️ Tu error, 🎯 Practica)
- Créditos Anthropic cargados ($5 USD)

### Problemas resueltos

| Problema | Fix |
|----------|-----|
| Solo 1 explicación de N errores | Separador `===` + `max_tokens: 2048` |
| 9 lecciones rompían el juego | Convertidas a `multiple_choice` con opciones |

---

## [2026-05-13] — Sesión: 4 modos IA + banco preguntas + sistema reportes

### Decisiones tomadas

- **Tutor con system prompt estricto**: solo responde contabilidad/Ecuador. Si se sale del tema responde frase fija.
- **Práctica extra sin XP**: ejercicios generados por IA separados del juego oficial para no contaminar el balance.
- **Banco `empresa_preguntas`**: preguntas generadas se guardan y reutilizan entre usuarios. Solo gasta tokens cuando el banco se agota. Campo `dificultad` (facil/normal/dificil).
- **Dificultad adaptativa empresa**: 2 fallos→fácil, 6 aciertos seguidos→difícil, 3 fallos difícil→normal.
- **Pregunta actual en localStorage**: evita regenerar al recargar página.
- **Meses anteriores sin XP**: se puede repasar sin farmear.
- **Sonnet solo para reportes**: Haiku para todo lo demás. Costo extra de Sonnet mínimo (pocos reportes).
- **Pre-filtro automático**: usuario reporta → Sonnet decide si es error real → solo guarda si confirma error → admin solo ve las realmente malas.
- **Panel admin por email**: `lotor210799@gmail.com` y `lotor5252@gmail.com`. URL `/admin` no vinculada en la app.

### Funcionalidades completadas

- `/tutor` — chat tutor IA por nivel con botones rápidos
- `/practica` — práctica extra sin XP, banco reutilizable
- `/empresa` — modo empresa simulada completo con dificultad adaptativa
- `/admin` — panel admin con pre-filtro Sonnet
- `api/tutor`, `api/generar-ejercicio`, `api/empresa`, `api/reportar`
- `user_mistakes` — guarda errores del juego, historial pasado a Claude en explicaciones
- 4 logros exclusivos del modo empresa
- Títulos empresa visibles en ranking

### Problemas resueltos

| Problema | Fix |
|----------|-----|
| `useSearchParams` sin Suspense en Next.js 16 | `export const dynamic = "force-dynamic"` + Suspense wrapper |
| Preguntas regeneradas al recargar | Guardar pregunta actual en localStorage |
| Recargar generaba tokens nuevos | `if (!caso) generarCaso()` en useEffect |
| JSX hermanos sin wrapper en practica | `<div>` envolviendo los dos botones |
| Contradicción respuesta/explicación en IA | Prompt reformulado: primero respuesta, luego explicación, luego opciones incorrectas |
| max_tokens 512 cortaba JSON | Aumentado a 1024 |

---

## [2026-05-14] — Sesión: Lecciones migradas a IA + progresión de dificultad

### Decisiones tomadas

- **Eliminar preguntas estáticas de `lecciones`**: el juego ya no carga de la tabla `lecciones`. Todo viene de IA (banco `nivel_preguntas`). La tabla `lecciones` queda en BD pero sin uso en el juego.
- **Banco `nivel_preguntas`** por nivel/dificultad/slide_idx/tipo: igual que empresa. Límite 20 por dificultad (60 máximo por nivel). Cuando banco lleno, rota existentes sin generar más.
- **Rotación por slide**: cada pregunta se ancla a un slide específico de `teoria_json` usando `angulo % slides.length`. Garantiza que el juego evalúe toda la teoría, no solo el primer concepto.
- **5 ángulos de pregunta**: Definición · Ejemplo práctico · Comparación · Norma específica · Error común. Asignados por índice, evitan reformulaciones del mismo concepto.
- **3 tipos de pregunta**: `multiple_choice`, `verdadero_falso`, `completar_espacio`. Orden aleatorio por sesión (lista de 10 mezclada al inicio).
- **Anti-duplicados doble**: banco existente + preguntas ya generadas en la misma sesión se pasan a Haiku con instrucción "COMPLETAMENTE DIFERENTE".
- **`preguntasVistasIds` en localStorage** por nivel: evita repetir del banco entre sesiones.
- **Progresión fácil→normal→difícil en `progreso_nivel`**: tabla nueva con PK (user_id, nivel_id, dificultad). Se guarda al aprobar (≥70%). El siguiente nivel se desbloquea cuando el anterior tiene 'dificil' completado.
- **XP siempre**: +10 por acierto sin check anti-farmeo (las preguntas rotan, no hay ID fijo que bloquear).
- **`completar_espacio` respuesta única**: prompt fuerza máx 2 palabras, sin alternativas ("X o Y" prohibido).
- **10 preguntas por sesión**: aumentado desde 5 para mejor cobertura de la teoría.
- **Dificultad desde DB no localStorage**: al entrar a un nivel se carga `progreso_nivel` y se deriva la dificultad actual.

### Funcionalidades completadas

- `api/generar-leccion/route.js` — banco + Haiku, dificultad, slide_idx, tipo, anti-duplicados
- `lecciones/page.jsx` — migrado a IA completo, badge dificultad, mensajes progresión en resultados
- `niveles/page.jsx` — desbloqueo por `progreso_nivel`, cards muestran 3 badges (🟢/🟡/🔴)
- Tabla `progreso_nivel` en Supabase (con RLS)
- Tabla `nivel_preguntas` con columnas: dificultad, slide_idx, tipo

### Problemas resueltos

| Problema | Fix |
|----------|-----|
| 5 preguntas iguales por tema único | Ángulos forzados (definición/ejemplo/norma/etc.) + slide específico |
| Preguntas solo del primer slide | `slideIdx = angulo % allSlides.length` — cada pregunta ancla a un slide |
| Respuesta completar con "X o Y" | Prompt reforzado: máx 2 palabras, sin alternativas |
| Banco crecía infinito | Límite 20/dificultad; si banco lleno, sirve existentes |
| Dificultad no persistía entre dispositivos | Migrado de localStorage a tabla `progreso_nivel` en Supabase |

<!-- Agregar nuevas sesiones aquí arriba de esta línea, con formato [YYYY-MM-DD] -->
