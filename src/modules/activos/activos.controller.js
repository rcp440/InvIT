const service = require('./activos.service');
const { importarDesdeCSV, plantillaCSV } = require('./activos.import');
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

const importar = async (req, res, next) => {
    try {
        if (!req.file) return res.status(422).json({ success: false, message: 'Archivo CSV requerido' });

        const resultado = await importarDesdeCSV(req.file.buffer, req.tenantId, req.user.id);

        await registrarAuditoria({
            tenantId: req.tenantId, usuarioId: req.user.id, usuarioEmail: req.user.email,
            accion: 'IMPORTAR', modulo: 'activos',
            datosNuevos: { creados: resultado.creados, errores: resultado.errores.length },
            ip: getClientIP(req),
        });

        const status = resultado.errores.length && !resultado.creados ? 422 : 200;
        res.status(status).json({ success: status === 200, ...resultado });
    } catch (err) { next(err); }
};

const plantilla = (req, res) => {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="plantilla_activos.csv"');
    res.send(plantillaCSV());
};

module.exports = { listar, obtener, crear, actualizar, darDeBaja, estadisticas, importar, plantilla };
