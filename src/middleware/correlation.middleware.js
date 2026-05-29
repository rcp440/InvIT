const { randomUUID } = require('crypto');

/**
 * Asigna un ID único a cada request.
 * Permite cruzar logs de Morgan, Winston y auditoría para una misma operación.
 * El cliente puede propagar el ID enviando X-Request-ID; si no, se genera uno nuevo.
 */
const correlationMiddleware = (req, res, next) => {
    req.requestId = req.headers['x-request-id'] || randomUUID();
    res.setHeader('x-request-id', req.requestId);
    next();
};

module.exports = correlationMiddleware;
