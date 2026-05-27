require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function resetSuperAdmin() {
    await client.connect();

    try {
        const email    = 'superadmin@inventarioit.com';
        const password = 'Admin@1234';
        const hash     = await bcrypt.hash(password, 12);

        // Buscar rol superadmin
        const { rows: roles } = await client.query(
            "SELECT id FROM roles WHERE nombre = 'superadmin'"
        );

        if (!roles.length) {
            console.error('[ERROR] Rol superadmin no encontrado. Ejecute los seeds primero: npm run seed');
            process.exit(1);
        }

        // Insertar o actualizar superadmin
        // DELETE + INSERT para evitar el problema de NULL en ON CONFLICT
        await client.query("DELETE FROM usuarios WHERE email = $1 AND tenant_id IS NULL", [email]);
        await client.query(
            `INSERT INTO usuarios (tenant_id, nombre, apellido, email, password_hash, rol_id, activo)
             VALUES (NULL, 'Super', 'Admin', $1, $2, $3, true)`,
            [email, hash, roles[0].id]
        );

        console.log('[OK]    SuperAdmin creado/actualizado');
        console.log(`        Email:    ${email}`);
        console.log(`        Password: ${password}`);
        console.log('');
        console.log('[!]     Cambie la password después del primer login');
    } catch (err) {
        console.error('[ERROR]', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

resetSuperAdmin();
