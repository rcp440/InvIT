const repo    = require('./activos.repository');
const movsRepo = require('../movimientos/movimientos.repository');
const { parsePagination, buildMeta } = require('../../utils/pagination.helper');

const listar = async (tenantId, q) => {
    const { page, limit, offset, order, direction } = parsePagination(q);
    const activo = q.activo !== undefined ? q.activo === 'true' : true; // por defecto solo activos
    const { total, rows } = await repo.findAll({
        tenantId, limit, offset, order, direction,
        search:        q.search        || null,
        categoriaId:   q.categoriaId   || null,
        estadoId:      q.estadoId      || null,
        ubicacionId:   q.ubicacionId   || null,
        responsableId: q.responsableId || null,
        activo,
    });
    return { data: rows, meta: buildMeta(total, page, limit) };
};

const obtener = async (id, tenantId) => {
    const activo = await repo.findById(id, tenantId);
    if (!activo) throw Object.assign(new Error('Activo no encontrado'), { status: 404 });
    return activo;
};

const crear = async (tenantId, datos, usuarioId) => {
    // Generar código automático si no se provee
    if (!datos.codigo) {
        const prefijo = datos.prefijoCategoria || 'ACT';
        datos.codigo  = await repo.generarCodigo(tenantId, prefijo);
    }

    const activo = await repo.create({ tenantId, ...mapearCampos(datos) }, usuarioId);

    // Registrar movimiento inicial de creación
    await movsRepo.create({
        tenantId,
        activoId:            activo.id,
        tipo:                'asignacion',
        ubicacionDestinoId:  datos.ubicacionId  || null,
        responsableDestinoId: datos.responsableId || null,
        estadoNuevoId:       datos.estadoId      || null,
        observaciones:       'Alta inicial del activo',
        usuarioId,
    });

    return activo;
};

const actualizar = async (id, tenantId, datos, usuarioId) => {
    const anterior = await obtener(id, tenantId);

    const activo = await repo.update(id, tenantId, mapearCampos(datos), usuarioId);

    // Si cambió ubicación, responsable o estado → registrar movimiento
    const cambioRelevante =
        (datos.ubicacionId  && datos.ubicacionId  !== String(anterior.ubicacion_id))  ||
        (datos.responsableId && datos.responsableId !== String(anterior.responsable_id)) ||
        (datos.estadoId     && datos.estadoId     !== String(anterior.estado_id));

    if (cambioRelevante) {
        await movsRepo.create({
            tenantId,
            activoId:              id,
            tipo:                  'actualizacion',
            ubicacionOrigenId:     anterior.ubicacion_id   || null,
            ubicacionDestinoId:    datos.ubicacionId       || anterior.ubicacion_id   || null,
            responsableOrigenId:   anterior.responsable_id || null,
            responsableDestinoId:  datos.responsableId     || anterior.responsable_id || null,
            estadoAnteriorId:      anterior.estado_id      || null,
            estadoNuevoId:         datos.estadoId          || anterior.estado_id      || null,
            observaciones:         datos.observacionesMovimiento || 'Actualización de activo',
            usuarioId,
        });
    }

    return activo;
};

const darDeBaja = async (id, tenantId, motivo, usuarioId) => {
    const anterior = await obtener(id, tenantId);
    const activo   = await repo.darDeBaja(id, tenantId, motivo, usuarioId);

    await movsRepo.create({
        tenantId, activoId: id, tipo: 'baja',
        ubicacionOrigenId:   anterior.ubicacion_id   || null,
        responsableOrigenId: anterior.responsable_id || null,
        estadoAnteriorId:    anterior.estado_id      || null,
        observaciones:       motivo,
        usuarioId,
    });

    return activo;
};

const estadisticas = async (tenantId) => repo.getEstadisticasTenant(tenantId);

// Convierte camelCase del request a snake_case para el repositorio
const mapearCampos = (d) => ({
    codigo:        d.codigo,
    descripcion:   d.descripcion,
    categoriaId:   d.categoriaId   || d.categoria_id,
    marca:         d.marca,
    modelo:        d.modelo,
    numeroSerie:   d.numeroSerie   || d.numero_serie,
    fechaCompra:   d.fechaCompra   || d.fecha_compra,
    valorCompra:   d.valorCompra   || d.valor_compra,
    estadoId:      d.estadoId      || d.estado_id,
    ubicacionId:   d.ubicacionId   || d.ubicacion_id,
    responsableId: d.responsableId || d.responsable_id,
    observaciones: d.observaciones,
    fotoUrl:       d.fotoUrl       || d.foto_url,
    activo:        d.activo,
});

module.exports = { listar, obtener, crear, actualizar, darDeBaja, estadisticas };
