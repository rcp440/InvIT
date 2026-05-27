const { forbidden } = require('../utils/response.helper');

/**
 * Verifica que el usuario tenga uno de los roles permitidos.
 * Uso: authorize('superadmin', 'admin_empresa')
 */
const authorize = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.user) {
            return forbidden(res, 'No autenticado');
        }

        const rolUsuario = req.user.rol_nombre;

        if (!rolesPermitidos.includes(rolUsuario)) {
            return forbidden(res, `Acceso denegado. Se requiere: ${rolesPermitidos.join(' o ')}`);
        }

        next();
    };
};

/**
 * Verifica permisos granulares del JSON de permisos del rol.
 * Uso: checkPermiso('activos', 'eliminar')
 */
const checkPermiso = (modulo, accion) => {
    return (req, res, next) => {
        if (!req.user) {
            return forbidden(res, 'No autenticado');
        }

        // SuperAdmin siempre tiene todos los permisos
        if (req.user.rol_nombre === 'superadmin') {
            return next();
        }

        const permisos = req.user.permisos || {};
        const moduloPermisos = permisos[modulo];

        if (!moduloPermisos || !moduloPermisos[accion]) {
            return forbidden(res, `No tiene permiso para: ${accion} en ${modulo}`);
        }

        next();
    };
};

/**
 * Solo SuperAdmin puede acceder.
 */
const onlySuperAdmin = authorize('superadmin');

/**
 * SuperAdmin o AdminEmpresa pueden acceder.
 */
const onlyAdmins = authorize('superadmin', 'admin_empresa');

module.exports = { authorize, checkPermiso, onlySuperAdmin, onlyAdmins };
