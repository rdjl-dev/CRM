/**
 * TicketCRM — Rutas de Clientes
 * Desarrollado por: Raúl de Jesús Larios
 */

const express = require('express');
const router  = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const db = require('../models/db');

const paginate = (array, page, limit) => {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const start = (p - 1) * l;
  return {
    data: array.slice(start, start + l),
    meta: { total: array.length, page: p, limit: l, pages: Math.ceil(array.length / l) },
  };
};

router.get('/', authenticate, (req, res) => {
  const { page, limit, q, plan, health } = req.query;
  let result = [...db.customers];
  if (q)      result = result.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || c.email.toLowerCase().includes(q.toLowerCase()));
  if (plan)   result = result.filter(c => c.plan === plan);
  if (health) result = result.filter(c => c.health === health);
  res.json(paginate(result, page, limit));
});

router.get('/:id', authenticate, (req, res) => {
  const customer = db.findCustomerById(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Cliente no encontrado' });
  const tickets = db.tickets.filter(t => t.customerId === customer.id);
  res.json({ ...customer, tickets, ticketCount: tickets.length });
});

module.exports = router;
