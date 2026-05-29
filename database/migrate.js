const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
require('dotenv').config({ path: envFile });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    database: process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// ID fijo para el advisory lock — identifica este sistema en PG
const MIGRATION_LOCK_ID = 7_391_820;

async function runMigrations() {
    const client = await pool.connect();
    try {
        // Lock exclusivo a nivel de sesión: solo una instancia migra a la vez.
        // Si otra instancia ya tiene el lock (deploy concurrente), esta espera.
        await client.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK_ID]);
        console.log('[LOCK]  Advisory lock adquirido');

        // Tabla de control de migraciones ejecutadas
        await client.query(`
            CREATE TABLE IF NOT EXISTS _migraciones (
                id          SERIAL PRIMARY KEY,
                archivo     VARCHAR(255) UNIQUE NOT NULL,
                ejecutado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        const migrationsDir = path.join(__dirname, 'migrations');
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        for (const file of files) {
            const { rows } = await client.query(
                'SELECT id FROM _migraciones WHERE archivo = $1',
                [file]
            );

            if (rows.length > 0) {
                console.log(`[SKIP]  ${file} (ya ejecutada)`);
                continue;
            }

            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

            await client.query('BEGIN');
            await client.query(sql);
            await client.query(
                'INSERT INTO _migraciones (archivo) VALUES ($1)',
                [file]
            );
            await client.query('COMMIT');
            console.log(`[OK]    ${file}`);
        }

        console.log('\nMigraciones completadas.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[ERROR] Migración fallida:', err.message);
        process.exit(1);
    } finally {
        // Liberar el lock siempre, incluso si hubo error
        await client.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_ID]).catch(() => {});
        client.release();
        await pool.end();
    }
}

runMigrations();
