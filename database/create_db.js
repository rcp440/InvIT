require('dotenv').config();
const { Client } = require('pg');

// Conectar a la base 'postgres' para poder crear la nueva base
const client = new Client({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 5432,
    database: 'postgres',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const DB_NAME = process.env.DB_NAME || 'inventario_it';

async function createDatabase() {
    await client.connect();

    try {
        // Verificar si ya existe
        const { rows } = await client.query(
            'SELECT 1 FROM pg_database WHERE datname = $1',
            [DB_NAME]
        );

        if (rows.length > 0) {
            console.log(`[INFO]  La base de datos '${DB_NAME}' ya existe. Nada que hacer.`);
            return;
        }

        // Crear la base de datos
        await client.query(`CREATE DATABASE "${DB_NAME}"
            WITH ENCODING = 'UTF8'
            LC_COLLATE = 'Spanish_Argentina.1252'
            LC_CTYPE   = 'Spanish_Argentina.1252'
            TEMPLATE   = template0`);

        console.log(`[OK]    Base de datos '${DB_NAME}' creada.`);

        // Conectar a la nueva base para activar extensiones
        const client2 = new Client({
            host:     process.env.DB_HOST     || 'localhost',
            port:     parseInt(process.env.DB_PORT) || 5432,
            database: DB_NAME,
            user:     process.env.DB_USER     || 'postgres',
            password: process.env.DB_PASSWORD || '',
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        });

        await client2.connect();
        await client2.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        await client2.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
        await client2.end();

        console.log('[OK]    Extensiones uuid-ossp y pgcrypto activadas.');
        console.log('');
        console.log('Próximo paso: npm run migrate:seed');

    } catch (err) {
        // Si el locale falla, reintentar sin especificarlo
        if (err.code === '22023') {
            await client.query(`CREATE DATABASE "${DB_NAME}" WITH ENCODING = 'UTF8'`);
            console.log(`[OK]    Base de datos '${DB_NAME}' creada (locale por defecto).`);
        } else {
            console.error('[ERROR]', err.message);
            process.exit(1);
        }
    } finally {
        await client.end();
    }
}

createDatabase();
