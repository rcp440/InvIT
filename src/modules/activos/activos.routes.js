const { Router } = require('express');
const { body }   = require('express-validator');
const ctrl       = require('./activos.controller');
const { authenticate }           = require('../../middleware/auth.middleware');
const { resolveTenant, requireTenant } = require('../../middleware/tenant.middleware');
const { checkPermiso, onlyAdmins }     = require('../../middleware/roles.middleware');
const validate   = require('../../middleware/validate.middleware');

const router = Router();
router.use(authenticate, resolveTenant, requireTenant);

// GET /api/activos/estadisticas
router.get('/estadisticas', checkPermiso('activos', 'leer'), ctrl.estadisticas);

// GET /api/activos
router.get('/', checkPermiso('activos', 'leer'), ctrl.listar);

// GET /api/activos/:id
router.get('/:id', checkPermiso('activos', 'leer'), ctrl.obtener);

// POST /api/activos
router.post('/',
    checkPermiso('activos', 'crear'),
    [
        body('descripcion').trim().notEmpty().withMessage('Descripción requerida'),
        body('categoriaId').optional().isInt({ min: 1 }),
        body('fechaCompra').optional().isISO8601().withMessage('Fecha inválida (use YYYY-MM-DD)'),
        body('valorCompra').optional().isFloat({ min: 0 }),
        validate,
    ],
    ctrl.crear
);

// PUT /api/activos/:id
router.put('/:id',
    checkPermiso('activos', 'editar'),
    [
        body('descripcion').optional().trim().notEmpty(),
        body('fechaCompra').optional().isISO8601(),
        body('valorCompra').optional().isFloat({ min: 0 }),
        validate,
    ],
    ctrl.actualizar
);

// PATCH /api/activos/:id/baja
router.patch('/:id/baja',
    onlyAdmins,
    [body('motivo').trim().notEmpty().withMessage('Motivo de baja requerido'), validate],
    ctrl.darDeBaja
);

module.exports = router;
