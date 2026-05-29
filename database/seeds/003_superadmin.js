/**
 * Seed 003: superadmin inicial.
 * La password se lee de SUPERADMIN_PASSWORD (env). Si no está definida, falla
 * en producción y usa un valor por defecto solo en development/test.
 */
const bcrypt = require('bcryptjs');

module.exports = async function seed003Superadmin(client) {
    const env = process.env.NODE_ENV || 'development';

    let rawPassword = process.env.SUPERADMIN_PASSWORD;
    if (!rawPassword) {
        if (env === 'production') {
            throw new Error('SUPERADMIN_PASSWORD no definida. Abortando seed en producción.');
        }
        rawPassword = 'Admin@1234';
        console.warn('[WARN]  SUPERADMIN_PASSWORD no definida — usando contraseña por defecto (solo desarrollo)');
    }

    const hash = await bcrypt.hash(rawPassword, 12);

    await client.query(`
        INSERT INTO usuarios (id, tenant_id, nombre, apellido, email, password_hash, rol_id, activo)
        SELECT
            uuid_generate_v4(),
            NULL,
            'Super',
            'Admin',
            COALESCE($1, 'superadmin@inventarioit.com'),
            $2,
            r.id,
            true
        FROM roles r
        WHERE r.nombre = 'superadmin'
        ON CONFLICT DO NOTHING
    `, [process.env.SUPERADMIN_EMAIL || 'superadmin@inventarioit.com', hash]);
};
