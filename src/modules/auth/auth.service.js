const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const repo    = require('./auth.repository');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

/**
 * Genera un par de tokens JWT (access + refresh).
 */
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
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', issuer: 'inventario-it' }
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

    return generarTokens(usuario);
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
    await repo.updatePassword(usuarioId, hash);
};

/**
 * Hashea una password nueva (utility para otros módulos).
 */
const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

module.exports = { login, refreshToken, cambiarPassword, hashPassword, generarTokens };
