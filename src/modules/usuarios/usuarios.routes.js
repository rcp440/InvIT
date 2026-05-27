const { Router } = require('express');
const { body }   = require('express-validator');
const controller = require('./usuarios.controller');
const { authenticate }           = require('../../middleware/auth.middleware');
const { resolveTenant, requireTenant } = require('../../middleware/tenant.middleware');
const { onlyAdmins, checkPermiso }     = require('../../middleware/roles.middleware');
const validate   = require('../../middleware/validate.middleware');

const router = Router();

router.use(authenticate, resolveTenant, requireTenant);

// GET /api/usuarios/roles
router.get('/roles', onlyAdmins, controller.listarRoles);

// GET /api/usuarios
router.get('/', checkPermiso('usuarios', 'leer'), controller.listar);

// GET /api/usuarios/:id
router.get('/:id', checkPermiso('usuarios', 'leer'), controller.obtener);

// POST /api/usuarios
router.post('/',
    onlyAdmins,
    [
        body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
        body('apellido').trim().notEmpty().withMessage('Apellido requerido'),
        body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
        body('password')
            .isLength({ min: 8 })
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password: mínimo 8 caracteres, mayúsculas, minúsculas y números'),
        body('rolNombre')
            .isIn(['admin_empresa', 'operador'])
            .withMessage('Rol inválido. Use: admin_empresa u operador'),
        validate,
    ],
    controller.crear
);

// PUT /api/usuarios/:id
router.put('/:id',
    onlyAdmins,
    [
        body('nombre').optional().trim().notEmpty(),
        body('apellido').optional().trim().notEmpty(),
        body('email').optional().isEmail().normalizeEmail(),
        body('activo').optional().isBoolean(),
        validate,
    ],
    controller.actualizar
);

// PATCH /api/usuarios/:id/password
router.patch('/:id/password',
    onlyAdmins,
    [
        body('passwordNueva')
            .isLength({ min: 8 })
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password: mínimo 8 caracteres, mayúsculas, minúsculas y números'),
        validate,
    ],
    controller.cambiarPassword
);

// DELETE /api/usuarios/:id
router.delete('/:id', onlyAdmins, controller.eliminar);

module.exports = router;
