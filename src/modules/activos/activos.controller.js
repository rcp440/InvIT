const service = require('./activos.service');
const { ok, created } = require('../../utils/response.helper');
const { registrarAuditoria, getClientIP } = require('../../utils/audit.helper');

const listar = async (req, res, next) => {
    try { res.json({ success: true, ...(await service.listar(req.tenantId, req.query)) }); }
    catch (err) { next(err); }
};

const obtener = async (req, res, next) => {
    try { ok(res, await service.obtener(req.params.id, req.tenantId)); }
    catch (err) { next(err); }
};

const crear = async (req, res, next) => {
    try {
        const activo = await service.crear(req.tenantId, req.body, req.user.id);
        await registrarAuditoria({
            tenantId: req.tenantId, usuarioId: req.user.id, usuarioEmail: req.user.email,
            accion: 'CREAR', modulo: 'activos', registroId: activo.id,
            datosNuevos: { codigo: activo.codigo, descripcion: activo.descripcion },
            ip: getClientIP(req),
        });
        created(res, activo, 'Activo creado exitosamente');
    } catch (err) { next(err); }
};

const actualizar = async (req, res, next) => {
    try {
        const anterior = await service.obtener(req.params.id, req.tenantId);
        const activo   = await service.actualizar(req.params.id, req.tenantId, req.body, req.user.id);
        await registrarAuditoria({
            tenantId: req.tenantId, usuarioId: req.user.id, usuarioEmail: req.user.email,
            accion: 'ACTUALIZAR', modulo: 'activos', registroId: req.params.id,
            datosAnteriores: { estado: anterior.estado_nombre, ubicacion: anterior.ubicacion_nombre },
            datosNuevos: { estado: activo.estado_id, ubicacion: activo.ubicacion_id },
            ip: getClientIP(req),
        });
        ok(res, activo, 'Activo actualizado');
    } catch (err) { next(err); }
};

const darDeBaja = async (req, res, next) => {
    try {
        const { motivo } = req.body;
        if (!motivo) return res.status(422).json({ success: false, message: 'Motivo de baja requerido' });

        const activo = await service.darDeBaja(req.params.id, req.tenantId, motivo, req.user.id);
        await registrarAuditoria({
            tenantId: req.tenantId, usuarioId: req.user.id, usuarioEmail: req.user.email,
            accion: 'ELIMINAR', modulo: 'activos', registroId: req.params.id,
            datosNuevos: { motivo }, ip: getClientIP(req),
        });
        ok(res, activo, 'Activo dado de baja');
    } catch (err) { next(err); }
};

const estadisticas = async (req, res, next) => {
    try { ok(res, await service.estadisticas(req.tenantId)); }
    catch (err) { next(err); }
};

module.exports = { listar, obtener, crear, actualizar, darDeBaja, estadisticas };
