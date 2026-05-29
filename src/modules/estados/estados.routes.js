const { Router } = require('express');
const { body }   = require('express-validator');
const ctrl       = require('./estados.controller');
const { authenticate }                 = require('../../middleware/auth.middleware');
const { resolveTenant, requireTenant } = require('../../middleware/tenant.middleware');
const { checkPermiso, onlyAdmins }     = require('../../middleware/roles.middleware');
const validate                         = require('../../middleware/validate.middleware');

const router = Router();
router.use(authenticate, resolveTenant, requireTenant);

router.get('/',    checkPermiso('activos', 'leer'), ctrl.listar);
router.get('/:id', checkPermiso('activos', 'leer'), ctrl.obtener);

router.post('/', onlyAdmins,
    [
        body('nombre').trim().notEmpty().isLength({ max: 80 }).withMessage('Nombre requerido (máx. 80 caracteres)'),
        body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color debe ser hexadecimal (#RRGGBB)'),
        body('icono').optional().isLength({ max: 100 }),
        validate,
    ],
    ctrl.crear
);

router.put('/:id', onlyAdmins,
    [
        body('nombre').optional().trim().notEmpty().isLength({ max: 80 }),
        body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
        body('icono').optional().isLength({ max: 100 }),
        validate,
    ],
    ctrl.actualizar
);

router.delete('/:id', onlyAdmins, ctrl.eliminar);

module.exports = router;
