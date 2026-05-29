const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
require('dotenv').config({ path: envFile });
const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');

const pool = new Pool({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    database: process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function runSeeds() {
    const client = await pool.connect();
    try {
        const seedsDir = path.join(__dirname, 'seeds');
        const files = fs.readdirSync(seedsDir)
            .filter(f => f.endsWith('.sql') || f.endsWith('.js'))
            .sort();

        for (const file of files) {
            await client.query('BEGIN');
            if (file.endsWith('.js')) {
                const seedFn = require(path.join(seedsDir, file));
                await seedFn(client);
            } else {
                const sql = fs.readFileSync(path.join(seedsDir, file), 'utf8');
                await client.query(sql);
            }
            await client.query('COMMIT');
            console.log(`[OK]    ${file}`);
        }

        console.log('\nSeeds completados.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[ERROR] Seed fallido:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runSeeds();
