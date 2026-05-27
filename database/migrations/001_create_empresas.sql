-- ============================================================
-- MIGRACIÓN 001: TABLA EMPRESAS (Tenants)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE empresa_estado AS ENUM ('activo', 'inactivo', 'suspendido', 'prueba');
CREATE TYPE empresa_plan AS ENUM ('basico', 'profesional', 'enterprise');

CREATE TABLE IF NOT EXISTS empresas (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre      VARCHAR(200) NOT NULL,
    cuit        VARCHAR(20) UNIQUE,
    email       VARCHAR(150) NOT NULL UNIQUE,
    telefono    VARCHAR(30),
    direccion   TEXT,
    estado      empresa_estado NOT NULL DEFAULT 'prueba',
    plan        empresa_plan NOT NULL DEFAULT 'basico',
    max_usuarios INTEGER NOT NULL DEFAULT 5,
    max_activos  INTEGER NOT NULL DEFAULT 500,
    logo_url    VARCHAR(500),
    configuracion JSONB DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_empresas_estado ON empresas(estado);
CREATE INDEX idx_empresas_email  ON empresas(email);

COMMENT ON TABLE empresas IS 'Tabla de tenants del sistema SaaS';
COMMENT ON COLUMN empresas.configuracion IS 'Configuraciones personalizadas del tenant en formato JSON';
