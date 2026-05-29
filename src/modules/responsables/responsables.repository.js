const { query } = require('../../config/database');

const findAll = async ({ tenantId, limit, offset, order, direction, search, activo }) => {
    const params = [tenantId]; const conds = ['tenant_id = $1']; let i = 2;
    if (search) {
        conds.push(`(nombre ILIKE $${i} OR apellido ILIKE $${i} OR email ILIKE $${i} OR departamento ILIKE $${i})`);
        params.push(`%${search}%`); i++;
    }
    if (activo !== undefined) { conds.push(`activo = $${i}`); params.push(activo); i++; }
    const where   = `WHERE ${conds.join(' AND ')}`;
    const safeOrd = ['nombre', 'apellido', 'departamento', 'created_at'].includes(order) ? order : 'apellido';
    const safeDir = direction === 'ASC' ? 'ASC' : 'DESC';
    const [{ rows: t }, { rows: d }] = await Promise.all([
        query(`SELECT COUNT(*) AS total FROM responsables ${where}`, params),
        query(`SELECT id, nombre, apellido, email, telefono, departamento, cargo, activo, created_at
               FROM responsables ${where} ORDER BY ${safeOrd} ${safeDir}
               LIMIT $${i} OFFSET $${i + 1}`, [...params, limit, offset]),
    ]);
    return { total: parseInt(t[0].total), rows: d };
};

const findById = async (id, tenantId) => {
    const { rows } = await query('SELECT * FROM responsables WHERE id=$1 AND tenant_id=$2', [id, tenantId]);
    return rows[0] || null;
};

const create = async ({ tenantId, nombre, apellido, email, telefono, departamento, cargo }) => {
    const { rows } = await query(
        `INSERT INTO responsables (tenant_id, nombre, apellido, email, telefono, departamento, cargo)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [tenantId, nombre, apellido, email || null, telefono || null, departamento || null, cargo || null]
    );
    return rows[0];
};

const update = async (id, tenantId, campos) => {
    const permitidos = ['nombre', 'apellido', 'email', 'telefono', 'departamento', 'cargo', 'activo'];
    const sets = []; const params = []; let i = 1;
    for (const [k, v] of Object.entries(campos)) {
        if (permitidos.includes(k) && v !== undefined) { sets.push(`${k}=$${i}`); params.push(v); i++; }
    }
    if (!sets.length) return findById(id, tenantId);
    params.push(id, tenantId);
    const { rows } = await query(
        `UPDATE responsables SET ${sets.join(',')} WHERE id=$${i} AND tenant_id=$${i + 1} RETURNING *`, params
    );
    return rows[0] || null;
};

const remove = async (id, tenantId) => {
    const { rows } = await query(
        'UPDATE responsables SET activo=false, deleted_at=NOW() WHERE id=$1 AND tenant_id=$2 RETURNING id', [id, tenantId]
    );
    return rows[0] || null;
};

module.exports = { findAll, findById, create, update, remove };
