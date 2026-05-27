-- ============================================================
-- MIGRACIÓN 010: TABLA AUDITORÍA
-- ============================================================

CREATE TYPE auditoria_accion AS ENUM (
    'LOGIN', 'LOGOUT', 'LOGIN_FALLIDO',
    'CREAR', 'ACTUALIZAR', 'ELIMINAR', 'RESTAURAR',
    'CAMBIAR_PASSWORD', 'RESET_PASSWORD',
    'EXPORTAR', 'IMPORTAR'
);

CREATE TABLE IF NOT EXISTS auditoria (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       UUID REFERENCES empresas(id) ON DELETE SET NULL,
    usuario_id      UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    usuario_email   VARCHAR(150),
    accion          auditoria_accion NOT NULL,
    modulo          VARCHAR(80),
    registro_id     VARCHAR(100),
    datos_anteriores JSONB,
    datos_nuevos    JSONB,
    ip              VARCHAR(45),
    user_agent      VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auditoria_tenant   ON auditoria(tenant_id);
CREATE INDEX idx_auditoria_usuario  ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_accion   ON auditoria(accion);
CREATE INDEX idx_auditoria_modulo   ON auditoria(modulo);
CREATE INDEX idx_auditoria_fecha    ON auditoria(created_at);

COMMENT ON TABLE auditoria IS 'Registro de auditoría de todas las acciones del sistema';
