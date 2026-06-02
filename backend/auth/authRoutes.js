/**
 * TicketCRM — Rutas de autenticación
 * POST /api/v1/auth/register
 * POST /api/v1/auth/login
 * POST /api/v1/auth/google
 * POST /api/v1/auth/forgot-password
 * POST /api/v1/auth/reset-password
 * POST /api/v1/auth/2fa/setup
 * POST /api/v1/auth/2fa/verify
 * POST /api/v1/auth/2fa/authenticate
 * POST /api/v1/auth/2fa/disable
 * GET  /api/v1/auth/me
 *
 * Desarrollado por: Raúl de Jesús Larios
 */

const express    = require('express');
const router     = express.Router();
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const crypto     = require('crypto');
const speakeasy  = require('speakeasy');
const qrcode     = require('qrcode');
const { OAuth2Client } = require('google-auth-library');
const { body, validationResult } = require('express-validator');
const rateLimit  = require('express-rate-limit');

const db                      = require('../models/db');
const { authenticate }        = require('../middleware/auth');
const { sendPasswordReset, sendWelcome } = require('../utils/email');

const JWT_SECRET  = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── Rate limiters ─────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  message: { error: 'Demasiadas solicitudes de recuperación. Espera 1 hora.' },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const signToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

const safeUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  twoFactorEnabled: u.twoFactorEnabled,
  picture: u.picture || null,
  createdAt: u.createdAt,
});

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: errors.array()[0].msg });
    return false;
  }
  return true;
};

// ── POST /register ────────────────────────────────────────────────────────────
router.post('/register', [
  body('name').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
], async (req, res) => {
  if (!handleValidation(req, res)) return;

  const { name, email, password } = req.body;

  if (db.findUserByEmail(email)) {
    return res.status(409).json({ error: 'Este email ya está registrado' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = db.createUser({
    id: `usr_${crypto.randomBytes(4).toString('hex')}`,
    name,
    email,
    passwordHash,
    role: 'agent',
    twoFactorSecret: null,
    twoFactorEnabled: false,
    googleId: null,
    picture: null,
    resetToken: null,
    resetTokenExpiry: null,
    isActive: true,
    createdAt: new Date(),
  });

  // Enviar email de bienvenida (sin bloquear la respuesta si falla)
  sendWelcome(email, name).catch(console.error);

  const token = signToken({ id: user.id, role: user.role });
  res.status(201).json({ token, user: safeUser(user) });
});

// ── POST /login ───────────────────────────────────────────────────────────────
router.post('/login', loginLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria'),
], async (req, res) => {
  if (!handleValidation(req, res)) return;

  const { email, password } = req.body;
  const user = db.findUserByEmail(email);

  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: 'Cuenta desactivada. Contacta con soporte.' });
  }

  if (user.twoFactorEnabled) {
    const tempToken = jwt.sign(
      { id: user.id, twoFactorPending: true },
      JWT_SECRET,
      { expiresIn: '5m' }
    );
    return res.json({ twoFactorRequired: true, tempToken });
  }

  const token = signToken({ id: user.id, role: user.role });
  res.json({ token, user: safeUser(user) });
});

// ── POST /google ──────────────────────────────────────────────────────────────
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'credential es obligatorio' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email, name, picture } = ticket.getPayload();

    let user = db.findUserByGoogleId(googleId) || db.findUserByEmail(email);

    if (!user) {
      user = db.createUser({
        id: `usr_${crypto.randomBytes(4).toString('hex')}`,
        name,
        email,
        passwordHash: null,
        role: 'agent',
        twoFactorSecret: null,
        twoFactorEnabled: false,
        googleId,
        picture,
        resetToken: null,
        resetTokenExpiry: null,
        isActive: true,
        createdAt: new Date(),
      });
    } else {
      db.updateUser(user.id, { googleId, picture });
      user = db.findUserById(user.id);
    }

    const token = signToken({ id: user.id, role: user.role });
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    res.status(401).json({ error: 'Token de Google inválido', detail: err.message });
  }
});

// ── POST /forgot-password ─────────────────────────────────────────────────────
router.post('/forgot-password', forgotLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
], async (req, res) => {
  if (!handleValidation(req, res)) return;

  const { email } = req.body;
  const GENERIC_RESPONSE = { message: 'Si el email existe, recibirás un correo de recuperación.' };

  const user = db.findUserByEmail(email);
  if (!user) return res.json(GENERIC_RESPONSE); // No revelar si el email existe

  const resetToken = crypto.randomBytes(32).toString('hex');
  db.updateUser(user.id, {
    resetToken,
    resetTokenExpiry: Date.now() + 60 * 60 * 1000, // 1 hora
  });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  try {
    await sendPasswordReset(email, user.name, resetUrl);
  } catch (err) {
    console.error('Error enviando email:', err.message);
    // No devolver error al cliente — respuesta genérica por seguridad
  }

  res.json(GENERIC_RESPONSE);
});

// ── POST /reset-password ──────────────────────────────────────────────────────
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token requerido'),
  body('newPassword').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
], async (req, res) => {
  if (!handleValidation(req, res)) return;

  const { token, newPassword } = req.body;
  const user = db.findUserByResetToken(token);

  if (!user) {
    return res.status(400).json({ error: 'Token inválido o expirado' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  db.updateUser(user.id, { passwordHash, resetToken: null, resetTokenExpiry: null });

  res.json({ message: 'Contraseña actualizada correctamente' });
});

// ── POST /2fa/setup ───────────────────────────────────────────────────────────
router.post('/2fa/setup', authenticate, async (req, res) => {
  const user = db.findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const secret = speakeasy.generateSecret({
    name: `TicketCRM (${user.email})`,
    length: 20,
  });

  // Guardar secreto temporalmente (no activo hasta /2fa/verify)
  db.updateUser(user.id, { twoFactorSecret: secret.base32 });

  const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);
  res.json({ secret: secret.base32, qrCode: qrCodeDataUrl });
});

// ── POST /2fa/verify — confirma y activa el 2FA ───────────────────────────────
router.post('/2fa/verify', authenticate, (req, res) => {
  const { token: totpToken } = req.body;
  if (!totpToken) return res.status(400).json({ error: 'token es obligatorio' });

  const user = db.findUserById(req.user.id);
  if (!user || !user.twoFactorSecret) {
    return res.status(400).json({ error: 'Primero llama a /2fa/setup' });
  }

  const valid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: totpToken,
    window: 1,
  });

  if (!valid) return res.status(401).json({ error: 'Código incorrecto' });

  db.updateUser(user.id, { twoFactorEnabled: true });
  res.json({ message: '2FA activado correctamente' });
});

// ── POST /2fa/authenticate — login step 2 ────────────────────────────────────
router.post('/2fa/authenticate', (req, res) => {
  const { tempToken, totpCode } = req.body;
  if (!tempToken || !totpCode) {
    return res.status(400).json({ error: 'tempToken y totpCode son obligatorios' });
  }

  let decoded;
  try {
    decoded = jwt.verify(tempToken, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Token temporal inválido o expirado' });
  }

  if (!decoded.twoFactorPending) {
    return res.status(400).json({ error: 'Token no válido para 2FA' });
  }

  const user = db.findUserById(decoded.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const valid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: totpCode,
    window: 1,
  });

  if (!valid) return res.status(401).json({ error: 'Código 2FA incorrecto' });

  const token = signToken({ id: user.id, role: user.role });
  res.json({ token, user: safeUser(user) });
});

// ── POST /2fa/disable ─────────────────────────────────────────────────────────
router.post('/2fa/disable', authenticate, (req, res) => {
  const { totpCode } = req.body;
  const user = db.findUserById(req.user.id);
  if (!user || !user.twoFactorEnabled) {
    return res.status(400).json({ error: '2FA no está activo en esta cuenta' });
  }

  const valid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: totpCode,
    window: 1,
  });

  if (!valid) return res.status(401).json({ error: 'Código incorrecto' });

  db.updateUser(user.id, { twoFactorEnabled: false, twoFactorSecret: null });
  res.json({ message: '2FA desactivado' });
});

// ── GET /me ───────────────────────────────────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  const user = db.findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(safeUser(user));
});

module.exports = router;
