-- ============================================================
-- MIGRACIÓN 009: TABLA MOVIMIENTOS (historial de cambios)
-- ============================================================

CREATE TYPE movimiento_tipo AS ENUM (
    'asignacion',
    'traslado',
    'baja',
    'reingreso',
    'reparacion',
    'devolucion',
    'actualizacion'
);

CREATE TABLE IF NOT EXISTS movimientos (
    id                      SERIAL PRIMARY KEY,
    tenant_id               UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    activo_id               UUID NOT NULL REFERENCES activos(id) ON DELETE CASCADE,
    tipo                    movimiento_tipo NOT NULL,
    ubicacion_origen_id     INTEGER REFERENCES ubicaciones(id),
    ubicacion_destino_id    INTEGER REFERENCES ubicaciones(id),
    responsable_origen_id   INTEGER REFERENCES responsables(id),
    responsable_destino_id  INTEGER REFERENCES responsables(id),
    estado_anterior_id      INTEGER REFERENCES estados(id),
    estado_nuevo_id         INTEGER REFERENCES estados(id),
    observaciones           TEXT,
    usuario_id              UUID NOT NULL REFERENCES usuarios(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_movimientos_tenant  ON movimientos(tenant_id);
CREATE INDEX idx_movimientos_activo  ON movimientos(activo_id);
CREATE INDEX idx_movimientos_tipo    ON movimientos(tipo);
CREATE INDEX idx_movimientos_usuario ON movimientos(usuario_id);
CREATE INDEX idx_movimientos_fecha   ON movimientos(created_at);

COMMENT ON TABLE movimientos IS 'Historial completo de todos los movimientos y cambios de activos';
