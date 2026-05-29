const { query } = require('../../config/database');

const getResumen = async (tenantId) => {
    const { rows } = await query(
        `SELECT
            COUNT(*)                                          AS total,
            COUNT(*) FILTER (WHERE a.activo = true)           AS activos,
            COUNT(*) FILTER (WHERE a.activo = false)          AS dados_de_baja,
            COUNT(*) FILTER (WHERE e.nombre = 'En uso')       AS en_uso,
            COUNT(*) FILTER (WHERE e.nombre = 'En depósito')  AS en_deposito,
            COUNT(*) FILTER (WHERE e.nombre = 'En reparación')AS en_reparacion,
            COALESCE(SUM(a.valor_compra) FILTER (WHERE a.activo = true), 0) AS valor_total
         FROM activos a
         LEFT JOIN estados e ON e.id = a.estado_id
         WHERE a.tenant_id = $1`,
        [tenantId]
    );
    return rows[0];
};

const getPorCategoria = async (tenantId) => {
    const { rows } = await query(
        `SELECT COALESCE(c.nombre, 'Sin categoría') AS nombre,
                c.icono, c.color,
                COUNT(*) FILTER (WHERE a.activo = true)  AS cantidad,
                COALESCE(SUM(a.valor_compra) FILTER (WHERE a.activo = true), 0) AS valor
         FROM activos a
         LEFT JOIN categorias c ON c.id = a.categoria_id
         WHERE a.tenant_id = $1
         GROUP BY c.nombre, c.icono, c.color
         ORDER BY cantidad DESC`,
        [tenantId]
    );
    return rows;
};

const getPorEstado = async (tenantId) => {
    const { rows } = await query(
        `SELECT COALESCE(e.nombre, 'Sin estado') AS nombre,
                e.color,
                COUNT(*) AS cantidad
         FROM activos a
         LEFT JOIN estados e ON e.id = a.estado_id
         WHERE a.tenant_id = $1 AND a.activo = true
         GROUP BY e.nombre, e.color
         ORDER BY cantidad DESC`,
        [tenantId]
    );
    return rows;
};

// Altas y bajas agrupadas por mes (últimos N meses)
const getTendencia = async (tenantId, meses = 6) => {
    const { rows } = await query(
        `SELECT
            TO_CHAR(DATE_TRUNC('month', fecha), 'YYYY-MM') AS mes,
            SUM(altas)  AS altas,
            SUM(bajas)  AS bajas
         FROM (
             -- Altas
             SELECT DATE_TRUNC('month', created_at) AS fecha, 1 AS altas, 0 AS bajas
             FROM activos
             WHERE tenant_id = $1
               AND created_at >= NOW() - ($2 || ' months')::INTERVAL
             UNION ALL
             -- Bajas
             SELECT DATE_TRUNC('month', baja_fecha::timestamptz) AS fecha, 0 AS altas, 1 AS bajas
             FROM activos
             WHERE tenant_id = $1
               AND activo = false
               AND baja_fecha IS NOT NULL
               AND baja_fecha >= (NOW() - ($2 || ' months')::INTERVAL)::date
         ) t
         GROUP BY DATE_TRUNC('month', fecha)
         ORDER BY DATE_TRUNC('month', fecha)`,
        [tenantId, meses]
    );
    return rows;
};

const getUltimasAltas = async (tenantId, limite = 5) => {
    const { rows } = await query(
        `SELECT a.codigo, a.descripcion, a.created_at,
                c.nombre AS categoria, e.nombre AS estado, e.color AS estado_color
         FROM activos a
         LEFT JOIN categorias c ON c.id = a.categoria_id
         LEFT JOIN estados    e ON e.id = a.estado_id
         WHERE a.tenant_id = $1 AND a.activo = true
         ORDER BY a.created_at DESC
         LIMIT $2`,
        [tenantId, limite]
    );
    return rows;
};

const getUltimasBajas = async (tenantId, limite = 5) => {
    const { rows } = await query(
        `SELECT a.codigo, a.descripcion, a.baja_fecha, a.baja_motivo,
                c.nombre AS categoria
         FROM activos a
         LEFT JOIN categorias c ON c.id = a.categoria_id
         WHERE a.tenant_id = $1 AND a.activo = false
         ORDER BY a.baja_fecha DESC NULLS LAST, a.updated_at DESC
         LIMIT $2`,
        [tenantId, limite]
    );
    return rows;
};

const getUltimosMovimientos = async (tenantId, limite = 10) => {
    const { rows } = await query(
        `SELECT m.tipo, m.created_at,
                a.codigo AS activo_codigo, a.descripcion AS activo_descripcion,
                u.nombre AS usuario_nombre, u.apellido AS usuario_apellido
         FROM movimientos m
         JOIN activos  a ON a.id = m.activo_id
         JOIN usuarios u ON u.id = m.usuario_id
         WHERE m.tenant_id = $1
         ORDER BY m.created_at DESC
         LIMIT $2`,
        [tenantId, limite]
    );
    return rows;
};

module.exports = {
    getResumen, getPorCategoria, getPorEstado,
    getTendencia, getUltimasAltas, getUltimasBajas, getUltimosMovimientos,
};
