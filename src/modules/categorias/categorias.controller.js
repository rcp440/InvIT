const service = require('./categorias.service');
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
        const cat = await service.crear(req.tenantId, req.body);
        await registrarAuditoria({ tenantId: req.tenantId, usuarioId: req.user.id, usuarioEmail: req.user.email, accion: 'CREAR', modulo: 'categorias', registroId: cat.id, datosNuevos: cat, ip: getClientIP(req) });
        created(res, cat, 'Categoría creada');
    } catch (err) { next(err); }
};

const actualizar = async (req, res, next) => {
    try {
        const cat = await service.actualizar(req.params.id, req.tenantId, req.body);
        await registrarAuditoria({ tenantId: req.tenantId, usuarioId: req.user.id, usuarioEmail: req.user.email, accion: 'ACTUALIZAR', modulo: 'categorias', registroId: req.params.id, datosNuevos: cat, ip: getClientIP(req) });
        ok(res, cat, 'Categoría actualizada');
    } catch (err) { next(err); }
};

const eliminar = async (req, res, next) => {
    try {
        await service.eliminar(req.params.id, req.tenantId);
        await registrarAuditoria({ tenantId: req.tenantId, usuarioId: req.user.id, usuarioEmail: req.user.email, accion: 'ELIMINAR', modulo: 'categorias', registroId: req.params.id, ip: getClientIP(req) });
        ok(res, null, 'Categoría desactivada');
    } catch (err) { next(err); }
};

module.exports = { listar, obtener, crear, actualizar, eliminar };
