const { Router } = require('express');
const ctrl       = require('./dashboard.controller');
const { authenticate }                 = require('../../middleware/auth.middleware');
const { resolveTenant, requireTenant } = require('../../middleware/tenant.middleware');
const { checkPermiso }                 = require('../../middleware/roles.middleware');

const router = Router();
router.use(authenticate, resolveTenant, requireTenant);

// GET /api/dashboard?meses=6
router.get('/', checkPermiso('activos', 'leer'), ctrl.getDashboard);

module.exports = router;
