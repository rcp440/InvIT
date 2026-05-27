-- ============================================================
-- MIGRACIÓN 004: TABLA CATEGORÍAS
-- ============================================================

CREATE TABLE IF NOT EXISTS categorias (
    id          SERIAL PRIMARY KEY,
    tenant_id   UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre      VARCHAR(100) NOT NULL,
    descripcion VARCHAR(300),
    icono       VARCHAR(100) DEFAULT 'fa-box',
    color       VARCHAR(20) DEFAULT '#6c757d',
    activo      BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_categoria_nombre_tenant UNIQUE (nombre, tenant_id)
);

CREATE INDEX idx_categorias_tenant ON categorias(tenant_id);
CREATE INDEX idx_categorias_activo ON categorias(activo);

COMMENT ON TABLE categorias IS 'Categorías de activos por tenant: PCs, notebooks, monitores, sillas, etc.';
