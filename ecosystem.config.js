/**
 * PM2 Ecosystem — InventarioIT SaaS
 * Uso: pm2 start ecosystem.config.js --env production
 */
module.exports = {
    apps: [
        {
            name:         'inventarioit',
            script:       'server.js',
            instances:    'max',        // un proceso por CPU disponible
            exec_mode:    'cluster',    // balanceo automático entre instancias

            // Reinicio automático
            watch:        false,
            max_memory_restart: '400M',
            restart_delay: 3000,

            // Variables de entorno — producción
            env_production: {
                NODE_ENV:   'production',
                PORT:       3000,
            },

            // Logs
            out_file:   './logs/pm2_out.log',
            error_file: './logs/pm2_err.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,

            // Graceful shutdown
            kill_timeout:         5000,
            listen_timeout:       8000,
            shutdown_with_message: true,
        },
    ],
};
