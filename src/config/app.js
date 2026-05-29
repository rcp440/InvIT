const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const morgan     = require('morgan');
const compression = require('compression');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const timeout             = require('connect-timeout');
const logger              = require('../utils/logger');
const correlationMiddleware = require('../middleware/correlation.middleware');
const errorMiddleware     = require('../middleware/error.middleware');
const routes              = require('../routes');

const app = express();

// ── Correlation ID ─────────────────────────────────────────────────────────────
app.use(correlationMiddleware);

// ── Seguridad ──────────────────────────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc:               ["'self'"],
            styleSrc:                 ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'],
            scriptSrc:                ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'],
            scriptSrcAttr:            ["'unsafe-inline'"],
            connectSrc:               ["'self'", 'https://cdn.datatables.net'],
            imgSrc:                   ["'self'", 'data:', 'https:'],
            fontSrc:                  ["'self'", 'https://cdnjs.cloudflare.com', 'https://fonts.gstatic.com'],
            upgradeInsecureRequests:  null, // deshabilitar — no hay HTTPS configurado
        },
    },
    // HSTS deshabilitado hasta tener certificado SSL
    hsts: false,
    crossOriginEmbedderPolicy: false,
}));

// ── CORS ───────────────────────────────────────────────────────────────────────
const corsOptions = {
    origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
        : '*',
    methods:            ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders:     ['Content-Type', 'Authorization', 'X-Tenant-ID'],
    credentials:        true,
    optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// ── Rate Limiting ──────────────────────────────────────────────────────────────
// Composite key: IP + tenant so each tenant gets its own quota bucket
// X-Tenant-ID header is used here since req.tenantId isn't populated yet at this middleware stage
const tenantKeyGenerator = (req) => {
    const tenant = req.headers['x-tenant-id'] || 'public';
    return `${req.ip}:${tenant}`;
};

const globalLimiter = rateLimit({
    windowMs:      parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max:           parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    standardHeaders: true,
    legacyHeaders:   false,
    keyGenerator:  tenantKeyGenerator,
    message: { success: false, message: 'Demasiadas solicitudes. Intente más tarde.' },
});

const authLimiter = rateLimit({
    windowMs:      15 * 60 * 1000,
    max:           parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
    standardHeaders: true,
    legacyHeaders:   false,
    keyGenerator:  (req) => req.ip,
    message: { success: false, message: 'Demasiados intentos de autenticación. Intente en 15 minutos.' },
});

app.use('/api/', globalLimiter);
app.use('/api/auth/', authLimiter);

// ── Timeout de requests ────────────────────────────────────────────────────────
// Cancela requests que tarden más de 30s (evita bloqueo por queries lentas o deadlocks)
app.use(timeout('30s'));
app.use((req, res, next) => {
    if (!req.timedout) next();
});

// ── Parsing & Compresión ───────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// ── Logging HTTP ── Morgan redirigido a Winston (va a combined.log en archivo) ──
if (process.env.NODE_ENV !== 'test') {
    // Incluir requestId en cada línea de log HTTP
    morgan.token('reqid', (req) => req.requestId || '-');
    const morganFormat = process.env.NODE_ENV === 'production'
        ? ':reqid :remote-addr :method :url :status :res[content-length] - :response-time ms'
        : ':reqid :method :url :status :response-time ms';
    app.use(morgan(morganFormat, { stream: logger.morganStream }));
}

// ── Archivos estáticos ─────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../../public')));

// ── Rutas API ──────────────────────────────────────────────────────────────────
app.use('/api/v1', routes);
app.use('/api',    routes); // alias sin versión para compatibilidad con el frontend actual

// ── SPA fallback (sirve index.html para rutas del frontend) ────────────────────
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../../public/index.html'));
    }
});

// ── Manejo global de errores ───────────────────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
