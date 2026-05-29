const { Router } = require('express');
const { body }   = require('express-validator');
const ctrl       = require('./ubicaciones.controller');
const { authenticate }           = require('../../middleware/auth.middleware');
const { resolveTenant, requireTenant } = require('../../middleware/tenant.middleware');
const { checkPermiso, onlyAdmins }     = require('../../middleware/roles.middleware');
const validate   = require('../../middleware/validate.middleware');

const router = Router();
router.use(authenticate, resolveTenant, requireTenant);

router.get('/',    checkPermiso('ubicaciones', 'leer'), ctrl.listar);
router.get('/:id', checkPermiso('ubicaciones', 'leer'), ctrl.obtener);
router.post('/', onlyAdmins,
    [body('nombre').trim().notEmpty().isLength({ max: 150 }).withMessage('Nombre requerido (máx. 150 caracteres)'), validate],
    ctrl.crear
);
router.put('/:id', onlyAdmins,
    [body('nombre').optional().trim().notEmpty().isLength({ max: 150 }), validate],
    ctrl.actualizar
);
router.delete('/:id', onlyAdmins, ctrl.eliminar);

module.exports = router;
