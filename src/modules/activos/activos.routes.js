const { Router } = require('express');
const { body }   = require('express-validator');
const multer     = require('multer');
const ctrl       = require('./activos.controller');
const { authenticate }           = require('../../middleware/auth.middleware');
const { resolveTenant, requireTenant } = require('../../middleware/tenant.middleware');
const { checkPermiso, onlyAdmins }     = require('../../middleware/roles.middleware');
const validate   = require('../../middleware/validate.middleware');

const upload = multer({
    storage: multer.memoryStorage(),
    limits:  { fileSize: 2 * 1024 * 1024 }, // 2 MB máximo
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) cb(null, true);
        else cb(Object.assign(new Error('Solo se aceptan archivos CSV'), { status: 422 }));
    },
});

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
        body('descripcion').trim().notEmpty().isLength({ max: 300 }).withMessage('Descripción requerida (máx. 300 caracteres)'),
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
        body('descripcion').optional().trim().notEmpty().isLength({ max: 300 }),
        body('fechaCompra').optional().isISO8601(),
        body('valorCompra').optional().isFloat({ min: 0 }),
        validate,
    ],
    ctrl.actualizar
);

// PATCH /api/activos/:id/baja
router.patch('/:id/baja',
    onlyAdmins,
    [body('motivo').trim().notEmpty().isLength({ max: 300 }).withMessage('Motivo de baja requerido (máx. 300 caracteres)'), validate],
    ctrl.darDeBaja
);

// GET /api/activos/importar/plantilla  — descarga la plantilla CSV
router.get('/importar/plantilla', checkPermiso('activos', 'crear'), ctrl.plantilla);

// POST /api/activos/importar  — sube un CSV y crea activos en bulk
router.post('/importar',
    checkPermiso('activos', 'crear'),
    upload.single('archivo'),
    ctrl.importar
);

module.exports = router;
