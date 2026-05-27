const { Router } = require('express');
const { body }   = require('express-validator');
const ctrl       = require('./movimientos.controller');
const { authenticate }           = require('../../middleware/auth.middleware');
const { resolveTenant, requireTenant } = require('../../middleware/tenant.middleware');
const { checkPermiso }                 = require('../../middleware/roles.middleware');
const validate   = require('../../middleware/validate.middleware');

const router = Router();
router.use(authenticate, resolveTenant, requireTenant);

router.get('/', checkPermiso('movimientos', 'leer'), ctrl.listar);

router.post('/',
    checkPermiso('movimientos', 'crear'),
    [
        body('activoId').isUUID().withMessage('ID de activo inválido'),
        body('tipo')
            .isIn(['asignacion','traslado','baja','reingreso','reparacion','devolucion','actualizacion'])
            .withMessage('Tipo de movimiento inválido'),
        body('observaciones').optional().trim(),
        validate,
    ],
    ctrl.registrar
);

module.exports = router;
