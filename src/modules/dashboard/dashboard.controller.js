const repo = require('./dashboard.repository');
const { ok } = require('../../utils/response.helper');

const getDashboard = async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const meses    = Math.min(parseInt(req.query.meses) || 6, 24);

        const [resumen, porCategoria, porEstado, tendencia, ultimasAltas, ultimasBajas, ultimosMovimientos] =
            await Promise.all([
                repo.getResumen(tenantId),
                repo.getPorCategoria(tenantId),
                repo.getPorEstado(tenantId),
                repo.getTendencia(tenantId, meses),
                repo.getUltimasAltas(tenantId, 5),
                repo.getUltimasBajas(tenantId, 5),
                repo.getUltimosMovimientos(tenantId, 10),
            ]);

        ok(res, { resumen, porCategoria, porEstado, tendencia, ultimasAltas, ultimasBajas, ultimosMovimientos });
    } catch (err) {
        next(err);
    }
};

module.exports = { getDashboard };
