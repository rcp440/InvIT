-- Tabla de secuencias atómicas para generación de códigos de activos.
-- Reemplaza el COUNT(*)+1 que tenía race condition bajo concurrencia.
-- INSERT ... ON CONFLICT DO UPDATE garantiza atomicidad sin locks explícitos.

CREATE TABLE IF NOT EXISTS codigos_secuencia (
    tenant_id  UUID         NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    prefijo    VARCHAR(20)  NOT NULL,
    ultimo     INTEGER      NOT NULL DEFAULT 0,
    PRIMARY KEY (tenant_id, prefijo)
);

CREATE INDEX IF NOT EXISTS idx_codigos_secuencia_tenant
    ON codigos_secuencia (tenant_id);
