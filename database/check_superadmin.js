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

async function run() {
    await client.connect();

    // Ver todas las filas de superadmin
    const { rows } = await client.query(
        "SELECT id, email, LEFT(password_hash, 20) AS hash_inicio, activo FROM usuarios WHERE tenant_id IS NULL"
    );
    console.log('Filas superadmin:', rows);

    // Limpiar duplicados y dejar solo uno con hash correcto
    await client.query("DELETE FROM usuarios WHERE tenant_id IS NULL");

    const hash = await bcrypt.hash('Admin@1234', 12);
    const { rows: roles } = await client.query("SELECT id FROM roles WHERE nombre = 'superadmin'");

    await client.query(
        `INSERT INTO usuarios (tenant_id, nombre, apellido, email, password_hash, rol_id, activo)
         VALUES (NULL, 'Super', 'Admin', 'superadmin@inventarioit.com', $1, $2, true)`,
        [hash, roles[0].id]
    );

    // Verificar que el hash es válido
    const { rows: user } = await client.query(
        "SELECT password_hash FROM usuarios WHERE email = 'superadmin@inventarioit.com'"
    );
    const ok = await bcrypt.compare('Admin@1234', user[0].password_hash);
    console.log('Hash válido para Admin@1234:', ok);
    console.log('[OK] SuperAdmin reinsertado correctamente');

    await client.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
