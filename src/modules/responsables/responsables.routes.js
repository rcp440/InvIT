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
        body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
        body('apellido').trim().notEmpty().withMessage('Apellido requerido'),
        body('email').optional().isEmail().normalizeEmail(),
        validate,
    ],
    ctrl.crear
);
router.put('/:id', checkPermiso('responsables', 'editar'),
    [body('nombre').optional().trim().notEmpty(), body('apellido').optional().trim().notEmpty(), validate],
    ctrl.actualizar
);
router.delete('/:id', onlyAdmins, ctrl.eliminar);

module.exports = router;
