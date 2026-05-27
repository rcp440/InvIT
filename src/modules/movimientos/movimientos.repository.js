const { query } = require('../../config/database');

const findAll = async ({ tenantId, activoId, tipo, limit, offset }) => {
    const params = [tenantId]; const conds = ['m.tenant_id = $1']; let i = 2;
    if (activoId) { conds.push(`m.activo_id = $${i}`); params.push(activoId); i++; }
    if (tipo)     { conds.push(`m.tipo = $${i}`);      params.push(tipo);     i++; }
    const where = `WHERE ${conds.join(' AND ')}`;

    const [{ rows: t }, { rows: d }] = await Promise.all([
        query(`SELECT COUNT(*) AS total FROM movimientos m ${where}`, params),
        query(
            `SELECT m.id, m.tipo, m.observaciones, m.created_at,
                    a.codigo  AS activo_codigo,   a.descripcion AS activo_descripcion,
                    uo.nombre AS ubic_origen,     ud.nombre AS ubic_destino,
                    ro.nombre AS resp_origen,     ro.apellido AS resp_origen_apellido,
                    rd.nombre AS resp_destino,    rd.apellido AS resp_destino_apellido,
                    ea.nombre AS estado_anterior, en2.nombre AS estado_nuevo,
                    u.nombre  AS usuario_nombre,  u.apellido AS usuario_apellido
             FROM movimientos m
             JOIN activos     a   ON a.id  = m.activo_id
             LEFT JOIN ubicaciones  uo  ON uo.id = m.ubicacion_origen_id
             LEFT JOIN ubicaciones  ud  ON ud.id = m.ubicacion_destino_id
             LEFT JOIN responsables ro  ON ro.id = m.responsable_origen_id
             LEFT JOIN responsables rd  ON rd.id = m.responsable_destino_id
             LEFT JOIN estados      ea  ON ea.id = m.estado_anterior_id
             LEFT JOIN estados      en2 ON en2.id = m.estado_nuevo_id
             JOIN usuarios          u   ON u.id  = m.usuario_id
             ${where}
             ORDER BY m.created_at DESC
             LIMIT $${i} OFFSET $${i + 1}`,
            [...params, limit, offset]
        ),
    ]);
    return { total: parseInt(t[0].total), rows: d };
};

const create = async ({
    tenantId, activoId, tipo,
    ubicacionOrigenId, ubicacionDestinoId,
    responsableOrigenId, responsableDestinoId,
    estadoAnteriorId, estadoNuevoId,
    observaciones, usuarioId,
}) => {
    const { rows } = await query(
        `INSERT INTO movimientos
         (tenant_id, activo_id, tipo,
          ubicacion_origen_id, ubicacion_destino_id,
          responsable_origen_id, responsable_destino_id,
          estado_anterior_id, estado_nuevo_id,
          observaciones, usuario_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING *`,
        [
            tenantId, activoId, tipo,
            ubicacionOrigenId    || null, ubicacionDestinoId    || null,
            responsableOrigenId  || null, responsableDestinoId  || null,
            estadoAnteriorId     || null, estadoNuevoId         || null,
            observaciones        || null, usuarioId,
        ]
    );
    return rows[0];
};

module.exports = { findAll, create };
