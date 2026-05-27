const { Router }  = require('express');
const { body }    = require('express-validator');
const controller  = require('./auth.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const validate    = require('../../middleware/validate.middleware');

const router = Router();

// POST /api/auth/login
router.post('/login',
    [
        body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
        body('password').notEmpty().withMessage('Password requerida'),
        validate,
    ],
    controller.login
);

// POST /api/auth/refresh
router.post('/refresh',
    [
        body('refreshToken').notEmpty().withMessage('Refresh token requerido'),
        validate,
    ],
    controller.refresh
);

// GET /api/auth/me  (requiere autenticación)
router.get('/me',
    authenticate,
    controller.me
);

// POST /api/auth/cambiar-password  (requiere autenticación)
router.post('/cambiar-password',
    authenticate,
    [
        body('passwordActual').notEmpty().withMessage('Password actual requerida'),
        body('passwordNueva')
            .isLength({ min: 8 }).withMessage('La nueva password debe tener al menos 8 caracteres')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('La password debe contener mayúsculas, minúsculas y números'),
        validate,
    ],
    controller.cambiarPassword
);

// POST /api/auth/logout  (requiere autenticación)
router.post('/logout',
    authenticate,
    controller.logout
);

module.exports = router;
