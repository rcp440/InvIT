const winston = require('winston');
const path    = require('path');
const fs      = require('fs');

const logDir = process.env.LOG_DIR || './logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const isProd = process.env.NODE_ENV === 'production';
const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Formato legible para desarrollo
const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
});

// JSON estructurado para producción (compatible con Datadog, Elasticsearch, etc.)
const prodFormat = combine(
    errors({ stack: true }),
    timestamp(),
    json()
);

const fileFormat = isProd
    ? prodFormat
    : combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), devFormat);

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: fileFormat,
    transports: [
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level:    'error',
            maxsize:  10 * 1024 * 1024,
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize:  10 * 1024 * 1024,
            maxFiles: 10,
        }),
    ],
});

if (!isProd) {
    logger.add(new winston.transports.Console({
        format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), devFormat),
    }));
}

// Stream para Morgan — redirige logs HTTP a Winston en lugar de stdout
logger.morganStream = {
    write: (message) => logger.http(message.trim()),
};

module.exports = logger;
