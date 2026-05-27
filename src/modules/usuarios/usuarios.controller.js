const service = require('./usuarios.service');
const { ok, created, notFound } = require('../../utils/response.helper');
const { registrarAuditoria, getClientIP } = require('../../utils/audit.helper');

const listar = async (req, res, next) => {
    try {
        const resultado = await service.listar(req.tenantId, req.query);
        res.json({ success: true, ...resultado });
    } catch (err) { next(err); }
};

const obtener = async (req, res, next) => {
    try {
        const usuario = await service.obtener(req.params.id, req.tenantId);
        ok(res, usuario);
    } catch (err) { next(err); }
};

const crear = async (req, res, next) => {
    try {
        const usuario = await service.crear(req.tenantId, req.body);

        await registrarAuditoria({
            tenantId: req.tenantId, usuarioId: req.user.id,
            usuarioEmail: req.user.email, accion: 'CREAR',
            modulo: 'usuarios', registroId: usuario.id,
            datosNuevos: { nombre: usuario.nombre, email: usuario.email },
            ip: getClientIP(req),
        });

        created(res, usuario, 'Usuario creado exitosamente');
    } catch (err) { next(err); }
};

const actualizar = async (req, res, next) => {
    try {
        const anterior = await service.obtener(req.params.id, req.tenantId);
        const usuario  = await service.actualizar(req.params.id, req.tenantId, req.body, req.user.rol_nombre);

        await registrarAuditoria({
            tenantId: req.tenantId, usuarioId: req.user.id,
            usuarioEmail: req.user.email, accion: 'ACTUALIZAR',
            modulo: 'usuarios', registroId: req.params.id,
            datosAnteriores: anterior, datosNuevos: usuario,
            ip: getClientIP(req),
        });

        ok(res, usuario, 'Usuario actualizado');
    } catch (err) { next(err); }
};

const cambiarPassword = async (req, res, next) => {
    try {
        await service.cambiarPassword(req.params.id, req.tenantId, req.body.passwordNueva);

        await registrarAuditoria({
            tenantId: req.tenantId, usuarioId: req.user.id,
            usuarioEmail: req.user.email, accion: 'CAMBIAR_PASSWORD',
            modulo: 'usuarios', registroId: req.params.id,
            ip: getClientIP(req),
        });

        ok(res, null, 'Password actualizada');
    } catch (err) { next(err); }
};

const eliminar = async (req, res, next) => {
    try {
        await service.eliminar(req.params.id, req.tenantId, req.user.id);

        await registrarAuditoria({
            tenantId: req.tenantId, usuarioId: req.user.id,
            usuarioEmail: req.user.email, accion: 'ELIMINAR',
            modulo: 'usuarios', registroId: req.params.id,
            ip: getClientIP(req),
        });

        ok(res, null, 'Usuario desactivado');
    } catch (err) { next(err); }
};

const listarRoles = async (req, res, next) => {
    try {
        const roles = await service.getRoles();
        ok(res, roles);
    } catch (err) { next(err); }
};

module.exports = { listar, obtener, crear, actualizar, cambiarPassword, eliminar, listarRoles };
