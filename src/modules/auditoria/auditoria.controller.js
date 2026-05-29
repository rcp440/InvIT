const repo = require('./auditoria.repository');
const { parsePagination, buildMeta } = require('../../utils/pagination.helper');
const { ok } = require('../../utils/response.helper');

const listar = async (req, res, next) => {
    try {
        const { page, limit, offset } = parsePagination(req.query);
        const { accion, modulo, usuarioId, fechaDesde, fechaHasta } = req.query;

        const { total, rows } = await repo.findAll({
            tenantId:    req.tenantId,
            isSuperAdmin: req.isSuperAdmin,
            accion:      accion      || null,
            modulo:      modulo      || null,
            usuarioId:   usuarioId   || null,
            fechaDesde:  fechaDesde  || null,
            fechaHasta:  fechaHasta  || null,
            limit,
            offset,
        });

        return ok(res, { data: rows, meta: buildMeta(total, page, limit) });
    } catch (err) {
        next(err);
    }
};

module.exports = { listar };
