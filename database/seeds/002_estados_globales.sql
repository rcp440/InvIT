-- ============================================================
-- SEED 002: ESTADOS GLOBALES DEL SISTEMA
-- ============================================================

INSERT INTO estados (tenant_id, nombre, descripcion, color, icono, es_global) VALUES
(NULL, 'En uso',         'El activo está asignado y en uso',           '#28a745', 'fa-check-circle',    true),
(NULL, 'En depósito',    'El activo está disponible en depósito',      '#17a2b8', 'fa-warehouse',       true),
(NULL, 'En reparación',  'El activo está en proceso de reparación',    '#ffc107', 'fa-tools',           true),
(NULL, 'Dado de baja',   'El activo fue dado de baja definitivamente',  '#dc3545', 'fa-times-circle',    true),
(NULL, 'Prestado',       'El activo está prestado temporalmente',       '#fd7e14', 'fa-hand-holding',    true),
(NULL, 'En tránsito',    'El activo está siendo trasladado',            '#6f42c1', 'fa-truck',           true)
ON CONFLICT (nombre, tenant_id) DO NOTHING;
