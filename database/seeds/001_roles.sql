-- ============================================================
-- SEED 001: ROLES DEL SISTEMA
-- ============================================================

INSERT INTO roles (nombre, descripcion, permisos, es_sistema) VALUES
(
    'superadmin',
    'Administrador global del SaaS. Acceso total al sistema.',
    '{
        "empresas":     {"crear": true, "leer": true, "editar": true, "eliminar": true},
        "usuarios":     {"crear": true, "leer": true, "editar": true, "eliminar": true},
        "activos":      {"crear": true, "leer": true, "editar": true, "eliminar": true},
        "categorias":   {"crear": true, "leer": true, "editar": true, "eliminar": true},
        "ubicaciones":  {"crear": true, "leer": true, "editar": true, "eliminar": true},
        "responsables": {"crear": true, "leer": true, "editar": true, "eliminar": true},
        "movimientos":  {"crear": true, "leer": true, "editar": true, "eliminar": true},
        "reportes":     {"crear": true, "leer": true, "exportar": true},
        "auditoria":    {"leer": true}
    }'::jsonb,
    true
),
(
    'admin_empresa',
    'Administrador de empresa. Gestiona todos los recursos de su tenant.',
    '{
        "empresas":     {"crear": false, "leer": true,  "editar": true,  "eliminar": false},
        "usuarios":     {"crear": true,  "leer": true,  "editar": true,  "eliminar": true},
        "activos":      {"crear": true,  "leer": true,  "editar": true,  "eliminar": true},
        "categorias":   {"crear": true,  "leer": true,  "editar": true,  "eliminar": true},
        "ubicaciones":  {"crear": true,  "leer": true,  "editar": true,  "eliminar": true},
        "responsables": {"crear": true,  "leer": true,  "editar": true,  "eliminar": true},
        "movimientos":  {"crear": true,  "leer": true,  "editar": false, "eliminar": false},
        "reportes":     {"crear": false, "leer": true,  "exportar": true},
        "auditoria":    {"leer": true}
    }'::jsonb,
    true
),
(
    'operador',
    'Operador. Puede consultar y registrar movimientos pero no eliminar.',
    '{
        "empresas":     {"crear": false, "leer": false, "editar": false, "eliminar": false},
        "usuarios":     {"crear": false, "leer": false, "editar": false, "eliminar": false},
        "activos":      {"crear": true,  "leer": true,  "editar": true,  "eliminar": false},
        "categorias":   {"crear": false, "leer": true,  "editar": false, "eliminar": false},
        "ubicaciones":  {"crear": false, "leer": true,  "editar": false, "eliminar": false},
        "responsables": {"crear": false, "leer": true,  "editar": false, "eliminar": false},
        "movimientos":  {"crear": true,  "leer": true,  "editar": false, "eliminar": false},
        "reportes":     {"crear": false, "leer": true,  "exportar": false},
        "auditoria":    {"leer": false}
    }'::jsonb,
    true
)
ON CONFLICT (nombre) DO NOTHING;
