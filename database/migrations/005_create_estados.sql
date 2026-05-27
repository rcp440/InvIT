-- ============================================================
-- MIGRACIÓN 005: TABLA ESTADOS DE ACTIVOS
-- ============================================================

CREATE TABLE IF NOT EXISTS estados (
    id          SERIAL PRIMARY KEY,
    tenant_id   UUID REFERENCES empresas(id) ON DELETE CASCADE,
    nombre      VARCHAR(80) NOT NULL,
    descripcion VARCHAR(200),
    color       VARCHAR(20) NOT NULL DEFAULT '#6c757d',
    icono       VARCHAR(100) DEFAULT 'fa-circle',
    es_global   BOOLEAN NOT NULL DEFAULT false,
    activo      BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- tenant_id NULL = estado global del sistema
    CONSTRAINT uq_estado_nombre_tenant UNIQUE (nombre, tenant_id)
);

CREATE INDEX idx_estados_tenant   ON estados(tenant_id);
CREATE INDEX idx_estados_global   ON estados(es_global);

COMMENT ON TABLE estados IS 'Estados de activos. es_global=true son compartidos por todos los tenants';
