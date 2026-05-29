-- Índices faltantes en movimientos, auditoria y activos.
-- Sin estos, las queries de historial y auditoría hacen full table scan.

-- ── movimientos ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_movimientos_tenant_id
    ON movimientos (tenant_id);

CREATE INDEX IF NOT EXISTS idx_movimientos_activo_id
    ON movimientos (activo_id);

CREATE INDEX IF NOT EXISTS idx_movimientos_tenant_fecha
    ON movimientos (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_movimientos_tipo
    ON movimientos (tenant_id, tipo);

-- ── auditoria ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_auditoria_tenant_fecha
    ON auditoria (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_id
    ON auditoria (usuario_id);

CREATE INDEX IF NOT EXISTS idx_auditoria_modulo_accion
    ON auditoria (tenant_id, modulo, accion);

-- ── activos: reemplazar índice booleano de baja cardinalidad ────────
DROP INDEX IF EXISTS idx_activos_activo;

CREATE INDEX IF NOT EXISTS idx_activos_activos_vigentes
    ON activos (tenant_id, created_at DESC)
    WHERE activo = true;

-- ── activos: compuesto para generarCodigo y búsquedas por código ───
CREATE INDEX IF NOT EXISTS idx_activos_tenant_codigo
    ON activos (tenant_id, codigo);

-- ── usuarios: índice para búsqueda por email con tenant ────────────
CREATE INDEX IF NOT EXISTS idx_usuarios_tenant_email
    ON usuarios (tenant_id, email);
