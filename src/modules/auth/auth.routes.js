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
        body('password').notEmpty().isLength({ max: 100 }).withMessage('Password requerida'),
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
        body('passwordActual').notEmpty().isLength({ max: 100 }).withMessage('Password actual requerida'),
        body('passwordNueva')
            .isLength({ min: 8, max: 100 }).withMessage('La nueva password debe tener al menos 8 caracteres')
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

// POST /api/auth/forgot-password  (público)
router.post('/forgot-password',
    [
        body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
        validate,
    ],
    controller.forgotPassword
);

// POST /api/auth/reset-password  (público, requiere token del email)
router.post('/reset-password',
    [
        body('token').notEmpty().withMessage('Token requerido'),
        body('passwordNueva')
            .isLength({ min: 8, max: 100 })
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('La password debe tener al menos 8 caracteres, mayúsculas, minúsculas y números'),
        validate,
    ],
    controller.resetPassword
);

module.exports = router;
