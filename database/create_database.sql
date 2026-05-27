-- ============================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS
--
-- Ejecutar conectado a la base 'postgres' como superusuario.
--
-- pgAdmin:    abrir Query Tool sobre la base 'postgres' y ejecutar
-- psql:       psql -U postgres -f database/create_database.sql
-- DBeaver:    conectar a 'postgres' y ejecutar este script
--
-- Las extensiones uuid-ossp y pgcrypto se activan automáticamente
-- en la migración 001 al correr: npm run migrate:seed
-- ============================================================

CREATE DATABASE inventario_it
    WITH
    OWNER             = postgres
    ENCODING          = 'UTF8'
    TEMPLATE          = template0
    CONNECTION LIMIT  = -1;

COMMENT ON DATABASE inventario_it
    IS 'Sistema SaaS de inventario de muebles y equipamiento informático';
