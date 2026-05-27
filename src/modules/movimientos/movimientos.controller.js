const service = require('./movimientos.service');
const { ok, created } = require('../../utils/response.helper');
const { registrarAuditoria, getClientIP } = require('../../utils/audit.helper');

const listar = async (req, res, next) => {
    try { res.json({ success: true, ...(await service.listar(req.tenantId, req.query)) }); }
    catch (err) { next(err); }
};

const registrar = async (req, res, next) => {
    try {
        const mov = await service.registrar(req.tenantId, req.body, req.user.id);
        await registrarAuditoria({
            tenantId: req.tenantId, usuarioId: req.user.id, usuarioEmail: req.user.email,
            accion: 'CREAR', modulo: 'movimientos', registroId: mov.id,
            datosNuevos: { tipo: mov.tipo, activoId: mov.activo_id },
            ip: getClientIP(req),
        });
        created(res, mov, 'Movimiento registrado');
    } catch (err) { next(err); }
};

module.exports = { listar, registrar };
