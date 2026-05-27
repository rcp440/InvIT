const { validationResult } = require('express-validator');

/**
 * Ejecuta las reglas de validación de express-validator y responde con errores si hay.
 * Usar al final del array de middlewares de validación de cada ruta.
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: 'Errores de validación',
            errors:  errors.array().map(e => ({
                campo:   e.path,
                mensaje: e.msg,
                valor:   e.value,
            })),
        });
    }

    next();
};

module.exports = validate;
