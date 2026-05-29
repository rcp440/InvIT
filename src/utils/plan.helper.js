const { query } = require('../config/database');

/**
 * Verifica que el tenant no haya alcanzado su límite de activos.
 * Lanza 403 si el límite está alcanzado.
 */
const checkLimiteActivos = async (tenantId) => {
    const { rows } = await query(
        `SELECT e.max_activos,
                COUNT(a.id) FILTER (WHERE a.activo = true) AS total_activos
         FROM empresas e
         LEFT JOIN activos a ON a.tenant_id = e.id
         WHERE e.id = $1
         GROUP BY e.max_activos`,
        [tenantId]
    );
    if (!rows.length) return;

    const { max_activos, total_activos } = rows[0];
    if (parseInt(total_activos) >= parseInt(max_activos)) {
        throw Object.assign(
            new Error(`Límite de activos alcanzado (${max_activos}). Actualice su plan.`),
            { status: 403 }
        );
    }
};

/**
 * Verifica que el tenant no haya alcanzado su límite de usuarios.
 * Lanza 403 si el límite está alcanzado.
 */
const checkLimiteUsuarios = async (tenantId) => {
    const { rows } = await query(
        `SELECT e.max_usuarios,
                COUNT(u.id) FILTER (WHERE u.activo = true) AS total_usuarios
         FROM empresas e
         LEFT JOIN usuarios u ON u.tenant_id = e.id
         WHERE e.id = $1
         GROUP BY e.max_usuarios`,
        [tenantId]
    );
    if (!rows.length) return;

    const { max_usuarios, total_usuarios } = rows[0];
    if (parseInt(total_usuarios) >= parseInt(max_usuarios)) {
        throw Object.assign(
            new Error(`Límite de usuarios alcanzado (${max_usuarios}). Actualice su plan.`),
            { status: 403 }
        );
    }
};

module.exports = { checkLimiteActivos, checkLimiteUsuarios };
