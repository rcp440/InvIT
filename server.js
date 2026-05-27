require('dotenv').config();

const app                  = require('./src/config/app');
const { testConnection }   = require('./src/config/database');
const logger               = require('./src/utils/logger');

const PORT = parseInt(process.env.PORT) || 3000;

const startServer = async () => {
    try {
        await testConnection();

        app.listen(PORT, () => {
            logger.info(`Servidor iniciado en puerto ${PORT} [${process.env.NODE_ENV || 'development'}]`);
            logger.info(`API disponible en http://localhost:${PORT}/api`);
        });
    } catch (err) {
        logger.error(`Error al iniciar el servidor: ${err.message}`);
        process.exit(1);
    }
};

// Manejo de errores no capturados
process.on('unhandledRejection', (reason) => {
    logger.error(`UnhandledRejection: ${reason?.message || reason}`);
    console.error('UnhandledRejection:', reason);
});

process.on('uncaughtException', (err) => {
    logger.error(`UncaughtException: ${err.message}\n${err.stack}`);
    console.error('UncaughtException:', err);
    process.exit(1);
});

startServer();
