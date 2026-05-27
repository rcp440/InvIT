const { Pool } = require('pg');

const pool = new Pool({
    host:               process.env.DB_HOST     || 'localhost',
    port:               parseInt(process.env.DB_PORT) || 5432,
    database:           process.env.DB_NAME     || 'inventario_it',
    user:               process.env.DB_USER     || 'postgres',
    password:           process.env.DB_PASSWORD || '',
    max:                parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
    idleTimeoutMillis:  parseInt(process.env.DB_IDLE_TIMEOUT)   || 30000,
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
    console.error('Error inesperado en cliente PostgreSQL:', err.message);
});

// Helper: ejecuta query con parámetros
const query = (text, params) => pool.query(text, params);

// Helper: obtiene cliente para transacciones
const getClient = () => pool.connect();

// Verifica conexión al iniciar
const testConnection = async () => {
    const client = await pool.connect();
    try {
        await client.query('SELECT NOW()');
        console.log('✓ PostgreSQL conectado correctamente');
    } finally {
        client.release();
    }
};

module.exports = { pool, query, getClient, testConnection };
