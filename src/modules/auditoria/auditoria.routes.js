const { Router } = require('express');
const { query }  = require('express-validator');
const ctrl       = require('./auditoria.controller');
const { authenticate }  = require('../../middleware/auth.middleware');
const { resolveTenant } = require('../../middleware/tenant.middleware');
const { onlyAdmins }    = require('../../middleware/roles.middleware');
const validate          = require('../../middleware/validate.middleware');

const router = Router();
router.use(authenticate, resolveTenant);

// Solo admins y superadmin pueden consultar auditoría
router.get('/',
    onlyAdmins,
    [
        query('accion').optional().isIn([
            'LOGIN','LOGOUT','LOGIN_FALLIDO','CREAR','ACTUALIZAR','ELIMINAR',
            'RESTAURAR','CAMBIAR_PASSWORD','RESET_PASSWORD','EXPORTAR','IMPORTAR',
        ]),
        query('fechaDesde').optional().isISO8601(),
        query('fechaHasta').optional().isISO8601(),
        validate,
    ],
    ctrl.listar
);

module.exports = router;
