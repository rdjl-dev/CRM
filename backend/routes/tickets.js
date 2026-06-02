/**
 * TicketCRM — Rutas de Tickets
 * GET    /api/v1/tickets          — Listar con filtros y paginación
 * POST   /api/v1/tickets          — Crear
 * GET    /api/v1/tickets/:id      — Detalle
 * PATCH  /api/v1/tickets/:id      — Actualizar
 * DELETE /api/v1/tickets/:id      — Eliminar (admin)
 * GET    /api/v1/tickets/:id/comments  — Comentarios
 * POST   /api/v1/tickets/:id/comments  — Añadir comentario
 *
 * Desarrollado por: Raúl de Jesús Larios
 */

const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const { body, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const db = require('../models/db');

const VALID_STATUSES   = ['open', 'in_progress', 'resolved', 'closed'];
const VALID_PRIORITIES = ['critical', 'high', 'medium', 'low'];
const VALID_CATEGORIES = ['bug', 'feature', 'task', 'question'];

// ── Helpers ───────────────────────────────────────────────────────────────────
const paginate = (array, page, limit) => {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const start = (p - 1) * l;
  return {
    data: array.slice(start, start + l),
    meta: { total: array.length, page: p, limit: l, pages: Math.ceil(array.length / l) },
  };
};

const applyFilters = (tickets, query) => {
  let result = [...tickets];
  if (query.status)     result = result.filter(t => t.status === query.status);
  if (query.priority)   result = result.filter(t => t.priority === query.priority);
  if (query.category)   result = result.filter(t => t.category === query.category);
  if (query.assigneeId) result = result.filter(t => t.assigneeId === query.assigneeId);
  if (query.customerId) result = result.filter(t => t.customerId === query.customerId);
  if (query.slaBreached === 'true') result = result.filter(t => t.slaBreached);
  if (query.q) {
    const q = query.q.toLowerCase();
    result = result.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
  }
  return result;
};

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: errors.array()[0].msg });
    return false;
  }
  return true;
};

// ── GET /tickets ──────────────────────────────────────────────────────────────
router.get('/', authenticate, (req, res) => {
  const { page, limit, sortBy = 'createdAt', order = 'desc', ...filters } = req.query;

  let result = applyFilters(db.tickets, filters);

  // Ordenar
  const dir = order === 'asc' ? 1 : -1;
  result.sort((a, b) => {
    const va = a[sortBy], vb = b[sortBy];
    if (va instanceof Date && vb instanceof Date) return dir * (va - vb);
    if (typeof va === 'string') return dir * va.localeCompare(vb);
    return dir * (va - vb);
  });

  res.json(paginate(result, page, limit));
});

// ── POST /tickets ─────────────────────────────────────────────────────────────
router.post('/', authenticate, [
  body('title').trim().notEmpty().withMessage('El título es obligatorio'),
  body('description').trim().notEmpty().withMessage('La descripción es obligatoria'),
  body('priority').optional().isIn(VALID_PRIORITIES).withMessage('Prioridad inválida'),
  body('category').optional().isIn(VALID_CATEGORIES).withMessage('Categoría inválida'),
], (req, res) => {
  if (!handleValidation(req, res)) return;

  const { title, description, priority = 'medium', category = 'task', customerId, assigneeId, tags = [], slaHours = 72 } = req.body;

  const slaMs = slaHours * 60 * 60 * 1000;
  const ticket = db.createTicket({
    id: `tkt_${crypto.randomBytes(5).toString('hex')}`,
    title, description, priority, category,
    status: 'open',
    customerId: customerId || null,
    assigneeId: assigneeId || req.user.id,
    tags,
    slaHours,
    slaBreached: false,
    slaDeadline: new Date(Date.now() + slaMs),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  res.status(201).json(ticket);
});

// ── GET /tickets/:id ──────────────────────────────────────────────────────────
router.get('/:id', authenticate, (req, res) => {
  const ticket = db.findTicketById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

  const comments = db.getTicketComments(ticket.id);
  const customer = ticket.customerId ? db.findCustomerById(ticket.customerId) : null;
  const assignee = ticket.assigneeId ? db.findUserById(ticket.assigneeId) : null;

  res.json({
    ...ticket,
    comments,
    customer: customer ? { id: customer.id, name: customer.name, email: customer.email } : null,
    assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email } : null,
  });
});

// ── PATCH /tickets/:id ────────────────────────────────────────────────────────
router.patch('/:id', authenticate, [
  body('status').optional().isIn(VALID_STATUSES).withMessage('Estado inválido'),
  body('priority').optional().isIn(VALID_PRIORITIES).withMessage('Prioridad inválida'),
  body('category').optional().isIn(VALID_CATEGORIES).withMessage('Categoría inválida'),
], (req, res) => {
  if (!handleValidation(req, res)) return;

  const ticket = db.findTicketById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

  const ALLOWED = ['title', 'description', 'status', 'priority', 'category', 'assigneeId', 'tags', 'slaBreached'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => ALLOWED.includes(k)));

  const updated = db.updateTicket(ticket.id, updates);
  res.json(updated);
});

// ── DELETE /tickets/:id ───────────────────────────────────────────────────────
router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  const ok = db.deleteTicket(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Ticket no encontrado' });
  res.status(204).send();
});

// ── GET /tickets/:id/comments ─────────────────────────────────────────────────
router.get('/:id/comments', authenticate, (req, res) => {
  const ticket = db.findTicketById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
  res.json(db.getTicketComments(ticket.id));
});

// ── POST /tickets/:id/comments ────────────────────────────────────────────────
router.post('/:id/comments', authenticate, [
  body('content').trim().notEmpty().withMessage('El contenido es obligatorio'),
], (req, res) => {
  if (!handleValidation(req, res)) return;

  const ticket = db.findTicketById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

  const comment = db.addComment({
    id: `cmt_${crypto.randomBytes(4).toString('hex')}`,
    ticketId: ticket.id,
    authorId: req.user.id,
    content: req.body.content,
    createdAt: new Date(),
  });

  res.status(201).json(comment);
});

module.exports = router;
