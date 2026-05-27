const { query } = require('../config/database');

/**
 * Registra una entrada en la tabla de auditoría.
 * No lanza excepción para no interrumpir el flujo principal.
 */
const registrarAuditoria = async ({
    tenantId,
    usuarioId,
    usuarioEmail,
    accion,
    modulo,
    registroId,
    datosAnteriores,
    datosNuevos,
    ip,
    userAgent,
}) => {
    try {
        await query(
            `INSERT INTO auditoria
             (tenant_id, usuario_id, usuario_email, accion, modulo,
              registro_id, datos_anteriores, datos_nuevos, ip, user_agent)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [
                tenantId   || null,
                usuarioId  || null,
                usuarioEmail || null,
                accion,
                modulo     || null,
                registroId ? String(registroId) : null,
                datosAnteriores ? JSON.stringify(datosAnteriores) : null,
                datosNuevos     ? JSON.stringify(datosNuevos)     : null,
                ip         || null,
                userAgent  || null,
            ]
        );
    } catch (err) {
        // Log silencioso: la auditoría no debe romper la operación
        console.error('[Auditoría] Error al registrar:', err.message);
    }
};

/**
 * Extrae la IP real del cliente considerando proxies.
 */
const getClientIP = (req) =>
    req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || 'unknown';

module.exports = { registrarAuditoria, getClientIP };
