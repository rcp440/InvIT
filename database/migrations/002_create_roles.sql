-- ============================================================
-- MIGRACIÓN 002: TABLA ROLES Y PERMISOS
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(200),
    permisos    JSONB NOT NULL DEFAULT '{}'::jsonb,
    es_sistema  BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE roles IS 'Roles del sistema: superadmin, admin_empresa, operador';
COMMENT ON COLUMN roles.permisos IS 'Mapa de permisos: {"activos": {"crear":true, "leer":true, "editar":true, "eliminar":false}}';
COMMENT ON COLUMN roles.es_sistema IS 'true = rol del sistema, no puede modificarse ni eliminarse';
