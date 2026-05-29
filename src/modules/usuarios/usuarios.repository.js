const { query } = require('../../config/database');

const findAll = async ({ tenantId, limit, offset, order, direction, search, activo }) => {
    const params = [tenantId];
    const conditions = ['u.tenant_id = $1'];
    let paramIdx = 2;

    if (search) {
        conditions.push(`(u.nombre ILIKE $${paramIdx} OR u.apellido ILIKE $${paramIdx} OR u.email ILIKE $${paramIdx})`);
        params.push(`%${search}%`);
        paramIdx++;
    }

    if (activo !== undefined) {
        conditions.push(`u.activo = $${paramIdx}`);
        params.push(activo);
        paramIdx++;
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const allowedOrder = ['nombre', 'apellido', 'email', 'created_at', 'ultimo_acceso'];
    const safeOrder = allowedOrder.includes(order) ? `u.${order}` : 'u.created_at';
    const safeDir   = direction === 'ASC' ? 'ASC' : 'DESC';

    const [{ rows: total }, { rows: data }] = await Promise.all([
        query(`SELECT COUNT(*) AS total FROM usuarios u ${where}`, params),
        query(
            `SELECT u.id, u.nombre, u.apellido, u.email, u.activo,
                    u.ultimo_acceso, u.created_at, r.nombre AS rol_nombre
             FROM usuarios u
             JOIN roles r ON r.id = u.rol_id
             ${where}
             ORDER BY ${safeOrder} ${safeDir}
             LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
            [...params, limit, offset]
        ),
    ]);

    return { total: parseInt(total[0].total), rows: data };
};

const findById = async (id, tenantId = null) => {
    const params = [id];
    let tenantFilter = '';

    if (tenantId) {
        tenantFilter = ' AND u.tenant_id = $2';
        params.push(tenantId);
    }

    const { rows } = await query(
        `SELECT u.id, u.tenant_id, u.nombre, u.apellido, u.email,
                u.activo, u.ultimo_acceso, u.avatar_url, u.created_at, u.updated_at,
                r.id AS rol_id, r.nombre AS rol_nombre, r.permisos
         FROM usuarios u
         JOIN roles r ON r.id = u.rol_id
         WHERE u.id = $1 ${tenantFilter}`,
        params
    );
    return rows[0] || null;
};

const create = async ({ tenantId, nombre, apellido, email, passwordHash, rolId }) => {
    const { rows } = await query(
        `INSERT INTO usuarios (tenant_id, nombre, apellido, email, password_hash, rol_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, tenant_id, nombre, apellido, email, activo, created_at`,
        [tenantId, nombre, apellido, email, passwordHash, rolId]
    );
    return rows[0];
};

const update = async (id, tenantId, campos) => {
    const permitidos = ['nombre', 'apellido', 'email', 'rol_id', 'activo', 'avatar_url'];
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

    if (!sets.length) return findById(id, tenantId);

    params.push(id);
    let sql = `UPDATE usuarios SET ${sets.join(', ')} WHERE id = $${idx}`;

    if (tenantId) {
        sql += ` AND tenant_id = $${idx + 1}`;
        params.push(tenantId);
    }

    const { rows } = await query(sql + ' RETURNING id, nombre, apellido, email, activo', params);
    return rows[0] || null;
};

const softDelete = async (id, tenantId) => {
    const params = [id];
    let tenantFilter = '';
    if (tenantId) {
        tenantFilter = ' AND tenant_id = $2';
        params.push(tenantId);
    }
    const { rows } = await query(
        `UPDATE usuarios SET activo = false, deleted_at = NOW() WHERE id = $1 ${tenantFilter} RETURNING id`,
        params
    );
    return rows[0] || null;
};

module.exports = { findAll, findById, create, update, softDelete };
