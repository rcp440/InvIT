-- ============================================================
-- MIGRACIÓN 008: TABLA ACTIVOS (tabla central del sistema)
-- ============================================================

CREATE TABLE IF NOT EXISTS activos (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo          VARCHAR(50) NOT NULL,
    descripcion     VARCHAR(300) NOT NULL,
    categoria_id    INTEGER REFERENCES categorias(id),
    marca           VARCHAR(100),
    modelo          VARCHAR(100),
    numero_serie    VARCHAR(150),
    fecha_compra    DATE,
    valor_compra    NUMERIC(12,2),
    estado_id       INTEGER REFERENCES estados(id),
    ubicacion_id    INTEGER REFERENCES ubicaciones(id),
    responsable_id  INTEGER REFERENCES responsables(id),
    observaciones   TEXT,
    foto_url        VARCHAR(500),
    activo          BOOLEAN NOT NULL DEFAULT true,
    baja_motivo     VARCHAR(300),
    baja_fecha      DATE,
    created_by      UUID REFERENCES usuarios(id),
    updated_by      UUID REFERENCES usuarios(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_activo_codigo_tenant UNIQUE (codigo, tenant_id)
);

CREATE INDEX idx_activos_tenant       ON activos(tenant_id);
CREATE INDEX idx_activos_categoria    ON activos(categoria_id);
CREATE INDEX idx_activos_estado       ON activos(estado_id);
CREATE INDEX idx_activos_ubicacion    ON activos(ubicacion_id);
CREATE INDEX idx_activos_responsable  ON activos(responsable_id);
CREATE INDEX idx_activos_codigo       ON activos(codigo);
CREATE INDEX idx_activos_activo       ON activos(activo);
CREATE INDEX idx_activos_fecha_compra ON activos(fecha_compra);

COMMENT ON TABLE activos IS 'Activos del inventario: PCs, notebooks, muebles, etc. Tabla central del sistema';
COMMENT ON COLUMN activos.codigo IS 'Código único del activo dentro del tenant (ej: PC-001, NB-023)';
