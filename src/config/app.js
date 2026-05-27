const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const morgan     = require('morgan');
const compression = require('compression');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const errorMiddleware  = require('../middleware/error.middleware');
const routes           = require('../routes');

const app = express();

// ── Seguridad ──────────────────────────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc:  ["'self'"],
            styleSrc:    ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'],
            scriptSrc:   ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'],
            imgSrc:      ["'self'", 'data:', 'https:'],
            fontSrc:     ["'self'", 'https://cdnjs.cloudflare.com', 'https://fonts.gstatic.com'],
        },
    },
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
const globalLimiter = rateLimit({
    windowMs:   parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max:        parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    standardHeaders: true,
    legacyHeaders:   false,
    message: { success: false, message: 'Demasiadas solicitudes. Intente más tarde.' },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max:      parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
    standardHeaders: true,
    legacyHeaders:   false,
    message: { success: false, message: 'Demasiados intentos de autenticación. Intente en 15 minutos.' },
});

app.use('/api/', globalLimiter);
app.use('/api/auth/', authLimiter);

// ── Parsing & Compresión ───────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// ── Logging HTTP ───────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Archivos estáticos ─────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../../public')));

// ── Rutas API ──────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── SPA fallback (sirve index.html para rutas del frontend) ────────────────────
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../../public/index.html'));
    }
});

// ── Manejo global de errores ───────────────────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
