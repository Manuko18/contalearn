-- Correr en Supabase SQL Editor
-- Agrega columnas para el sistema de logros acumulativos

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS max_combo        integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS perfect_sessions integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clean_sessions   integer DEFAULT 0;
