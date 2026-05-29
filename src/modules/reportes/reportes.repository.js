const { query } = require('../../config/database');

const getActivos = async ({ tenantId, categoriaId, estadoId, ubicacionId, responsableId, incluirBajas, fechaDesde, fechaHasta }) => {
    const params = [tenantId];
    const conds  = ['a.tenant_id = $1'];
    let i = 2;

    if (!incluirBajas) { conds.push(`a.activo = true`); }
    if (categoriaId)   { conds.push(`a.categoria_id = $${i}`);   params.push(categoriaId);   i++; }
    if (estadoId)      { conds.push(`a.estado_id = $${i}`);       params.push(estadoId);       i++; }
    if (ubicacionId)   { conds.push(`a.ubicacion_id = $${i}`);   params.push(ubicacionId);   i++; }
    if (responsableId) { conds.push(`a.responsable_id = $${i}`); params.push(responsableId); i++; }
    if (fechaDesde)    { conds.push(`a.fecha_compra >= $${i}`);   params.push(fechaDesde);    i++; }
    if (fechaHasta)    { conds.push(`a.fecha_compra <= $${i}`);   params.push(fechaHasta);    i++; }

    const { rows } = await query(
        `SELECT
            a.codigo,
            a.descripcion,
            a.marca,
            a.modelo,
            a.numero_serie,
            a.fecha_compra,
            a.valor_compra,
            a.observaciones,
            a.activo,
            a.baja_fecha,
            a.baja_motivo,
            a.created_at,
            c.nombre  AS categoria,
            e.nombre  AS estado,
            e.color   AS estado_color,
            u.nombre  AS ubicacion,
            u.piso    AS ubicacion_piso,
            u.sector  AS ubicacion_sector,
            r.nombre  AS responsable_nombre,
            r.apellido AS responsable_apellido,
            r.email   AS responsable_email
         FROM activos a
         LEFT JOIN categorias   c ON c.id = a.categoria_id
         LEFT JOIN estados      e ON e.id = a.estado_id
         LEFT JOIN ubicaciones  u ON u.id = a.ubicacion_id
         LEFT JOIN responsables r ON r.id = a.responsable_id
         WHERE ${conds.join(' AND ')}
         ORDER BY a.codigo ASC`,
        params
    );
    return rows;
};

const getMovimientos = async ({ tenantId, activoId, tipo, fechaDesde, fechaHasta }) => {
    const params = [tenantId];
    const conds  = ['m.tenant_id = $1'];
    let i = 2;

    if (activoId)   { conds.push(`m.activo_id = $${i}`);         params.push(activoId);   i++; }
    if (tipo)       { conds.push(`m.tipo = $${i}`);              params.push(tipo);        i++; }
    if (fechaDesde) { conds.push(`m.created_at >= $${i}`);       params.push(fechaDesde); i++; }
    if (fechaHasta) { conds.push(`m.created_at < $${i}::date + 1`); params.push(fechaHasta); i++; }

    const { rows } = await query(
        `SELECT
            m.created_at  AS fecha,
            m.tipo,
            a.codigo      AS activo_codigo,
            a.descripcion AS activo_descripcion,
            uo.nombre     AS ubicacion_origen,
            ud.nombre     AS ubicacion_destino,
            ro.nombre     AS resp_origen_nombre,
            ro.apellido   AS resp_origen_apellido,
            rd.nombre     AS resp_destino_nombre,
            rd.apellido   AS resp_destino_apellido,
            ea.nombre     AS estado_anterior,
            en2.nombre    AS estado_nuevo,
            u.nombre      AS usuario_nombre,
            u.apellido    AS usuario_apellido,
            m.observaciones
         FROM movimientos m
         JOIN activos      a   ON a.id   = m.activo_id
         LEFT JOIN ubicaciones  uo  ON uo.id  = m.ubicacion_origen_id
         LEFT JOIN ubicaciones  ud  ON ud.id  = m.ubicacion_destino_id
         LEFT JOIN responsables ro  ON ro.id  = m.responsable_origen_id
         LEFT JOIN responsables rd  ON rd.id  = m.responsable_destino_id
         LEFT JOIN estados      ea  ON ea.id  = m.estado_anterior_id
         LEFT JOIN estados      en2 ON en2.id = m.estado_nuevo_id
         JOIN usuarios           u  ON u.id   = m.usuario_id
         WHERE ${conds.join(' AND ')}
         ORDER BY m.created_at DESC`,
        params
    );
    return rows;
};

const getValoracion = async (tenantId) => {
    const { rows } = await query(
        `SELECT
            COALESCE(c.nombre, 'Sin categoría') AS categoria,
            COUNT(*)                             AS cantidad,
            COUNT(*) FILTER (WHERE a.activo = true)  AS activos,
            COUNT(*) FILTER (WHERE a.activo = false) AS dados_de_baja,
            COALESCE(SUM(a.valor_compra) FILTER (WHERE a.activo = true), 0)  AS valor_activos,
            COALESCE(SUM(a.valor_compra), 0)                                  AS valor_total
         FROM activos a
         LEFT JOIN categorias c ON c.id = a.categoria_id
         WHERE a.tenant_id = $1
         GROUP BY c.nombre
         ORDER BY valor_activos DESC`,
        [tenantId]
    );
    return rows;
};

module.exports = { getActivos, getMovimientos, getValoracion };
