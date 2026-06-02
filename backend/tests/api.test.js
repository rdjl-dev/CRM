/**
 * TicketCRM — Tests de integración
 * Desarrollado por: Raúl de Jesús Larios
 */

process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV   = 'test';

const request = require('supertest');
const app     = require('../src/index');

let authToken = '';
let createdTicketId = '';

describe('Auth', () => {
  it('POST /api/v1/auth/register — crea usuario', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test User', email: `test_${Date.now()}@example.com`, password: 'Test1234!'
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    authToken = res.body.token;
  });

  it('POST /api/v1/auth/login — credenciales correctas', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@ticketcrm.com', password: 'Admin1234!'
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    authToken = res.body.token;
  });

  it('POST /api/v1/auth/login — credenciales incorrectas → 401', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@ticketcrm.com', password: 'wrong'
    });
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/auth/me — devuelve usuario autenticado', async () => {
    const res = await request(app).get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('email');
  });

  it('GET /api/v1/auth/me — sin token → 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('Tickets', () => {
  it('GET /api/v1/tickets — devuelve lista paginada', async () => {
    const res = await request(app).get('/api/v1/tickets')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('meta');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/v1/tickets?status=open — filtra por estado', async () => {
    const res = await request(app).get('/api/v1/tickets?status=open')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    res.body.data.forEach(t => expect(t.status).toBe('open'));
  });

  it('POST /api/v1/tickets — crea ticket', async () => {
    const res = await request(app).post('/api/v1/tickets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Test ticket', description: 'Descripción de prueba', priority: 'low' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    createdTicketId = res.body.id;
  });

  it('GET /api/v1/tickets/:id — detalle de ticket', async () => {
    const res = await request(app).get(`/api/v1/tickets/${createdTicketId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Test ticket');
  });

  it('PATCH /api/v1/tickets/:id — actualiza estado', async () => {
    const res = await request(app).patch(`/api/v1/tickets/${createdTicketId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'in_progress' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_progress');
  });
});

describe('Stats', () => {
  it('GET /api/v1/stats — devuelve KPIs', async () => {
    const res = await request(app).get('/api/v1/stats')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('byStatus');
  });
});

describe('Health', () => {
  it('GET /health — ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
