const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const repo    = require('./auth.repository');
const { sendResetPassword } = require('../../utils/email.helper');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

// Convierte '7d', '8h', '30m' a milisegundos
const ms = (str) => {
    const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const match = String(str).match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 86400000; // default 7d
    return parseInt(match[1]) * units[match[2]];
};

/**
 * Genera un par de tokens JWT (access + refresh).
 */
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const generarTokens = (usuario) => {
    const payload = {
        userId:    usuario.id,
        email:     usuario.email,
        tenantId:  usuario.tenant_id || null,
        rolNombre: usuario.rol_nombre,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '8h',
        issuer:    'inventario-it',
    });

    const refreshToken = jwt.sign(
        { userId: usuario.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES_IN, issuer: 'inventario-it' }
    );

    return { accessToken, refreshToken };
};

/**
 * Login de usuario.
 * Retorna tokens si las credenciales son válidas.
 */
const login = async (email, password) => {
    const usuario = await repo.findByEmail(email);

    if (!usuario) {
        throw Object.assign(new Error('Credenciales inválidas'), { status: 401 });
    }

    if (!usuario.activo) {
        throw Object.assign(new Error('Usuario inactivo'), { status: 403 });
    }

    // Verificar bloqueo temporal
    if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > new Date()) {
        const minutos = Math.ceil((new Date(usuario.bloqueado_hasta) - Date.now()) / 60000);
        throw Object.assign(
            new Error(`Cuenta bloqueada temporalmente. Intente en ${minutos} minuto(s)`),
            { status: 423 }
        );
    }

    const passwordValido = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordValido) {
        await repo.incrementarIntentosFallidos(usuario.id);
        throw Object.assign(new Error('Credenciales inválidas'), { status: 401 });
    }

    await repo.updateUltimoAcceso(usuario.id);

    const tokens = generarTokens(usuario);

    // Persistir hash del refresh token para permitir revocación
    const refreshHash = await bcrypt.hash(tokens.refreshToken, 6);
    const refreshExp  = new Date(Date.now() + ms(REFRESH_EXPIRES_IN));
    await repo.saveRefreshToken(usuario.id, refreshHash, refreshExp);

    return {
        tokens,
        usuario: {
            id:        usuario.id,
            nombre:    usuario.nombre,
            apellido:  usuario.apellido,
            email:     usuario.email,
            tenantId:  usuario.tenant_id || null,
            rol:       usuario.rol_nombre,
            permisos:  usuario.permisos,
        },
    };
};

/**
 * Refresca el access token usando un refresh token válido.
 */
const refreshToken = async (token) => {
    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
        throw Object.assign(new Error('Refresh token inválido o expirado'), { status: 401 });
    }

    const usuario = await repo.findById(payload.userId);
    if (!usuario || !usuario.activo) {
        throw Object.assign(new Error('Usuario no encontrado o inactivo'), { status: 401 });
    }

    // Verificar que el token coincida con el hash almacenado (detecta tokens revocados)
    const stored = await repo.findByRefreshToken(payload.userId);
    if (!stored?.refresh_token_hash) {
        throw Object.assign(new Error('Sesión expirada, inicie sesión nuevamente'), { status: 401 });
    }
    const valido = await bcrypt.compare(token, stored.refresh_token_hash);
    if (!valido) {
        throw Object.assign(new Error('Refresh token inválido'), { status: 401 });
    }

    const tokens = generarTokens(usuario);

    // Rotar el refresh token (invalidar el anterior)
    const refreshHash = await bcrypt.hash(tokens.refreshToken, 6);
    const refreshExp  = new Date(Date.now() + ms(REFRESH_EXPIRES_IN));
    await repo.saveRefreshToken(usuario.id, refreshHash, refreshExp);

    return tokens;
};

const logout = async (usuarioId) => {
    await repo.revokeRefreshToken(usuarioId);
};

/**
 * Cambia la password del usuario autenticado.
 */
const cambiarPassword = async (usuarioId, passwordActual, passwordNueva) => {
    const usuario = await repo.findById(usuarioId);

    // Para validar la password actual necesitamos el hash
    const { rows } = await require('../../config/database').query(
        'SELECT password_hash FROM usuarios WHERE id = $1',
        [usuarioId]
    );

    if (!rows.length) {
        throw Object.assign(new Error('Usuario no encontrado'), { status: 404 });
    }

    const valida = await bcrypt.compare(passwordActual, rows[0].password_hash);
    if (!valida) {
        throw Object.assign(new Error('Password actual incorrecta'), { status: 400 });
    }

    const hash = await bcrypt.hash(passwordNueva, SALT_ROUNDS);
    // updatePassword ya limpia refresh_token_hash → invalida sesiones activas
    await repo.updatePassword(usuarioId, hash);
};

/**
 * Hashea una password nueva (utility para otros módulos).
 */
const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

/**
 * Genera un token de reset, lo guarda en DB y envía el email.
 * Siempre responde 200 aunque el email no exista (evita user enumeration).
 */
const forgotPassword = async (email) => {
    const usuario = await repo.findByEmail(email);
    if (!usuario || !usuario.activo) return; // silencioso

    const token = crypto.randomBytes(32).toString('hex');
    const exp   = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await repo.saveResetToken(usuario.id, token, exp);

    await sendResetPassword({
        to:     usuario.email,
        nombre: usuario.nombre,
        token,
        appUrl: process.env.APP_URL || 'http://localhost:3000',
    });
};

/**
 * Verifica el token de reset y actualiza la password.
 */
const resetPassword = async (token, passwordNueva) => {
    const usuario = await repo.findByResetToken(token);
    if (!usuario) {
        throw Object.assign(new Error('Token inválido o expirado'), { status: 400 });
    }

    const hash = await bcrypt.hash(passwordNueva, SALT_ROUNDS);
    await repo.updatePassword(usuario.id, hash);
};

module.exports = { login, refreshToken, logout, cambiarPassword, hashPassword, generarTokens, forgotPassword, resetPassword };
