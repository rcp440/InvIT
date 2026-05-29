-- ============================================================
-- MIGRACIÓN 016: ESTADOS POR TENANT
-- Agrega tenant_id opcional a estados.
-- NULL = estado global del sistema (visible para todos).
-- Con tenant_id = estado propio de esa empresa.
-- ============================================================

ALTER TABLE estados
    ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS activo    BOOLEAN NOT NULL DEFAULT true;

-- Índice para consultas por tenant
CREATE INDEX IF NOT EXISTS idx_estados_tenant ON estados(tenant_id);

-- Los estados existentes (tenant_id=NULL) son globales y visibles para todos
COMMENT ON COLUMN estados.tenant_id IS 'NULL = estado global del sistema; UUID = estado propio del tenant';
