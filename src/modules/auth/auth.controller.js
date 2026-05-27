const service = require('./auth.service');
const repo    = require('./auth.repository');
const { ok, created, badRequest } = require('../../utils/response.helper');
const { registrarAuditoria, getClientIP } = require('../../utils/audit.helper');

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const resultado = await service.login(email, password);

        await registrarAuditoria({
            tenantId:    resultado.usuario.tenantId,
            usuarioId:   resultado.usuario.id,
            usuarioEmail: resultado.usuario.email,
            accion:      'LOGIN',
            modulo:      'auth',
            ip:          getClientIP(req),
            userAgent:   req.headers['user-agent'],
        });

        ok(res, resultado, 'Login exitoso');
    } catch (err) {
        // Registrar intento fallido si tenemos el email
        if (err.status === 401 && req.body?.email) {
            const usuario = await repo.findByEmail(req.body.email).catch(() => null);
            if (usuario) {
                await registrarAuditoria({
                    tenantId:    usuario.tenant_id,
                    usuarioId:   usuario.id,
                    usuarioEmail: usuario.email,
                    accion:      'LOGIN_FALLIDO',
                    modulo:      'auth',
                    ip:          getClientIP(req),
                    userAgent:   req.headers['user-agent'],
                });
            }
        }
        next(err);
    }
};

const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return badRequest(res, 'Refresh token requerido');
        }

        const tokens = await service.refreshToken(refreshToken);
        ok(res, { tokens }, 'Token renovado');
    } catch (err) {
        next(err);
    }
};

const me = async (req, res, next) => {
    try {
        const usuario = await repo.findById(req.user.id);

        if (!usuario) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        ok(res, {
            id:          usuario.id,
            nombre:      usuario.nombre,
            apellido:    usuario.apellido,
            email:       usuario.email,
            tenantId:    usuario.tenant_id,
            rol:         usuario.rol_nombre,
            permisos:    usuario.permisos,
            ultimoAcceso: usuario.ultimo_acceso,
            avatarUrl:   usuario.avatar_url,
        });
    } catch (err) {
        next(err);
    }
};

const cambiarPassword = async (req, res, next) => {
    try {
        const { passwordActual, passwordNueva } = req.body;
        await service.cambiarPassword(req.user.id, passwordActual, passwordNueva);

        await registrarAuditoria({
            tenantId:    req.user.tenant_id,
            usuarioId:   req.user.id,
            usuarioEmail: req.user.email,
            accion:      'CAMBIAR_PASSWORD',
            modulo:      'auth',
            ip:          getClientIP(req),
        });

        ok(res, null, 'Password actualizada correctamente');
    } catch (err) {
        next(err);
    }
};

const logout = async (req, res, next) => {
    try {
        await registrarAuditoria({
            tenantId:    req.user?.tenant_id,
            usuarioId:   req.user?.id,
            usuarioEmail: req.user?.email,
            accion:      'LOGOUT',
            modulo:      'auth',
            ip:          getClientIP(req),
        });

        ok(res, null, 'Sesión cerrada');
    } catch (err) {
        next(err);
    }
};

module.exports = { login, refresh, me, cambiarPassword, logout };
