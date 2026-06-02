/**
 * TicketCRM — Servidor principal
 * Desarrollado por: Raúl de Jesús Larios
 */

// Cargar variables de entorno antes de cualquier otra cosa
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const authRoutes     = require('./auth/authRoutes');
const ticketRoutes   = require('./routes/tickets');
const customerRoutes = require('./routes/customers');
const statsRoutes    = require('./routes/stats');

const app  = express();
const PORT = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV !== 'production';

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
].filter(Boolean));

// Render y otros proxies reversos
app.set('trust proxy', 1);

// ── Seguridad ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limit global
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Intenta de nuevo en 15 minutos.' },
}));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(morgan(isDev ? 'dev' : 'combined'));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({
  status: 'ok',
  app: 'TicketCRM',
  author: 'Raúl de Jesús Larios',
  uptime: Math.floor(process.uptime()),
  env: process.env.NODE_ENV || 'development',
}));

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',      authRoutes);
app.use('/api/v1/tickets',   ticketRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/stats',     statsRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` });
});

// ── Error handler global ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err.stack);
  const status = err.status || 500;
  res.status(status).json({
    error: isDev ? err.message : 'Error interno del servidor',
    ...(isDev && { stack: err.stack }),
  });
});

function startServer() {
  return app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔══════════════════════════════════════════╗
║           TicketCRM API                  ║
║   Desarrollado por Raúl de Jesús Larios  ║
╠══════════════════════════════════════════╣
║  URL:  http://localhost:${PORT}              ║
║  Env:  ${(process.env.NODE_ENV || 'development').padEnd(34)}║
╚══════════════════════════════════════════╝
    `);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;
