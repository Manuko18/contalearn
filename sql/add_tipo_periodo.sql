-- Migración: agregar columna tipo_periodo a misiones_diarias
-- Ejecutar en Supabase SQL Editor una sola vez.

ALTER TABLE misiones_diarias
  ADD COLUMN IF NOT EXISTS tipo_periodo text NOT NULL DEFAULT 'diaria';
