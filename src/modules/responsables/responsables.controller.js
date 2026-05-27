const service = require('./responsables.service');
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
        const r = await service.crear(req.tenantId, req.body);
        await registrarAuditoria({ tenantId: req.tenantId, usuarioId: req.user.id, usuarioEmail: req.user.email, accion: 'CREAR', modulo: 'responsables', registroId: r.id, datosNuevos: r, ip: getClientIP(req) });
        created(res, r, 'Responsable creado');
    } catch (err) { next(err); }
};
const actualizar = async (req, res, next) => {
    try {
        const r = await service.actualizar(req.params.id, req.tenantId, req.body);
        await registrarAuditoria({ tenantId: req.tenantId, usuarioId: req.user.id, usuarioEmail: req.user.email, accion: 'ACTUALIZAR', modulo: 'responsables', registroId: req.params.id, datosNuevos: r, ip: getClientIP(req) });
        ok(res, r, 'Responsable actualizado');
    } catch (err) { next(err); }
};
const eliminar = async (req, res, next) => {
    try {
        await service.eliminar(req.params.id, req.tenantId);
        await registrarAuditoria({ tenantId: req.tenantId, usuarioId: req.user.id, usuarioEmail: req.user.email, accion: 'ELIMINAR', modulo: 'responsables', registroId: req.params.id, ip: getClientIP(req) });
        ok(res, null, 'Responsable desactivado');
    } catch (err) { next(err); }
};

module.exports = { listar, obtener, crear, actualizar, eliminar };
