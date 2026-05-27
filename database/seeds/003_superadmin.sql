-- ============================================================
-- SEED 003: USUARIO SUPERADMIN INICIAL
-- Cambiar el password INMEDIATAMENTE después del primer login
-- Password por defecto: Admin@1234
-- Hash bcrypt rounds=12 generado offline
-- ============================================================

INSERT INTO usuarios (
    id,
    tenant_id,
    nombre,
    apellido,
    email,
    password_hash,
    rol_id,
    activo
)
SELECT
    uuid_generate_v4(),
    NULL,
    'Super',
    'Admin',
    'superadmin@inventarioit.com',
    -- bcrypt hash de 'Admin@1234' con 12 rounds - CAMBIAR EN PRODUCCIÓN
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewEFv5WaE5VX6.Oe',
    r.id,
    true
FROM roles r
WHERE r.nombre = 'superadmin'
ON CONFLICT DO NOTHING;

COMMENT ON TABLE usuarios IS 'superadmin inicial: email=superadmin@inventarioit.com, password=Admin@1234 (cambiar en producción)';
