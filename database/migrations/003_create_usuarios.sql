-- ============================================================
-- MIGRACIÓN 003: TABLA USUARIOS
-- ============================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID REFERENCES empresas(id) ON DELETE CASCADE,
    nombre          VARCHAR(100) NOT NULL,
    apellido        VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    rol_id          INTEGER NOT NULL REFERENCES roles(id),
    activo          BOOLEAN NOT NULL DEFAULT true,
    ultimo_acceso   TIMESTAMPTZ,
    intentos_fallidos INTEGER NOT NULL DEFAULT 0,
    bloqueado_hasta TIMESTAMPTZ,
    token_reset     VARCHAR(255),
    token_reset_exp TIMESTAMPTZ,
    avatar_url      VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- email único por tenant (o global para superadmin donde tenant_id es NULL)
    CONSTRAINT uq_usuario_email_tenant UNIQUE (email, tenant_id)
);

CREATE INDEX idx_usuarios_tenant    ON usuarios(tenant_id);
CREATE INDEX idx_usuarios_email     ON usuarios(email);
CREATE INDEX idx_usuarios_rol       ON usuarios(rol_id);
CREATE INDEX idx_usuarios_activo    ON usuarios(activo);

COMMENT ON TABLE usuarios IS 'Usuarios del sistema. tenant_id=NULL indica SuperAdmin global';
COMMENT ON COLUMN usuarios.intentos_fallidos IS 'Contador de intentos fallidos de login para bloqueo temporal';
