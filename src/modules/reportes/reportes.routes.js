const { Router } = require('express');
const { query }  = require('express-validator');
const ctrl       = require('./reportes.controller');
const { authenticate }                 = require('../../middleware/auth.middleware');
const { resolveTenant, requireTenant } = require('../../middleware/tenant.middleware');
const { checkPermiso }                 = require('../../middleware/roles.middleware');
const validate                         = require('../../middleware/validate.middleware');

const router = Router();
router.use(authenticate, resolveTenant, requireTenant);

const formatoValidator = query('formato').optional().isIn(['xlsx', 'csv']).withMessage('Formato inválido. Use xlsx o csv');
const fechaValidator   = (field) => query(field).optional().isISO8601().withMessage(`${field} debe ser YYYY-MM-DD`);

// GET /api/reportes/activos
router.get('/activos',
    checkPermiso('activos', 'leer'),
    [
        formatoValidator,
        query('incluirBajas').optional().isBoolean(),
        fechaValidator('fechaDesde'),
        fechaValidator('fechaHasta'),
        validate,
    ],
    ctrl.activos
);

// GET /api/reportes/movimientos
router.get('/movimientos',
    checkPermiso('movimientos', 'leer'),
    [
        formatoValidator,
        query('tipo').optional().isIn(['asignacion','traslado','baja','reingreso','reparacion','devolucion','actualizacion']),
        fechaValidator('fechaDesde'),
        fechaValidator('fechaHasta'),
        validate,
    ],
    ctrl.movimientos
);

// GET /api/reportes/valoracion
router.get('/valoracion',
    checkPermiso('activos', 'leer'),
    [formatoValidator, validate],
    ctrl.valoracion
);

module.exports = router;
