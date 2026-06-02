/**
 * TicketCRM — Middleware de autenticación y autorización
 * Desarrollado por: Raúl de Jesús Larios
 */

const jwt = require('jsonwebtoken');
const db  = require('../models/db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

/**
 * Verifica el JWT del header Authorization: Bearer <token>
 * Adjunta req.user con el payload decodificado
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Rechazar tokens "provisionales" de 2FA pendiente en rutas protegidas
    if (decoded.twoFactorPending) {
      return res.status(401).json({ error: 'Verificación 2FA pendiente' });
    }

    // Verificar que el usuario sigue activo en la DB
    const user = db.findUserById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
};

/**
 * Restringe el acceso a los roles indicados
 * Uso: router.delete('/:id', authenticate, authorize('admin'), handler)
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'No tienes permisos para esta acción' });
  }
  next();
};

module.exports = { authenticate, authorize };
