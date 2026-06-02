/**
 * TicketCRM — Ruta de estadísticas / analítica
 * Desarrollado por: Raúl de Jesús Larios
 */

const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const db = require('../models/db');

router.get('/', authenticate, (req, res) => {
  const tickets = db.tickets;

  const byStatus = tickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const byPriority = tickets.reduce((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, {});

  const byCategory = tickets.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});

  const slaBreached = tickets.filter(t => t.slaBreached).length;
  const resolved    = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');

  // Tiempo medio de resolución (días)
  const avgResolutionDays = resolved.length > 0
    ? (resolved.reduce((sum, t) => sum + (t.updatedAt - t.createdAt), 0) / resolved.length / 86400000).toFixed(1)
    : null;

  res.json({
    total: tickets.length,
    byStatus,
    byPriority,
    byCategory,
    slaBreached,
    slaBreachedRate: tickets.length > 0 ? ((slaBreached / tickets.length) * 100).toFixed(1) : '0',
    avgResolutionDays: avgResolutionDays ? parseFloat(avgResolutionDays) : null,
    totalCustomers: db.customers.length,
    customersAtRisk: db.customers.filter(c => c.health === 'at_risk').length,
  });
});

module.exports = router;
