-- ============================================================
-- MIGRACIÓN 015: COLUMNA deleted_at EN TABLAS CON SOFT DELETE
-- Permite auditar CUÁNDO se eliminó cada registro, no solo si está inactivo.
-- ============================================================

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE categorias
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE ubicaciones
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE responsables
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
