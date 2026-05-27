const { Router } = require('express');

const authRoutes     = require('../modules/auth/auth.routes');
const empresasRoutes = require('../modules/empresas/empresas.routes');

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
router.use('/auth',     authRoutes);
router.use('/empresas', empresasRoutes);

// 404 para rutas API no encontradas
router.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    });
});

module.exports = router;
