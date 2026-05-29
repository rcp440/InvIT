const logger = require('../utils/logger');

/**
 * Middleware global de manejo de errores.
 * Debe registrarse ÚLTIMO en app.js, después de todas las rutas.
 */
const errorMiddleware = (err, req, res, next) => {
    // Log del error completo para debugging
    logger.error({
        message:   err.message,
        stack:     process.env.NODE_ENV === 'development' ? err.stack : undefined,
        requestId: req.requestId,
        method:    req.method,
        path:      req.path,
        tenantId:  req.tenantId,
        userId:    req.user?.id,
    });

    // Errores de validación (express-validator)
    if (err.type === 'validation') {
        return res.status(422).json({
            success: false,
            message: 'Errores de validación',
            errors:  err.errors,
        });
    }

    // Errores de PostgreSQL
    if (err.code) {
        switch (err.code) {
            case '23505': // unique_violation
                return res.status(409).json({
                    success: false,
                    message: 'Ya existe un registro con esos datos',
                    detail:  process.env.NODE_ENV === 'development' ? err.detail : undefined,
                });
            case '23503': // foreign_key_violation
                return res.status(409).json({
                    success: false,
                    message: 'No se puede eliminar: existen registros relacionados',
                });
            case '22P02': // invalid_text_representation (UUID inválido)
                return res.status(400).json({
                    success: false,
                    message: 'ID inválido',
                });
            case '42P01': // undefined_table
                return res.status(500).json({
                    success: false,
                    message: 'Error de base de datos. Ejecute las migraciones.',
                });
        }
    }

    // HTTP status customizado
    const status = err.status || err.statusCode || 500;
    const isServerError = status >= 500;

    res.status(status).json({
        success: false,
        message: (isServerError && process.env.NODE_ENV === 'production')
            ? 'Error interno del servidor'
            : (err.message || 'Error interno del servidor'),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

module.exports = errorMiddleware;
