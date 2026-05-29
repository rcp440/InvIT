const { Router } = require('express');

const authRoutes         = require('../modules/auth/auth.routes');
const empresasRoutes     = require('../modules/empresas/empresas.routes');
const usuariosRoutes     = require('../modules/usuarios/usuarios.routes');
const categoriasRoutes   = require('../modules/categorias/categorias.routes');
const ubicacionesRoutes  = require('../modules/ubicaciones/ubicaciones.routes');
const responsablesRoutes = require('../modules/responsables/responsables.routes');
const activosRoutes      = require('../modules/activos/activos.routes');
const movimientosRoutes  = require('../modules/movimientos/movimientos.routes');
const reportesRoutes     = require('../modules/reportes/reportes.routes');
const auditoriaRoutes    = require('../modules/auditoria/auditoria.routes');
const dashboardRoutes    = require('../modules/dashboard/dashboard.routes');
const estadosRoutes      = require('../modules/estados/estados.routes');

const router = Router();

// Health check
router.get('/health', (req, res) => {
    res.json({
        success:   true,
        message:   'API funcionando',
        version:   process.env.npm_package_version || '1.0.0',
        apiVersion: 'v1',
        timestamp: new Date().toISOString(),
        env:       process.env.NODE_ENV || 'development',
    });
});

// Módulos
router.use('/auth',         authRoutes);
router.use('/empresas',     empresasRoutes);
router.use('/usuarios',     usuariosRoutes);
router.use('/categorias',   categoriasRoutes);
router.use('/ubicaciones',  ubicacionesRoutes);
router.use('/responsables', responsablesRoutes);
router.use('/activos',      activosRoutes);
router.use('/movimientos',  movimientosRoutes);
router.use('/reportes',     reportesRoutes);
router.use('/auditoria',    auditoriaRoutes);
router.use('/dashboard',    dashboardRoutes);
router.use('/estados',      estadosRoutes);

// 404 para rutas API no encontradas
router.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    });
});

module.exports = router;
