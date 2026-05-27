const service = require('./ubicaciones.service');
const { ok, created } = require('../../utils/response.helper');
const { registrarAuditoria, getClientIP } = require('../../utils/audit.helper');

const listar = async (req, res, next) => {
    try { const r = await service.listar(req.tenantId, req.query); res.json({ success: true, ...r }); }
    catch (err) { next(err); }
};
const obtener = async (req, res, next) => {
    try { ok(res, await service.obtener(req.params.id, req.tenantId)); }
    catch (err) { next(err); }
};
const crear = async (req, res, next) => {
    try {
        const u = await service.crear(req.tenantId, req.body);
        await registrarAuditoria({ tenantId: req.tenantId, usuarioId: req.user.id, usuarioEmail: req.user.email, accion: 'CREAR', modulo: 'ubicaciones', registroId: u.id, datosNuevos: u, ip: getClientIP(req) });
        created(res, u, 'Ubicación creada');
    } catch (err) { next(err); }
};
const actualizar = async (req, res, next) => {
    try {
        const u = await service.actualizar(req.params.id, req.tenantId, req.body);
        await registrarAuditoria({ tenantId: req.tenantId, usuarioId: req.user.id, usuarioEmail: req.user.email, accion: 'ACTUALIZAR', modulo: 'ubicaciones', registroId: req.params.id, datosNuevos: u, ip: getClientIP(req) });
        ok(res, u, 'Ubicación actualizada');
    } catch (err) { next(err); }
};
const eliminar = async (req, res, next) => {
    try {
        await service.eliminar(req.params.id, req.tenantId);
        await registrarAuditoria({ tenantId: req.tenantId, usuarioId: req.user.id, usuarioEmail: req.user.email, accion: 'ELIMINAR', modulo: 'ubicaciones', registroId: req.params.id, ip: getClientIP(req) });
        ok(res, null, 'Ubicación desactivada');
    } catch (err) { next(err); }
};

module.exports = { listar, obtener, crear, actualizar, eliminar };
