const repo       = require('./movimientos.repository');
const activosRepo = require('../activos/activos.repository');
const { parsePagination, buildMeta } = require('../../utils/pagination.helper');

const listar = async (tenantId, q) => {
    const { page, limit, offset } = parsePagination(q);
    const { total, rows } = await repo.findAll({
        tenantId,
        activoId: q.activoId || null,
        tipo:     q.tipo     || null,
        limit, offset,
    });
    return { data: rows, meta: buildMeta(total, page, limit) };
};

const registrar = async (tenantId, datos, usuarioId) => {
    const {
        activoId, tipo, ubicacionDestinoId, responsableDestinoId,
        estadoNuevoId, observaciones,
    } = datos;

    // Verificar que el activo pertenece al tenant
    const activo = await activosRepo.findById(activoId, tenantId);
    if (!activo) throw Object.assign(new Error('Activo no encontrado'), { status: 404 });
    if (!activo.activo) throw Object.assign(new Error('El activo está dado de baja'), { status: 400 });

    const movimiento = await repo.create({
        tenantId, activoId, tipo,
        ubicacionOrigenId:    activo.ubicacion_id   || null,
        ubicacionDestinoId:   ubicacionDestinoId    || null,
        responsableOrigenId:  activo.responsable_id || null,
        responsableDestinoId: responsableDestinoId  || null,
        estadoAnteriorId:     activo.estado_id      || null,
        estadoNuevoId:        estadoNuevoId         || null,
        observaciones,
        usuarioId,
    });

    // Actualizar el activo con los nuevos valores
    const camposActualizar = {};
    if (ubicacionDestinoId)  camposActualizar.ubicacion_id   = ubicacionDestinoId;
    if (responsableDestinoId) camposActualizar.responsable_id = responsableDestinoId;
    if (estadoNuevoId)        camposActualizar.estado_id      = estadoNuevoId;

    if (Object.keys(camposActualizar).length) {
        await activosRepo.update(activoId, tenantId, camposActualizar, usuarioId);
    }

    return movimiento;
};

module.exports = { listar, registrar };
