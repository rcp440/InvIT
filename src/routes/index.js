const { Router } = require('express');

const authRoutes         = require('../modules/auth/auth.routes');
const empresasRoutes     = require('../modules/empresas/empresas.routes');
const usuariosRoutes     = require('../modules/usuarios/usuarios.routes');
const categoriasRoutes   = require('../modules/categorias/categorias.routes');
const ubicacionesRoutes  = require('../modules/ubicaciones/ubicaciones.routes');
const responsablesRoutes = require('../modules/responsables/responsables.routes');
const activosRoutes      = require('../modules/activos/activos.routes');
const movimientosRoutes  = require('../modules/movimientos/movimientos.routes');

const router = Router();

// Health check
router.get('/health', (req, res) => {
    res.json({
        success:  true,
        message:  'API funcionando',
        version:  '1.0.0',
        timestamp: new Date().toISOString(),
        env:      process.env.NODE_ENV || 'development',
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

// 404 para rutas API no encontradas
router.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    });
});

module.exports = router;
