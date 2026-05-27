const service = require('./empresas.service');
const { ok, created, noContent, notFound } = require('../../utils/response.helper');
const { registrarAuditoria, getClientIP } = require('../../utils/audit.helper');

const listar = async (req, res, next) => {
    try {
        const resultado = await service.listar(req.query);
        res.json({ success: true, ...resultado });
    } catch (err) {
        next(err);
    }
};

const obtener = async (req, res, next) => {
    try {
        const empresa = await service.obtener(req.params.id);
        ok(res, empresa);
    } catch (err) {
        next(err);
    }
};

const crear = async (req, res, next) => {
    try {
        const {
            nombre, cuit, email, telefono, direccion, estado, plan,
            adminEmail, adminNombre, adminApellido, adminPassword,
        } = req.body;

        const empresa = await service.crear(
            { nombre, cuit, email, telefono, direccion, estado, plan },
            adminEmail, adminNombre, adminApellido, adminPassword
        );

        await registrarAuditoria({
            tenantId:    null,
            usuarioId:   req.user.id,
            usuarioEmail: req.user.email,
            accion:      'CREAR',
            modulo:      'empresas',
            registroId:  empresa.id,
            datosNuevos: { nombre: empresa.nombre, email: empresa.email },
            ip:          getClientIP(req),
        });

        created(res, empresa, 'Empresa creada exitosamente');
    } catch (err) {
        next(err);
    }
};

const actualizar = async (req, res, next) => {
    try {
        const empresaAnterior = await service.obtener(req.params.id);
        const empresa = await service.actualizar(req.params.id, req.body);

        await registrarAuditoria({
            tenantId:       req.tenantId,
            usuarioId:      req.user.id,
            usuarioEmail:   req.user.email,
            accion:         'ACTUALIZAR',
            modulo:         'empresas',
            registroId:     empresa.id,
            datosAnteriores: empresaAnterior,
            datosNuevos:    empresa,
            ip:             getClientIP(req),
        });

        ok(res, empresa, 'Empresa actualizada');
    } catch (err) {
        next(err);
    }
};

const eliminar = async (req, res, next) => {
    try {
        await service.eliminar(req.params.id);

        await registrarAuditoria({
            tenantId:    null,
            usuarioId:   req.user.id,
            usuarioEmail: req.user.email,
            accion:      'ELIMINAR',
            modulo:      'empresas',
            registroId:  req.params.id,
            ip:          getClientIP(req),
        });

        ok(res, null, 'Empresa desactivada');
    } catch (err) {
        next(err);
    }
};

const estadisticas = async (req, res, next) => {
    try {
        const tenantId = req.params.id || req.tenantId;
        const stats = await service.estadisticas(tenantId);
        ok(res, stats);
    } catch (err) {
        next(err);
    }
};

module.exports = { listar, obtener, crear, actualizar, eliminar, estadisticas };
