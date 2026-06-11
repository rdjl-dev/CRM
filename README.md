# TicketCRM

**SaaS de gestión de tickets e incidencias con CRM integrado.**  
Desarrollado por **Raúl de Jesús Larios**.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Node.js 18+, Express 4, JWT, bcryptjs |
| Autenticación | JWT · Google OAuth 2.0 · 2FA TOTP (speakeasy) |
| Email | Nodemailer + Gmail App Password |
| Frontend | React 18, Vite, React Router v6, Zustand |
| Base de datos | SQLite (desarrollo) → PostgreSQL (producción) vía Prisma |
| Tests | Jest + Supertest (backend) |
| Deploy | Render(backend) + Github Pages(frontend) |

---

## Funcionalidades

- ✅ Login con email/contraseña + sesión JWT
- ✅ Registro de usuarios
- ✅ Autenticación con Google (OAuth 2.0)
- ✅ Autenticación en dos pasos (2FA TOTP — Google Authenticator)
- ✅ Recuperación de contraseña por email (Gmail)
- ✅ Panel de tickets con filtros, búsqueda y paginación
- ✅ CRM de clientes con health score
- ✅ KPIs en tiempo real
- ✅ SLA tracking con alertas visuales
- ✅ Analítica de tickets por estado y prioridad
- ✅ CRUD completo de tickets
- ✅ Roles: admin / agent / viewer
- ✅ API REST documentada

---

## Inicio rápido

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/ticketcrm.git
cd ticketcrm
```

### 2. Backend

```bash
cd backend
cp .env.example .env      # rellenar variables
npm install
npm run dev               # http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env      # rellenar variables
npm install
npm run dev               # http://localhost:5173
```

---

## Variables de entorno

Ver `backend/.env.example` y `frontend/.env.example` para la lista completa.

Las mínimas para funcionar en local:

```
# backend/.env
PORT=3001
JWT_SECRET=cualquier-cadena-larga
FRONTEND_URL=http://localhost:5173
```

---

## Subir a GitHub

```bash
# Desde la raíz del proyecto
git init
git add .
git commit -m "feat: initial commit — TicketCRM by Raúl de Jesús Larios"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/ticketcrm.git
git push -u origin main
```

---

## Deploy en producción

### Backend → render

### Frontend → Github Pages


---

*Desarrollado por Raúl de Jesús Larios*
