-- ══════════════════════════════════════════════════════════════════
--  ContaLearn — Supabase RLS Policies & Schema Constraints
--  Aplica en el SQL Editor de tu proyecto Supabase.
--  IMPORTANTE: Revisa cada política antes de ejecutar.
-- ══════════════════════════════════════════════════════════════════

-- ── 1. HABILITAR RLS EN TODAS LAS TABLAS ─────────────────────────
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE progreso_usuario     ENABLE ROW LEVEL SECURITY;
ALTER TABLE misiones_diarias     ENABLE ROW LEVEL SECURITY;
ALTER TABLE niveles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecciones            ENABLE ROW LEVEL SECURITY;


-- ── 2. TABLA: users ──────────────────────────────────────────────
-- Cada usuario solo puede leer y editar su propia fila.

DROP POLICY IF EXISTS "users: select own" ON users;
CREATE POLICY "users: select own"
  ON users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "users: insert own" ON users;
CREATE POLICY "users: insert own"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users: update own" ON users;
CREATE POLICY "users: update own"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Nadie puede borrar usuarios desde el cliente
DROP POLICY IF EXISTS "users: no delete" ON users;
-- (sin política DELETE = nadie puede borrar)


-- ── 3. TABLA: progreso_usuario ───────────────────────────────────
-- Cada usuario solo ve y escribe su propio progreso.

DROP POLICY IF EXISTS "progreso: select own" ON progreso_usuario;
CREATE POLICY "progreso: select own"
  ON progreso_usuario FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "progreso: insert own" ON progreso_usuario;
CREATE POLICY "progreso: insert own"
  ON progreso_usuario FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "progreso: update own" ON progreso_usuario;
CREATE POLICY "progreso: update own"
  ON progreso_usuario FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ── 4. TABLA: misiones_diarias ───────────────────────────────────
-- Cada usuario solo ve y escribe sus propias misiones.

DROP POLICY IF EXISTS "misiones: select own" ON misiones_diarias;
CREATE POLICY "misiones: select own"
  ON misiones_diarias FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "misiones: insert own" ON misiones_diarias;
CREATE POLICY "misiones: insert own"
  ON misiones_diarias FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "misiones: update own" ON misiones_diarias;
CREATE POLICY "misiones: update own"
  ON misiones_diarias FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ── 5. TABLA: niveles (solo lectura autenticada) ─────────────────

DROP POLICY IF EXISTS "niveles: read authenticated" ON niveles;
CREATE POLICY "niveles: read authenticated"
  ON niveles FOR SELECT
  USING (auth.role() = 'authenticated');


-- ── 6. TABLA: lecciones (solo lectura autenticada) ───────────────

DROP POLICY IF EXISTS "lecciones: read authenticated" ON lecciones;
CREATE POLICY "lecciones: read authenticated"
  ON lecciones FOR SELECT
  USING (auth.role() = 'authenticated');


-- ── 7. RANKING: vista segura (XP de todos, sin datos privados) ───
-- Si no tienes una vista, crea una:
-- CREATE OR REPLACE VIEW ranking_publico AS
--   SELECT id, username, xp_total, racha_actual FROM users;

-- Policy para la vista (si la creas):
-- DROP POLICY IF EXISTS "ranking: read authenticated" ON ranking_publico;
-- CREATE POLICY "ranking: read authenticated"
--   ON ranking_publico FOR SELECT
--   USING (auth.role() = 'authenticated');


-- ══════════════════════════════════════════════════════════════════
--  CONSTRAINTS de integridad
-- ══════════════════════════════════════════════════════════════════

-- ── 8. UNIQUE en progreso_usuario ────────────────────────────────
-- Evita que un usuario registre la misma lección dos veces.
ALTER TABLE progreso_usuario
  ADD CONSTRAINT IF NOT EXISTS progreso_unique_user_leccion
  UNIQUE (user_id, leccion_id);


-- ── 9. UNIQUE en misiones_diarias ────────────────────────────────
-- Evita insertar la misma misión dos veces en el mismo día.
ALTER TABLE misiones_diarias
  ADD CONSTRAINT IF NOT EXISTS misiones_unique_user_fecha_tipo
  UNIQUE (user_id, fecha, tipo);


-- ── 10. CHECK: vidas entre 0 y 5 ─────────────────────────────────
ALTER TABLE users
  ADD CONSTRAINT IF NOT EXISTS users_vidas_range
  CHECK (vidas BETWEEN 0 AND 5);


-- ── 11. CHECK: xp_total no negativo ──────────────────────────────
ALTER TABLE users
  ADD CONSTRAINT IF NOT EXISTS users_xp_positivo
  CHECK (xp_total >= 0);


-- ══════════════════════════════════════════════════════════════════
--  COLUMNAS OPCIONALES (para el sistema de logros)
--  Ejecuta solo si las columnas no existen aún en tu BD.
-- ══════════════════════════════════════════════════════════════════

-- ALTER TABLE users ADD COLUMN IF NOT EXISTS max_combo        INTEGER DEFAULT 0;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS perfect_sessions INTEGER DEFAULT 0;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS clean_sessions   INTEGER DEFAULT 0;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS ultima_leccion_fecha DATE;
