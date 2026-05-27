-- ============================================================
-- MIGRACIÓN 007: TABLA RESPONSABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS responsables (
    id              SERIAL PRIMARY KEY,
    tenant_id       UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre          VARCHAR(100) NOT NULL,
    apellido        VARCHAR(100) NOT NULL,
    email           VARCHAR(150),
    telefono        VARCHAR(30),
    departamento    VARCHAR(150),
    cargo           VARCHAR(150),
    activo          BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_responsables_tenant ON responsables(tenant_id);
CREATE INDEX idx_responsables_activo ON responsables(activo);

COMMENT ON TABLE responsables IS 'Personas responsables de activos dentro de cada empresa';
