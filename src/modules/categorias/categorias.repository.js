const { query } = require('../../config/database');

const findAll = async ({ tenantId, limit, offset, order, direction, search, activo }) => {
    const params = [tenantId];
    const conds  = ['tenant_id = $1'];
    let i = 2;

    if (search) { conds.push(`nombre ILIKE $${i}`); params.push(`%${search}%`); i++; }
    if (activo !== undefined) { conds.push(`activo = $${i}`); params.push(activo); i++; }

    const where    = `WHERE ${conds.join(' AND ')}`;
    const safeOrd  = ['nombre', 'created_at'].includes(order) ? order : 'nombre';
    const safeDir  = direction === 'ASC' ? 'ASC' : 'DESC';

    const [{ rows: t }, { rows: d }] = await Promise.all([
        query(`SELECT COUNT(*) AS total FROM categorias ${where}`, params),
        query(`SELECT id, nombre, descripcion, icono, color, activo, created_at
               FROM categorias ${where} ORDER BY ${safeOrd} ${safeDir}
               LIMIT $${i} OFFSET $${i + 1}`, [...params, limit, offset]),
    ]);
    return { total: parseInt(t[0].total), rows: d };
};

const findById = async (id, tenantId) => {
    const { rows } = await query(
        'SELECT * FROM categorias WHERE id = $1 AND tenant_id = $2', [id, tenantId]
    );
    return rows[0] || null;
};

const create = async ({ tenantId, nombre, descripcion, icono, color }) => {
    const { rows } = await query(
        `INSERT INTO categorias (tenant_id, nombre, descripcion, icono, color)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [tenantId, nombre, descripcion || null, icono || 'fa-box', color || '#6c757d']
    );
    return rows[0];
};

const update = async (id, tenantId, campos) => {
    const permitidos = ['nombre', 'descripcion', 'icono', 'color', 'activo'];
    const sets = []; const params = []; let i = 1;
    for (const [k, v] of Object.entries(campos)) {
        if (permitidos.includes(k) && v !== undefined) { sets.push(`${k}=$${i}`); params.push(v); i++; }
    }
    if (!sets.length) return findById(id, tenantId);
    params.push(id, tenantId);
    const { rows } = await query(
        `UPDATE categorias SET ${sets.join(',')} WHERE id=$${i} AND tenant_id=$${i + 1} RETURNING *`, params
    );
    return rows[0] || null;
};

const remove = async (id, tenantId) => {
    const { rows } = await query(
        'UPDATE categorias SET activo=false WHERE id=$1 AND tenant_id=$2 RETURNING id', [id, tenantId]
    );
    return rows[0] || null;
};

module.exports = { findAll, findById, create, update, remove };
