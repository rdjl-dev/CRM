/**
 * TicketCRM — Base de datos en memoria
 * En producción: sustituir por Prisma + PostgreSQL
 *
 * Desarrollado por: Raúl de Jesús Larios
 */

const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// ── Usuarios ──────────────────────────────────────────────────────────────────
const users = [];

// Seed inicial (admin por defecto)
const seedAdmin = () => {
  const hash = bcrypt.hashSync('Admin1234!', 12);
  users.push({
    id: 'usr_admin_001',
    name: 'Raúl de Jesús Larios',
    email: 'admin@ticketcrm.com',
    passwordHash: hash,
    role: 'admin',
    twoFactorSecret: null,
    twoFactorEnabled: false,
    googleId: null,
    picture: null,
    resetToken: null,
    resetTokenExpiry: null,
    isActive: true,
    createdAt: new Date('2025-01-01'),
  });
  users.push({
    id: 'usr_agent_001',
    name: 'Laura Martínez',
    email: 'laura@ticketcrm.com',
    passwordHash: bcrypt.hashSync('Agent1234!', 12),
    role: 'agent',
    twoFactorSecret: null,
    twoFactorEnabled: false,
    googleId: null,
    picture: null,
    resetToken: null,
    resetTokenExpiry: null,
    isActive: true,
    createdAt: new Date('2025-01-15'),
  });
};
seedAdmin();

// ── Clientes ──────────────────────────────────────────────────────────────────
const customers = [
  { id: 'cus_001', name: 'Acme Corp', email: 'soporte@acme.com', phone: '+34 910 000 001', plan: 'enterprise', health: 'at_risk', notes: 'Cliente VIP. SLA 4h.', createdAt: new Date('2024-06-01') },
  { id: 'cus_002', name: 'TechStart SL', email: 'admin@techstart.es', phone: '+34 910 000 002', plan: 'pro', health: 'healthy', notes: '', createdAt: new Date('2024-08-15') },
  { id: 'cus_003', name: 'GlobalMedia', email: 'it@globalmedia.com', phone: '+34 910 000 003', plan: 'basic', health: 'healthy', notes: '', createdAt: new Date('2024-09-01') },
  { id: 'cus_004', name: 'NovaSoft', email: 'help@novasoft.io', phone: '+34 910 000 004', plan: 'pro', health: 'healthy', notes: '', createdAt: new Date('2024-11-20') },
  { id: 'cus_005', name: 'RetailGroup', email: 'tech@retail.es', phone: '+34 910 000 005', plan: 'enterprise', health: 'at_risk', notes: 'Revisión mensual pendiente.', createdAt: new Date('2025-01-10') },
];

// ── Tickets ───────────────────────────────────────────────────────────────────
const tickets = [
  { id: 'tkt_001', title: 'Error en módulo de pagos', description: 'El checkout falla intermitentemente con tarjetas VISA. Los usuarios reciben un error 500 al intentar finalizar la compra. Se reproduce en producción con tarjetas VISA, no con Mastercard.', status: 'open', priority: 'critical', category: 'bug', assigneeId: 'usr_agent_001', customerId: 'cus_001', tags: ['pagos', 'frontend', 'urgente'], slaHours: 4, slaBreached: true, createdAt: new Date('2025-05-10T09:00:00'), updatedAt: new Date('2025-05-15T14:00:00') },
  { id: 'tkt_002', title: 'Solicitud exportación a Excel', description: 'El cliente necesita poder exportar el histórico de pedidos a formato XLSX. Actualmente solo está disponible CSV.', status: 'in_progress', priority: 'medium', category: 'feature', assigneeId: 'usr_agent_001', customerId: 'cus_002', tags: ['exportación', 'reporting'], slaHours: 72, slaBreached: false, createdAt: new Date('2025-05-12T10:30:00'), updatedAt: new Date('2025-05-14T11:00:00') },
  { id: 'tkt_003', title: 'Actualizar documentación API v2', description: 'Faltan los endpoints /v2/orders y /v2/returns en la documentación de Swagger. El equipo de integraciones lo ha reportado.', status: 'resolved', priority: 'low', category: 'task', assigneeId: 'usr_admin_001', customerId: 'cus_003', tags: ['docs', 'api'], slaHours: 120, slaBreached: false, createdAt: new Date('2025-05-08T08:00:00'), updatedAt: new Date('2025-05-13T16:00:00') },
  { id: 'tkt_004', title: 'Falla login con SSO de Google', description: 'Desde la actualización del 14/05 el flujo de SSO con Google redirige a una pantalla en blanco. Afecta a todos los usuarios con cuenta Google.', status: 'open', priority: 'high', category: 'bug', assigneeId: 'usr_agent_001', customerId: 'cus_001', tags: ['auth', 'sso', 'google'], slaHours: 8, slaBreached: true, createdAt: new Date('2025-05-14T07:00:00'), updatedAt: new Date('2025-05-14T18:00:00') },
  { id: 'tkt_005', title: 'Integrar Stripe webhooks', description: 'Necesitamos recibir los eventos payment_intent.succeeded y charge.refunded para actualizar el estado de los pedidos automáticamente.', status: 'in_progress', priority: 'high', category: 'feature', assigneeId: 'usr_admin_001', customerId: 'cus_002', tags: ['pagos', 'backend', 'stripe'], slaHours: 48, slaBreached: false, createdAt: new Date('2025-05-13T11:00:00'), updatedAt: new Date('2025-05-16T09:00:00') },
  { id: 'tkt_006', title: 'Dashboard lento en dispositivos móviles', description: 'El panel de analítica tarda más de 8 segundos en cargar en móvil. Se han identificado 3 queries N+1 en el endpoint /stats.', status: 'open', priority: 'medium', category: 'bug', assigneeId: 'usr_agent_001', customerId: 'cus_003', tags: ['performance', 'mobile', 'api'], slaHours: 48, slaBreached: false, createdAt: new Date('2025-05-15T14:00:00'), updatedAt: new Date('2025-05-15T14:00:00') },
  { id: 'tkt_007', title: 'Módulo de reportes avanzados', description: 'El cliente requiere reportes personalizables con filtros por fecha, agente y categoría, exportables en PDF y XLSX.', status: 'open', priority: 'low', category: 'feature', assigneeId: 'usr_admin_001', customerId: 'cus_004', tags: ['reportes', 'pdf'], slaHours: 168, slaBreached: false, createdAt: new Date('2025-05-11T09:00:00'), updatedAt: new Date('2025-05-11T09:00:00') },
  { id: 'tkt_008', title: 'Migración base de datos a PostgreSQL', description: 'Migración completa de SQLite a PostgreSQL para producción. Incluye script de migración y validación de datos.', status: 'resolved', priority: 'critical', category: 'task', assigneeId: 'usr_admin_001', customerId: 'cus_004', tags: ['db', 'devops', 'migracion'], slaHours: 24, slaBreached: false, createdAt: new Date('2025-05-09T08:00:00'), updatedAt: new Date('2025-05-10T20:00:00') },
  { id: 'tkt_009', title: 'Configurar alertas de SLA por email', description: 'Enviar notificación automática al agente asignado 1 hora antes de que venza el SLA de un ticket crítico.', status: 'in_progress', priority: 'high', category: 'feature', assigneeId: 'usr_admin_001', customerId: 'cus_005', tags: ['sla', 'email', 'automatizacion'], slaHours: 48, slaBreached: false, createdAt: new Date('2025-05-16T10:00:00'), updatedAt: new Date('2025-05-17T08:00:00') },
  { id: 'tkt_010', title: 'Página 404 con diseño incorrecto', description: 'La página de error 404 muestra el layout sin estilos desde la última actualización del build.', status: 'resolved', priority: 'low', category: 'bug', assigneeId: 'usr_agent_001', customerId: 'cus_005', tags: ['ui', 'frontend'], slaHours: 72, slaBreached: false, createdAt: new Date('2025-05-07T12:00:00'), updatedAt: new Date('2025-05-08T10:00:00') },
];

// ── Comentarios de tickets ────────────────────────────────────────────────────
const comments = [
  { id: 'cmt_001', ticketId: 'tkt_001', authorId: 'usr_agent_001', content: 'Revisando los logs. El error ocurre al llamar al endpoint de Stripe. Posible problema con la clave API.', createdAt: new Date('2025-05-10T11:00:00') },
  { id: 'cmt_002', ticketId: 'tkt_001', authorId: 'usr_admin_001', content: 'Confirmado. La clave de Stripe en producción expiró ayer. Regenerando y desplegando.', createdAt: new Date('2025-05-15T14:00:00') },
  { id: 'cmt_003', ticketId: 'tkt_004', authorId: 'usr_agent_001', content: 'El problema está en el callback de Google OAuth. El redirect_uri no coincide con el registrado en Google Cloud Console.', createdAt: new Date('2025-05-14T10:00:00') },
];

// ── Persistencia ligera en JSON ──────────────────────────────────────────────
const USE_PERSISTENCE = process.env.NODE_ENV !== 'test';
const DATA_FILE = process.env.DB_FILE || path.join(
  process.env.DATA_DIR || path.join(__dirname, '..', 'data'),
  'db.json'
);

const dateFields = {
  users: ['createdAt', 'resetTokenExpiry'],
  tickets: ['createdAt', 'updatedAt', 'slaDeadline'],
  customers: ['createdAt'],
  comments: ['createdAt'],
};

const reviveRecord = (record, fields = []) => {
  if (!record || typeof record !== 'object') return record;
  const output = { ...record };
  for (const field of fields) {
    if (output[field]) {
      output[field] = new Date(output[field]);
    }
  }
  return output;
};

const reviveCollections = (state) => ({
  users: (state.users || []).map((item) => reviveRecord(item, dateFields.users)),
  tickets: (state.tickets || []).map((item) => reviveRecord(item, dateFields.tickets)),
  customers: (state.customers || []).map((item) => reviveRecord(item, dateFields.customers)),
  comments: (state.comments || []).map((item) => reviveRecord(item, dateFields.comments)),
});

const persistState = () => {
  if (!USE_PERSISTENCE) return;
  const dir = path.dirname(DATA_FILE);
  fs.mkdirSync(dir, { recursive: true });
  const payload = { users, tickets, customers, comments };
  fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf8');
};

const loadState = () => {
  if (!USE_PERSISTENCE) return false;
  if (!fs.existsSync(DATA_FILE)) return false;

  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const loaded = reviveCollections(parsed);

    users.splice(0, users.length, ...loaded.users);
    tickets.splice(0, tickets.length, ...loaded.tickets);
    customers.splice(0, customers.length, ...loaded.customers);
    comments.splice(0, comments.length, ...loaded.comments);

    return true;
  } catch (err) {
    console.warn('[DB] No se pudo cargar la persistencia JSON, se usará el seed inicial.', err.message);
    return false;
  }
};

const initializeDb = () => {
  if (!USE_PERSISTENCE) return;
  const loaded = loadState();
  if (!loaded) persistState();
};

initializeDb();

// ── Helpers de acceso ─────────────────────────────────────────────────────────
const db = {
  users,
  tickets,
  customers,
  comments,

  // Users
  findUserById: (id) => users.find(u => u.id === id),
  findUserByEmail: (email) => (email ? users.find(u => u.email.toLowerCase() === email.toLowerCase()) : undefined),
  findUserByGoogleId: (googleId) => users.find(u => u.googleId === googleId),
  findUserByResetToken: (token) => users.find(u => u.resetToken === token && u.resetTokenExpiry && u.resetTokenExpiry > Date.now()),
  createUser: (data) => { users.push(data); persistState(); return data; },
  updateUser: (id, updates) => {
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates };
    persistState();
    return users[idx];
  },

  // Tickets
  findTicketById: (id) => tickets.find(t => t.id === id),
  createTicket: (data) => { tickets.push(data); persistState(); return data; },
  updateTicket: (id, updates) => {
    const idx = tickets.findIndex(t => t.id === id);
    if (idx === -1) return null;
    tickets[idx] = { ...tickets[idx], ...updates, updatedAt: new Date() };
    persistState();
    return tickets[idx];
  },
  deleteTicket: (id) => {
    const idx = tickets.findIndex(t => t.id === id);
    if (idx === -1) return false;
    tickets.splice(idx, 1);
    persistState();
    return true;
  },

  // Customers
  findCustomerById: (id) => customers.find(c => c.id === id),

  // Comments
  getTicketComments: (ticketId) => comments.filter(c => c.ticketId === ticketId),
  addComment: (data) => { comments.push(data); persistState(); return data; },
};

module.exports = db;
