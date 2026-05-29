const { query } = require('../../config/database');

// Lista globales (tenant_id IS NULL) + propios del tenant
const findAll = async (tenantId) => {
    const { rows } = await query(
        `SELECT id, nombre, descripcion, color, icono, tenant_id, activo
         FROM estados
         WHERE activo = true AND (tenant_id IS NULL OR tenant_id = $1)
         ORDER BY tenant_id NULLS FIRST, nombre`,
        [tenantId]
    );
    return rows;
};

const findById = async (id, tenantId) => {
    const { rows } = await query(
        `SELECT * FROM estados
         WHERE id = $1 AND (tenant_id IS NULL OR tenant_id = $2)`,
        [id, tenantId]
    );
    return rows[0] || null;
};

const create = async ({ tenantId, nombre, descripcion, color, icono }) => {
    const { rows } = await query(
        `INSERT INTO estados (tenant_id, nombre, descripcion, color, icono)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [tenantId, nombre, descripcion || null, color || '#6c757d', icono || 'fa-circle']
    );
    return rows[0];
};

const update = async (id, tenantId, campos) => {
    const permitidos = ['nombre', 'descripcion', 'color', 'icono'];
    const sets = []; const params = []; let i = 1;
    for (const [k, v] of Object.entries(campos)) {
        if (permitidos.includes(k) && v !== undefined) { sets.push(`${k}=$${i}`); params.push(v); i++; }
    }
    if (!sets.length) return findById(id, tenantId);
    params.push(id, tenantId);
    const { rows } = await query(
        `UPDATE estados SET ${sets.join(',')} WHERE id=$${i} AND tenant_id=$${i+1} RETURNING *`,
        params
    );
    return rows[0] || null;
};

const remove = async (id, tenantId) => {
    // Solo se pueden eliminar estados propios del tenant (no globales)
    const { rows } = await query(
        `UPDATE estados SET activo=false WHERE id=$1 AND tenant_id=$2 RETURNING id`,
        [id, tenantId]
    );
    return rows[0] || null;
};

module.exports = { findAll, findById, create, update, remove };
