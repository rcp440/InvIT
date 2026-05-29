const { Router } = require('express');
const { body }   = require('express-validator');
const ctrl       = require('./responsables.controller');
const { authenticate }           = require('../../middleware/auth.middleware');
const { resolveTenant, requireTenant } = require('../../middleware/tenant.middleware');
const { checkPermiso, onlyAdmins }     = require('../../middleware/roles.middleware');
const validate   = require('../../middleware/validate.middleware');

const router = Router();
router.use(authenticate, resolveTenant, requireTenant);

router.get('/',    checkPermiso('responsables', 'leer'), ctrl.listar);
router.get('/:id', checkPermiso('responsables', 'leer'), ctrl.obtener);
router.post('/', checkPermiso('responsables', 'crear'),
    [
        body('nombre').trim().notEmpty().isLength({ max: 100 }).withMessage('Nombre requerido (máx. 100 caracteres)'),
        body('apellido').trim().notEmpty().isLength({ max: 100 }).withMessage('Apellido requerido (máx. 100 caracteres)'),
        body('email').optional().isEmail().normalizeEmail().isLength({ max: 150 }),
        validate,
    ],
    ctrl.crear
);
router.put('/:id', checkPermiso('responsables', 'editar'),
    [body('nombre').optional().trim().notEmpty().isLength({ max: 100 }), body('apellido').optional().trim().notEmpty().isLength({ max: 100 }), validate],
    ctrl.actualizar
);
router.delete('/:id', onlyAdmins, ctrl.eliminar);

module.exports = router;
