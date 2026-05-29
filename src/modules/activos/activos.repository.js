const { query, getClient } = require('../../config/database');

const findAll = async ({ tenantId, limit, offset, order, direction, search, categoriaId, estadoId, ubicacionId, responsableId, activo }) => {
    const params = [tenantId]; const conds = ['a.tenant_id = $1']; let i = 2;

    if (search) {
        conds.push(`(a.codigo ILIKE $${i} OR a.descripcion ILIKE $${i} OR a.marca ILIKE $${i} OR a.modelo ILIKE $${i} OR a.numero_serie ILIKE $${i})`);
        params.push(`%${search}%`); i++;
    }
    if (categoriaId) { conds.push(`a.categoria_id = $${i}`); params.push(categoriaId); i++; }
    if (estadoId)    { conds.push(`a.estado_id = $${i}`);    params.push(estadoId);    i++; }
    if (ubicacionId) { conds.push(`a.ubicacion_id = $${i}`); params.push(ubicacionId); i++; }
    if (responsableId) { conds.push(`a.responsable_id = $${i}`); params.push(responsableId); i++; }
    if (activo !== undefined) { conds.push(`a.activo = $${i}`); params.push(activo); i++; }

    const where   = `WHERE ${conds.join(' AND ')}`;
    const allowed = ['codigo', 'descripcion', 'marca', 'modelo', 'fecha_compra', 'created_at'];
    const safeOrd = allowed.includes(order) ? `a.${order}` : 'a.created_at';
    const safeDir = direction === 'ASC' ? 'ASC' : 'DESC';

    const [{ rows: t }, { rows: d }] = await Promise.all([
        query(`SELECT COUNT(*) AS total FROM activos a ${where}`, params),
        query(
            `SELECT a.id, a.codigo, a.descripcion, a.marca, a.modelo, a.numero_serie,
                    a.fecha_compra, a.valor_compra, a.observaciones, a.foto_url, a.activo,
                    a.created_at, a.updated_at,
                    c.nombre  AS categoria_nombre,  c.icono AS categoria_icono,
                    e.nombre  AS estado_nombre,      e.color AS estado_color,
                    u.nombre  AS ubicacion_nombre,
                    r.nombre  AS responsable_nombre, r.apellido AS responsable_apellido
             FROM activos a
             LEFT JOIN categorias  c ON c.id = a.categoria_id
             LEFT JOIN estados     e ON e.id = a.estado_id
             LEFT JOIN ubicaciones u ON u.id = a.ubicacion_id
             LEFT JOIN responsables r ON r.id = a.responsable_id
             ${where}
             ORDER BY ${safeOrd} ${safeDir}
             LIMIT $${i} OFFSET $${i + 1}`,
            [...params, limit, offset]
        ),
    ]);
    return { total: parseInt(t[0].total), rows: d };
};

const findById = async (id, tenantId) => {
    const { rows } = await query(
        `SELECT a.*,
                c.nombre  AS categoria_nombre,  c.icono  AS categoria_icono,
                e.nombre  AS estado_nombre,      e.color  AS estado_color,
                u.nombre  AS ubicacion_nombre,   u.piso   AS ubicacion_piso,   u.sector AS ubicacion_sector,
                r.nombre  AS responsable_nombre, r.apellido AS responsable_apellido,
                r.email   AS responsable_email,  r.departamento AS responsable_depto
         FROM activos a
         LEFT JOIN categorias  c ON c.id = a.categoria_id
         LEFT JOIN estados     e ON e.id = a.estado_id
         LEFT JOIN ubicaciones u ON u.id = a.ubicacion_id
         LEFT JOIN responsables r ON r.id = a.responsable_id
         WHERE a.id = $1 AND a.tenant_id = $2`,
        [id, tenantId]
    );
    return rows[0] || null;
};

const generarCodigo = async (tenantId, prefijo) => {
    // Upsert atómico: evita race condition del COUNT(*)+1 bajo concurrencia.
    // Si dos requests llegan simultáneamente, uno espera el lock de fila y obtiene n+2.
    const { rows } = await query(
        `INSERT INTO codigos_secuencia (tenant_id, prefijo, ultimo)
         VALUES ($1, $2, 1)
         ON CONFLICT (tenant_id, prefijo)
         DO UPDATE SET ultimo = codigos_secuencia.ultimo + 1
         RETURNING ultimo`,
        [tenantId, prefijo]
    );
    return `${prefijo}-${String(rows[0].ultimo).padStart(4, '0')}`;
};

const create = async (datos, usuarioId) => {
    const {
        tenantId, codigo, descripcion, categoriaId, marca, modelo,
        numeroSerie, fechaCompra, valorCompra, estadoId,
        ubicacionId, responsableId, observaciones, fotoUrl,
    } = datos;

    const { rows } = await query(
        `INSERT INTO activos
         (tenant_id, codigo, descripcion, categoria_id, marca, modelo,
          numero_serie, fecha_compra, valor_compra, estado_id,
          ubicacion_id, responsable_id, observaciones, foto_url, created_by, updated_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$15)
         RETURNING *`,
        [tenantId, codigo, descripcion, categoriaId || null, marca || null, modelo || null,
         numeroSerie || null, fechaCompra || null, valorCompra || null, estadoId || null,
         ubicacionId || null, responsableId || null, observaciones || null, fotoUrl || null, usuarioId]
    );
    return rows[0];
};

const update = async (id, tenantId, campos, usuarioId) => {
    const permitidos = ['codigo', 'descripcion', 'categoria_id', 'marca', 'modelo',
                        'numero_serie', 'fecha_compra', 'valor_compra', 'estado_id',
                        'ubicacion_id', 'responsable_id', 'observaciones', 'foto_url', 'activo'];
    const sets = []; const params = []; let i = 1;
    for (const [k, v] of Object.entries(campos)) {
        if (permitidos.includes(k) && v !== undefined) { sets.push(`${k}=$${i}`); params.push(v); i++; }
    }
    sets.push(`updated_by=$${i}`); params.push(usuarioId); i++;
    params.push(id, tenantId);
    const { rows } = await query(
        `UPDATE activos SET ${sets.join(',')} WHERE id=$${i} AND tenant_id=$${i + 1} RETURNING *`, params
    );
    return rows[0] || null;
};

const darDeBaja = async (id, tenantId, motivo, usuarioId) => {
    const { rows } = await query(
        `UPDATE activos SET activo=false, baja_motivo=$1, baja_fecha=CURRENT_DATE, updated_by=$2
         WHERE id=$3 AND tenant_id=$4 RETURNING *`,
        [motivo, usuarioId, id, tenantId]
    );
    return rows[0] || null;
};

const getEstadisticasTenant = async (tenantId) => {
    const { rows } = await query(
        `SELECT
            COUNT(*)                                    AS total,
            COUNT(*) FILTER (WHERE a.activo = true)      AS activos,
            COUNT(*) FILTER (WHERE a.activo = false)    AS dados_de_baja,
            COUNT(*) FILTER (WHERE e.nombre = 'En uso') AS en_uso,
            COUNT(*) FILTER (WHERE e.nombre = 'En depósito') AS en_deposito,
            COUNT(*) FILTER (WHERE e.nombre = 'En reparación') AS en_reparacion,
            COALESCE(SUM(valor_compra), 0)              AS valor_total
         FROM activos a
         LEFT JOIN estados e ON e.id = a.estado_id
         WHERE a.tenant_id = $1`,
        [tenantId]
    );
    return rows[0];
};

module.exports = { findAll, findById, generarCodigo, create, update, darDeBaja, getEstadisticasTenant };
