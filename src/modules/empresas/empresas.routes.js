const { Router } = require('express');
const { body }   = require('express-validator');
const controller = require('./empresas.controller');
const { authenticate }  = require('../../middleware/auth.middleware');
const { resolveTenant } = require('../../middleware/tenant.middleware');
const { onlySuperAdmin, onlyAdmins } = require('../../middleware/roles.middleware');
const validate   = require('../../middleware/validate.middleware');

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/empresas  — solo superadmin
router.get('/', onlySuperAdmin, controller.listar);

// GET /api/empresas/:id
router.get('/:id', onlyAdmins, controller.obtener);

// GET /api/empresas/:id/estadisticas
router.get('/:id/estadisticas', authenticate, resolveTenant, controller.estadisticas);

// POST /api/empresas  — solo superadmin, crea empresa + primer admin
router.post('/',
    onlySuperAdmin,
    [
        body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
        body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
        body('adminEmail').isEmail().normalizeEmail().withMessage('Email del administrador inválido'),
        body('adminNombre').trim().notEmpty().withMessage('Nombre del administrador requerido'),
        body('adminApellido').trim().notEmpty().withMessage('Apellido del administrador requerido'),
        body('adminPassword')
            .isLength({ min: 8 })
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password del admin: mínimo 8 caracteres, mayúsculas, minúsculas y números'),
        validate,
    ],
    controller.crear
);

// PUT /api/empresas/:id
router.put('/:id',
    onlyAdmins,
    [
        body('nombre').optional().trim().notEmpty().withMessage('Nombre no puede estar vacío'),
        body('email').optional().isEmail().normalizeEmail(),
        validate,
    ],
    controller.actualizar
);

// DELETE /api/empresas/:id  — solo superadmin (soft delete)
router.delete('/:id', onlySuperAdmin, controller.eliminar);

module.exports = router;
