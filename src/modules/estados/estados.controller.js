const repo = require('./estados.repository');
const { ok, created, notFound } = require('../../utils/response.helper');

const listar = async (req, res, next) => {
    try { ok(res, await repo.findAll(req.tenantId)); }
    catch (err) { next(err); }
};

const obtener = async (req, res, next) => {
    try {
        const estado = await repo.findById(req.params.id, req.tenantId);
        if (!estado) return notFound(res, 'Estado no encontrado');
        ok(res, estado);
    } catch (err) { next(err); }
};

const crear = async (req, res, next) => {
    try {
        const { nombre, descripcion, color, icono } = req.body;
        const estado = await repo.create({ tenantId: req.tenantId, nombre, descripcion, color, icono });
        created(res, estado, 'Estado creado');
    } catch (err) { next(err); }
};

const actualizar = async (req, res, next) => {
    try {
        const estado = await repo.update(req.params.id, req.tenantId, req.body);
        if (!estado) return notFound(res, 'Estado no encontrado o no pertenece a esta empresa');
        ok(res, estado, 'Estado actualizado');
    } catch (err) { next(err); }
};

const eliminar = async (req, res, next) => {
    try {
        const resultado = await repo.remove(req.params.id, req.tenantId);
        if (!resultado) return notFound(res, 'Estado no encontrado o no puede eliminarse (es global)');
        ok(res, null, 'Estado eliminado');
    } catch (err) { next(err); }
};

module.exports = { listar, obtener, crear, actualizar, eliminar };
