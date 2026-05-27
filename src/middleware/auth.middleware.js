const jwt    = require('jsonwebtoken');
const { query } = require('../config/database');
const { unauthorized, forbidden } = require('../utils/response.helper');

/**
 * Verifica el JWT y adjunta req.user con los datos del token.
 * El token debe viajar en el header: Authorization: Bearer <token>
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return unauthorized(res, 'Token de autenticación requerido');
        }

        const token = authHeader.split(' ')[1];

        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return unauthorized(res, 'Token expirado. Inicie sesión nuevamente');
            }
            return unauthorized(res, 'Token inválido');
        }

        // Verificar que el usuario siga activo en la base de datos
        const { rows } = await query(
            `SELECT u.id, u.tenant_id, u.nombre, u.apellido, u.email,
                    u.rol_id, u.activo, r.nombre AS rol_nombre, r.permisos
             FROM usuarios u
             JOIN roles r ON r.id = u.rol_id
             WHERE u.id = $1`,
            [payload.userId]
        );

        if (!rows.length || !rows[0].activo) {
            return unauthorized(res, 'Usuario inactivo o no encontrado');
        }

        req.user = rows[0];
        next();
    } catch (err) {
        next(err);
    }
};

/**
 * Middleware opcional: no rechaza si no hay token, solo adjunta req.user si existe.
 */
const authenticateOptional = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }
    return authenticate(req, res, next);
};

module.exports = { authenticate, authenticateOptional };
