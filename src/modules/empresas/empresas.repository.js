const { query } = require('../../config/database');

const findAll = async ({ limit, offset, order, direction, search, estado, plan }) => {
    const params = [];
    const conditions = [];
    let paramIdx = 1;

    if (search) {
        conditions.push(`(nombre ILIKE $${paramIdx} OR email ILIKE $${paramIdx} OR cuit ILIKE $${paramIdx})`);
        params.push(`%${search}%`);
        paramIdx++;
    }

    if (estado) {
        conditions.push(`estado = $${paramIdx}`);
        params.push(estado);
        paramIdx++;
    }

    if (plan) {
        conditions.push(`plan = $${paramIdx}`);
        params.push(plan);
        paramIdx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedOrder = ['nombre', 'email', 'estado', 'plan', 'created_at'];
    const safeOrder = allowedOrder.includes(order) ? order : 'created_at';
    const safeDir   = direction === 'ASC' ? 'ASC' : 'DESC';

    const [{ rows: total }, { rows: data }] = await Promise.all([
        query(`SELECT COUNT(*) AS total FROM empresas ${where}`, params),
        query(
            `SELECT id, nombre, cuit, email, telefono, direccion,
                    estado, plan, max_usuarios, max_activos, logo_url, created_at
             FROM empresas ${where}
             ORDER BY ${safeOrder} ${safeDir}
             LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
            [...params, limit, offset]
        ),
    ]);

    return { total: parseInt(total[0].total), rows: data };
};

const findById = async (id) => {
    const { rows } = await query(
        `SELECT id, nombre, cuit, email, telefono, direccion,
                estado, plan, max_usuarios, max_activos,
                logo_url, configuracion, created_at, updated_at
         FROM empresas WHERE id = $1`,
        [id]
    );
    return rows[0] || null;
};

const create = async ({ nombre, cuit, email, telefono, direccion, estado, plan }) => {
    const { rows } = await query(
        `INSERT INTO empresas (nombre, cuit, email, telefono, direccion, estado, plan)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [nombre, cuit || null, email, telefono || null, direccion || null,
         estado || 'prueba', plan || 'basico']
    );
    return rows[0];
};

const update = async (id, campos) => {
    const permitidos = ['nombre', 'cuit', 'email', 'telefono', 'direccion',
                        'estado', 'plan', 'max_usuarios', 'max_activos', 'logo_url', 'configuracion'];

    const sets = [];
    const params = [];
    let idx = 1;

    for (const [key, val] of Object.entries(campos)) {
        if (permitidos.includes(key) && val !== undefined) {
            sets.push(`${key} = $${idx}`);
            params.push(val);
            idx++;
        }
    }

    if (!sets.length) return findById(id);

    params.push(id);
    const { rows } = await query(
        `UPDATE empresas SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
        params
    );
    return rows[0] || null;
};

const softDelete = async (id) => {
    const { rows } = await query(
        `UPDATE empresas SET estado = 'inactivo' WHERE id = $1 RETURNING id`,
        [id]
    );
    return rows[0] || null;
};

const getEstadisticas = async (tenantId) => {
    const { rows } = await query(
        `SELECT
            (SELECT COUNT(*) FROM usuarios WHERE tenant_id = $1 AND activo = true)  AS usuarios_activos,
            (SELECT COUNT(*) FROM activos   WHERE tenant_id = $1 AND activo = true)  AS activos_totales,
            (SELECT COUNT(*) FROM activos   WHERE tenant_id = $1 AND activo = true
               AND estado_id = (SELECT id FROM estados WHERE nombre = 'En uso' AND es_global = true LIMIT 1)) AS activos_en_uso,
            (SELECT COUNT(*) FROM movimientos WHERE tenant_id = $1
               AND created_at >= NOW() - INTERVAL '30 days')  AS movimientos_mes`,
        [tenantId]
    );
    return rows[0];
};

module.exports = { findAll, findById, create, update, softDelete, getEstadisticas };
