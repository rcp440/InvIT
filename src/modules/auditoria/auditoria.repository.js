const { query } = require('../../config/database');

const findAll = async ({ tenantId, isSuperAdmin, accion, modulo, usuarioId, fechaDesde, fechaHasta, limit, offset }) => {
    const params = [];
    const conds  = [];
    let i = 1;

    // SuperAdmin sin tenant ve todo; con tenant filtra por tenant
    if (!isSuperAdmin) {
        conds.push(`a.tenant_id = $${i}`); params.push(tenantId); i++;
    } else if (tenantId) {
        conds.push(`a.tenant_id = $${i}`); params.push(tenantId); i++;
    }

    if (accion)     { conds.push(`a.accion = $${i}`);                params.push(accion);     i++; }
    if (modulo)     { conds.push(`a.modulo ILIKE $${i}`);            params.push(`%${modulo}%`); i++; }
    if (usuarioId)  { conds.push(`a.usuario_id = $${i}`);           params.push(usuarioId);  i++; }
    if (fechaDesde) { conds.push(`a.created_at >= $${i}`);           params.push(fechaDesde); i++; }
    if (fechaHasta) { conds.push(`a.created_at < $${i}::date + 1`); params.push(fechaHasta); i++; }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const [{ rows: t }, { rows: d }] = await Promise.all([
        query(`SELECT COUNT(*) AS total FROM auditoria a ${where}`, params),
        query(
            `SELECT a.id, a.accion, a.modulo, a.registro_id,
                    a.datos_anteriores, a.datos_nuevos,
                    a.ip, a.user_agent, a.created_at,
                    a.usuario_email,
                    u.nombre   AS usuario_nombre,
                    u.apellido AS usuario_apellido,
                    e.nombre   AS empresa_nombre
             FROM auditoria a
             LEFT JOIN usuarios u ON u.id = a.usuario_id
             LEFT JOIN empresas e ON e.id = a.tenant_id
             ${where}
             ORDER BY a.created_at DESC
             LIMIT $${i} OFFSET $${i + 1}`,
            [...params, limit, offset]
        ),
    ]);

    return { total: parseInt(t[0].total), rows: d };
};

module.exports = { findAll };
