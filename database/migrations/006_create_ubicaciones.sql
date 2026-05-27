-- ============================================================
-- MIGRACIÓN 006: TABLA UBICACIONES
-- ============================================================

CREATE TABLE IF NOT EXISTS ubicaciones (
    id          SERIAL PRIMARY KEY,
    tenant_id   UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre      VARCHAR(150) NOT NULL,
    descripcion VARCHAR(300),
    piso        VARCHAR(50),
    sector      VARCHAR(100),
    activo      BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_ubicacion_nombre_tenant UNIQUE (nombre, tenant_id)
);

CREATE INDEX idx_ubicaciones_tenant ON ubicaciones(tenant_id);
CREATE INDEX idx_ubicaciones_activo ON ubicaciones(activo);

COMMENT ON TABLE ubicaciones IS 'Ubicaciones físicas de activos: oficinas, depósitos, pisos, sectores';
