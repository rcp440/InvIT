const { query, getClient } = require('../../config/database');

const findByEmail = async (email, tenantId = undefined) => {
    // tenantId=undefined busca sin filtro (login global, incluye superadmin)
    // tenantId=null busca superadmin
    let sql = `
        SELECT u.id, u.tenant_id, u.nombre, u.apellido, u.email,
               u.password_hash, u.rol_id, u.activo,
               u.intentos_fallidos, u.bloqueado_hasta,
               r.nombre AS rol_nombre, r.permisos
        FROM usuarios u
        JOIN roles r ON r.id = u.rol_id
        WHERE u.email = $1
    `;
    const params = [email];

    if (tenantId !== undefined) {
        if (tenantId === null) {
            sql += ' AND u.tenant_id IS NULL';
        } else {
            sql += ' AND u.tenant_id = $2';
            params.push(tenantId);
        }
    }

    const { rows } = await query(sql, params);
    return rows[0] || null;
};

const findById = async (id) => {
    const { rows } = await query(
        `SELECT u.id, u.tenant_id, u.nombre, u.apellido, u.email,
                u.rol_id, u.activo, u.ultimo_acceso, u.avatar_url,
                r.nombre AS rol_nombre, r.permisos
         FROM usuarios u
         JOIN roles r ON r.id = u.rol_id
         WHERE u.id = $1`,
        [id]
    );
    return rows[0] || null;
};

const updateUltimoAcceso = async (id) => {
    await query(
        'UPDATE usuarios SET ultimo_acceso = NOW(), intentos_fallidos = 0 WHERE id = $1',
        [id]
    );
};

const incrementarIntentosFallidos = async (id) => {
    await query(
        `UPDATE usuarios
         SET intentos_fallidos = intentos_fallidos + 1,
             bloqueado_hasta = CASE
                 WHEN intentos_fallidos + 1 >= 5 THEN NOW() + INTERVAL '15 minutes'
                 ELSE bloqueado_hasta
             END
         WHERE id = $1`,
        [id]
    );
};

const saveRefreshToken = async (id, hash, exp) => {
    await query(
        'UPDATE usuarios SET refresh_token_hash = $1, refresh_token_exp = $2 WHERE id = $3',
        [hash, exp, id]
    );
};

const findByRefreshToken = async (userId) => {
    const { rows } = await query(
        `SELECT refresh_token_hash, refresh_token_exp
         FROM usuarios WHERE id = $1 AND activo = true`,
        [userId]
    );
    return rows[0] || null;
};

const revokeRefreshToken = async (id) => {
    await query(
        'UPDATE usuarios SET refresh_token_hash = NULL, refresh_token_exp = NULL WHERE id = $1',
        [id]
    );
};

const updatePassword = async (id, passwordHash) => {
    await query(
        `UPDATE usuarios
         SET password_hash = $1, token_reset = NULL, token_reset_exp = NULL,
             refresh_token_hash = NULL, refresh_token_exp = NULL
         WHERE id = $2`,
        [passwordHash, id]
    );
};

const saveResetToken = async (id, token, expiration) => {
    await query(
        'UPDATE usuarios SET token_reset = $1, token_reset_exp = $2 WHERE id = $3',
        [token, expiration, id]
    );
};

const findByResetToken = async (token) => {
    const { rows } = await query(
        `SELECT id, email, tenant_id, token_reset_exp
         FROM usuarios
         WHERE token_reset = $1 AND token_reset_exp > NOW() AND activo = true`,
        [token]
    );
    return rows[0] || null;
};

module.exports = {
    findByEmail,
    findById,
    updateUltimoAcceso,
    incrementarIntentosFallidos,
    saveRefreshToken,
    findByRefreshToken,
    revokeRefreshToken,
    updatePassword,
    saveResetToken,
    findByResetToken,
};
