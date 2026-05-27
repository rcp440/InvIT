const { query } = require('../config/database');
const { forbidden, notFound } = require('../utils/response.helper');

/**
 * MIDDLEWARE MULTI-TENANT
 *
 * Extrae y valida el tenant_id del usuario autenticado.
 * - SuperAdmin: puede operar en cualquier tenant. Si incluye X-Tenant-ID header, actúa como ese tenant.
 * - Admin/Operador: solo puede operar en su propio tenant.
 *
 * Adjunta req.tenantId a la request para que todos los repositorios lo usen.
 */
const resolveTenant = async (req, res, next) => {
    try {
        if (!req.user) {
            return forbidden(res, 'Autenticación requerida antes del middleware tenant');
        }

        const { rol_nombre, tenant_id: userTenantId } = req.user;

        if (rol_nombre === 'superadmin') {
            // SuperAdmin puede impersonar un tenant vía header
            const headerTenantId = req.headers['x-tenant-id'];

            if (headerTenantId) {
                // Verificar que el tenant exista y esté activo
                const { rows } = await query(
                    `SELECT id FROM empresas WHERE id = $1 AND estado != 'inactivo'`,
                    [headerTenantId]
                );

                if (!rows.length) {
                    return notFound(res, 'Empresa no encontrada o inactiva');
                }

                req.tenantId    = headerTenantId;
                req.isSuperAdmin = true;
            } else {
                req.tenantId    = null; // superadmin sin tenant seleccionado = vista global
                req.isSuperAdmin = true;
            }
        } else {
            // Usuario de empresa: solo su tenant
            if (!userTenantId) {
                return forbidden(res, 'Usuario sin empresa asignada');
            }

            // Verificar que la empresa siga activa
            const { rows } = await query(
                `SELECT id, estado FROM empresas WHERE id = $1`,
                [userTenantId]
            );

            if (!rows.length) {
                return forbidden(res, 'Empresa no encontrada');
            }

            if (rows[0].estado === 'suspendido') {
                return forbidden(res, 'Su empresa está suspendida. Contacte al administrador');
            }

            if (rows[0].estado === 'inactivo') {
                return forbidden(res, 'Su empresa está inactiva');
            }

            req.tenantId    = userTenantId;
            req.isSuperAdmin = false;
        }

        next();
    } catch (err) {
        next(err);
    }
};

/**
 * Garantiza que el tenant esté definido (ni superadmin sin contexto puede acceder).
 * Úsalo en rutas que SIEMPRE necesitan un tenant activo.
 */
const requireTenant = (req, res, next) => {
    if (!req.tenantId) {
        return forbidden(res, 'Debe seleccionar una empresa (X-Tenant-ID)');
    }
    next();
};

module.exports = { resolveTenant, requireTenant };
