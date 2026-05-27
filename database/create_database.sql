-- ============================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS
-- Ejecutar conectado a la base 'postgres' como superusuario:
--   psql -U postgres -f database/create_database.sql
-- ============================================================

-- Crear base de datos
CREATE DATABASE inventario_it
    WITH
    OWNER      = postgres
    ENCODING   = 'UTF8'
    LC_COLLATE = 'es_ES.UTF-8'
    LC_CTYPE   = 'es_ES.UTF-8'
    TEMPLATE   = template0
    CONNECTION LIMIT = -1;

COMMENT ON DATABASE inventario_it IS 'Sistema SaaS de inventario de muebles y equipamiento informático';

-- Conectarse a la nueva base
\c inventario_it

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\echo '✓ Base de datos inventario_it creada correctamente.'
\echo '✓ Extensiones uuid-ossp y pgcrypto activadas.'
\echo ''
\echo 'Próximo paso: npm run migrate:seed'
