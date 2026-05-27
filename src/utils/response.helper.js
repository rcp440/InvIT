/**
 * Helpers para respuestas HTTP estandarizadas.
 * Todas las respuestas del sistema siguen el mismo formato:
 * { success, message, data?, meta?, errors? }
 */

const ok = (res, data = null, message = 'OK', statusCode = 200) =>
    res.status(statusCode).json({ success: true, message, data });

const created = (res, data = null, message = 'Creado exitosamente') =>
    res.status(201).json({ success: true, message, data });

const paginated = (res, data, meta, message = 'OK') =>
    res.status(200).json({ success: true, message, data, meta });

const noContent = (res) =>
    res.status(204).send();

const badRequest = (res, message = 'Solicitud inválida') =>
    res.status(400).json({ success: false, message });

const unauthorized = (res, message = 'No autenticado') =>
    res.status(401).json({ success: false, message });

const forbidden = (res, message = 'Acceso denegado') =>
    res.status(403).json({ success: false, message });

const notFound = (res, message = 'Recurso no encontrado') =>
    res.status(404).json({ success: false, message });

const conflict = (res, message = 'Conflicto con datos existentes') =>
    res.status(409).json({ success: false, message });

const unprocessable = (res, message = 'Error de validación', errors = []) =>
    res.status(422).json({ success: false, message, errors });

const serverError = (res, message = 'Error interno del servidor') =>
    res.status(500).json({ success: false, message });

module.exports = {
    ok, created, paginated, noContent,
    badRequest, unauthorized, forbidden,
    notFound, conflict, unprocessable, serverError,
};
