/**
 * TicketCRM — Dashboard principal
 * Desarrollado por: Raúl de Jesús Larios
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { ticketsAPI, customersAPI, statsAPI } from '../utils/api'

// ── Constantes ─────────────────────────────────────────────────────────────────
const STATUS_MAP = {
  open:        { label: 'Abierto',  color: '#3B82F6', bg: 'rgba(59,130,246,.15)', border: 'rgba(59,130,246,.3)' },
  in_progress: { label: 'En curso', color: '#A78BFA', bg: 'rgba(167,139,250,.15)', border: 'rgba(167,139,250,.3)' },
  resolved:    { label: 'Resuelto', color: '#34D399', bg: 'rgba(52,211,153,.15)', border: 'rgba(52,211,153,.3)' },
  closed:      { label: 'Cerrado',  color: '#6B7280', bg: 'rgba(107,114,128,.12)', border: 'rgba(107,114,128,.3)' },
}
const PRIORITY_MAP = {
  critical: { label: 'Crítica', color: '#F87171' },
  high:     { label: 'Alta',    color: '#FB923C' },
  medium:   { label: 'Media',   color: '#FBBF24' },
  low:      { label: 'Baja',    color: '#86EFAC' },
}

// ── Componentes UI ────────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.closed
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
      textTransform: 'uppercase', letterSpacing: '.4px', whiteSpace: 'nowrap',
    }}>{s.label}</span>
  )
}

const PriorityChip = ({ priority }) => {
  const p = PRIORITY_MAP[priority] || PRIORITY_MAP.low
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#94A3B8' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, flexShrink: 0, boxShadow: `0 0 6px ${p.color}` }} />
      {p.label}
    </span>
  )
}

const Tag = ({ label }) => (
  <span style={{
    fontSize: 10, padding: '2px 8px', borderRadius: 10,
    background: 'rgba(255,255,255,.06)', color: '#94A3B8',
    border: '1px solid rgba(255,255,255,.08)', fontWeight: 500,
  }}>{label}</span>
)

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{
    background: 'rgba(30,41,59,.7)',
    border: '1px solid rgba(255,255,255,.07)',
    borderRadius: 14, padding: '16px 18px',
    borderTop: `3px solid ${color}`,
    transition: 'transform .2s',
  }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
    <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: '#F1F5F9', lineHeight: 1 }}>{value ?? '—'}</div>
    {sub && <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>{sub}</div>}
  </div>
)

// ── Modal de ticket ───────────────────────────────────────────────────────────
function TicketModal({ ticket, onClose, onUpdate }) {
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    ticketsAPI.get(ticket.id).then(r => setDetail(r.data)).catch(console.error)
  }, [ticket.id])

  const handleStatusChange = async (status) => {
    await ticketsAPI.update(ticket.id, { status })
    onUpdate()
    onClose()
  }

  const handleComment = async () => {
    if (!comment.trim()) return
    setLoading(true)
    await ticketsAPI.addComment(ticket.id, comment)
    setComment('')
    const r = await ticketsAPI.get(ticket.id)
    setDetail(r.data)
    setLoading(false)
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#1E293B', border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 18, width: 560, maxWidth: '100%',
        maxHeight: '85vh', overflow: 'auto',
        boxShadow: '0 32px 80px rgba(0,0,0,.6)',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>{ticket.id}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {ticket.slaBreached && (
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 8, background: 'rgba(220,38,38,.15)', color: '#FCA5A5', border: '1px solid rgba(220,38,38,.3)' }}>
                ⚠ SLA incumplido
              </span>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
          </div>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#F1F5F9', marginBottom: 16, lineHeight: 1.4 }}>{ticket.title}</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              ['Estado', <Badge status={ticket.status} />],
              ['Prioridad', <PriorityChip priority={ticket.priority} />],
              ['Cliente', ticket.customer || detail?.customer?.name || '—'],
              ['Asignado a', detail?.assignee?.name || '—'],
              ['Creado', new Date(ticket.createdAt).toLocaleDateString('es-ES')],
              ['Categoría', ticket.category],
            ].map(([l, v]) => (
              <div key={l}>
                <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 4 }}>{l}</div>
                <div style={{ fontSize: 12.5, color: '#CBD5E1' }}>{v}</div>
              </div>
            ))}
          </div>

          {ticket.description && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 8 }}>Descripción</div>
              <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.7, background: 'rgba(15,23,42,.5)', borderRadius: 10, padding: 14 }}>
                {ticket.description}
              </p>
            </div>
          )}

          {ticket.tags?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 8 }}>Etiquetas</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ticket.tags.map(t => <Tag key={t} label={t} />)}
              </div>
            </div>
          )}

          {/* Cambiar estado */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 10 }}>Cambiar estado</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['open', 'in_progress', 'resolved', 'closed'].filter(s => s !== ticket.status).map(s => (
                <button key={s} onClick={() => handleStatusChange(s)} style={{
                  fontSize: 11, padding: '5px 12px', borderRadius: 8,
                  border: `1px solid ${STATUS_MAP[s].border}`,
                  background: STATUS_MAP[s].bg, color: STATUS_MAP[s].color,
                  cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
                }}>{STATUS_MAP[s].label}</button>
              ))}
            </div>
          </div>

          {/* Comentarios */}
          <div>
            <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 12 }}>
              Comentarios {detail?.comments?.length > 0 && `(${detail.comments.length})`}
            </div>
            {detail?.comments?.map(c => (
              <div key={c.id} style={{ background: 'rgba(15,23,42,.5)', borderRadius: 10, padding: 12, marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>
                  {new Date(c.createdAt).toLocaleString('es-ES')}
                </div>
                <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>{c.content}</p>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <input
                value={comment} onChange={e => setComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleComment()}
                placeholder="Añadir comentario..."
                style={{
                  flex: 1, padding: '9px 13px', borderRadius: 9,
                  border: '1px solid rgba(255,255,255,.1)',
                  background: 'rgba(15,23,42,.8)', color: '#F1F5F9',
                  fontSize: 13, outline: 'none', fontFamily: 'inherit',
                }} />
              <button onClick={handleComment} disabled={loading || !comment.trim()} style={{
                padding: '9px 16px', borderRadius: 9, border: 'none',
                background: '#1D6ADE', color: '#fff', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                opacity: loading || !comment.trim() ? .5 : 1,
              }}>Enviar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [view, setView] = useState('tickets')
  const [tickets, setTickets] = useState([])
  const [customers, setCustomers] = useState([])
  const [stats, setStats] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: '', priority: '', q: '' })
  const [creating, setCreating] = useState(false)
  const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'medium', category: 'bug' })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [tRes, cRes, sRes] = await Promise.all([
        ticketsAPI.list({}),
        customersAPI.list({}),
        statsAPI.get(),
      ])
      setTickets(tRes.data.data)
      setCustomers(cRes.data.data)
      setStats(sRes.data)
    } catch (err) {
      if (err.response?.status === 401) { logout(); navigate('/login') }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleCreateTicket = async () => {
    if (!newTicket.title || !newTicket.description) return
    await ticketsAPI.create(newTicket)
    setCreating(false)
    setNewTicket({ title: '', description: '', priority: 'medium', category: 'bug' })
    loadData()
  }

  const handleLogout = () => { logout(); navigate('/login') }

  const filtered = tickets.filter(t => {
    if (filters.status   && t.status   !== filters.status)   return false
    if (filters.priority && t.priority !== filters.priority) return false
    if (filters.q) {
      const q = filters.q.toLowerCase()
      if (!t.title.toLowerCase().includes(q) && !t.id.includes(q)) return false
    }
    return true
  })

  const toggleFilter = (k, v) => setFilters(f => ({ ...f, [k]: f[k] === v ? '' : v }))

  const sidebarStyle = {
    width: 220, background: '#0B1120',
    borderRight: '1px solid rgba(255,255,255,.06)',
    display: 'flex', flexDirection: 'column',
    fontFamily: "'Sora', system-ui, sans-serif",
    flexShrink: 0,
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0F172A', fontFamily: "'Sora', system-ui, sans-serif", overflow: 'hidden' }}>

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside style={sidebarStyle}>
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#1D6ADE,#7C3AED)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🎫</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', letterSpacing: '-.3px' }}>TicketCRM</div>
              <div style={{ fontSize: 10, color: '#334155' }}>v1.0.0 · Enterprise</div>
            </div>
          </div>
        </div>

        <nav style={{ padding: '12px 0', flex: 1 }}>
          {[
            ['tickets',   '🎫', 'Tickets'],
            ['customers', '👥', 'Clientes'],
            ['analytics', '📊', 'Analítica'],
            ['settings',  '⚙️', 'Ajustes'],
          ].map(([v, ic, lb]) => (
            <button key={v} onClick={() => setView(v)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 18px', border: 'none', width: '100%',
              textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 13, fontWeight: view === v ? 600 : 400,
              color: view === v ? '#F1F5F9' : '#475569',
              background: view === v ? 'rgba(29,106,222,.15)' : 'transparent',
              borderLeft: `3px solid ${view === v ? '#3B82F6' : 'transparent'}`,
              transition: 'all .15s',
            }}>
              <span style={{ fontSize: 16 }}>{ic}</span> {lb}
            </button>
          ))}
        </nav>

        <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>{user?.name?.[0] || 'U'}</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#F1F5F9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: '#334155' }}>{user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '7px', borderRadius: 8,
            border: '1px solid rgba(255,255,255,.07)',
            background: 'transparent', color: '#475569',
            fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,.1)'; e.currentTarget.style.color = '#FCA5A5' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569' }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          <KpiCard label="Total tickets" value={stats?.total}       sub="Este mes"          color="#3B82F6" />
          <KpiCard label="Abiertos"      value={stats?.byStatus?.open}     sub={`${stats ? Math.round((stats.byStatus.open||0)/stats.total*100) : 0}% del total`} color="#F59E0B" />
          <KpiCard label="En curso"      value={stats?.byStatus?.in_progress} sub="Activos"      color="#8B5CF6" />
          <KpiCard label="SLA breach"    value={stats?.slaBreached} sub="Requieren atención" color="#EF4444" />
          <KpiCard label="Resolución"    value={stats?.avgResolutionDays ? `${stats.avgResolutionDays}d` : '—'} sub="Promedio" color="#10B981" />
        </div>

        {/* ── Vista Tickets ──────────────────────────────────────────────── */}
        {view === 'tickets' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9' }}>
                Tickets
                <span style={{ fontSize: 13, fontWeight: 400, color: '#475569', marginLeft: 8 }}>
                  {loading ? '...' : `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`}
                </span>
              </div>
              <input
                placeholder="Buscar tickets..."
                value={filters.q}
                onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
                style={{
                  padding: '8px 14px', borderRadius: 9,
                  border: '1px solid rgba(255,255,255,.1)',
                  background: 'rgba(15,23,42,.8)', color: '#F1F5F9',
                  fontSize: 13, outline: 'none', width: 220, fontFamily: 'inherit',
                }} />
              <button onClick={() => setCreating(true)} style={{
                padding: '8px 18px', borderRadius: 9,
                background: 'linear-gradient(135deg,#1D6ADE,#2563EB)',
                color: '#fff', border: 'none', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 14px rgba(29,106,222,.3)',
              }}>+ Nuevo ticket</button>
            </div>

            {/* Filtros */}
            <div style={{ background: 'rgba(30,41,59,.6)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px', marginRight: 4 }}>Estado</span>
              {Object.entries(STATUS_MAP).map(([k, v]) => (
                <button key={k} onClick={() => toggleFilter('status', k)} style={{
                  fontSize: 11, padding: '4px 11px', borderRadius: 20,
                  border: `1px solid ${filters.status === k ? v.border : 'rgba(255,255,255,.08)'}`,
                  background: filters.status === k ? v.bg : 'transparent',
                  color: filters.status === k ? v.color : '#64748B',
                  cursor: 'pointer', fontWeight: filters.status === k ? 600 : 400, fontFamily: 'inherit',
                }}>{v.label}</button>
              ))}
              <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,.08)', margin: '0 4px' }} />
              <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px', marginRight: 4 }}>Prioridad</span>
              {Object.entries(PRIORITY_MAP).map(([k, v]) => (
                <button key={k} onClick={() => toggleFilter('priority', k)} style={{
                  fontSize: 11, padding: '4px 11px', borderRadius: 20,
                  border: `1px solid ${filters.priority === k ? v.color + '50' : 'rgba(255,255,255,.08)'}`,
                  background: filters.priority === k ? v.color + '18' : 'transparent',
                  color: filters.priority === k ? v.color : '#64748B',
                  cursor: 'pointer', fontWeight: filters.priority === k ? 600 : 400, fontFamily: 'inherit',
                }}>{v.label}</button>
              ))}
              {(filters.status || filters.priority || filters.q) && (
                <button onClick={() => setFilters({ status: '', priority: '', q: '' })} style={{
                  fontSize: 11, padding: '4px 11px', borderRadius: 20,
                  border: '1px solid rgba(255,255,255,.08)', background: 'transparent',
                  color: '#64748B', cursor: 'pointer', fontFamily: 'inherit', marginLeft: 4,
                }}>✕ Limpiar</button>
              )}
            </div>

            {/* Tabla */}
            <div style={{ background: 'rgba(30,41,59,.5)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                    {['Ticket', 'Estado', 'Prioridad', 'Asignado', 'Fecha', 'Etiquetas'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 10, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '.5px', background: 'rgba(15,23,42,.5)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#334155', fontSize: 13 }}>Cargando tickets...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#334155', fontSize: 13 }}>No hay tickets con los filtros actuales.</td></tr>
                  ) : filtered.map(t => (
                    <tr key={t.id} onClick={() => setSelected(t)}
                      style={{ borderBottom: '1px solid rgba(255,255,255,.04)', cursor: 'pointer', transition: 'background .1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {t.slaBreached && <span title="SLA incumplido" style={{ color: '#F87171', fontSize: 13 }}>⚠</span>}
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 12.5, color: '#E2E8F0' }}>{t.title}</div>
                            <div style={{ fontSize: 10, color: '#334155', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>{t.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '11px 16px' }}><Badge status={t.status} /></td>
                      <td style={{ padding: '11px 16px' }}><PriorityChip priority={t.priority} /></td>
                      <td style={{ padding: '11px 16px', fontSize: 11, color: '#475569' }}>—</td>
                      <td style={{ padding: '11px 16px', fontSize: 11, color: '#334155', whiteSpace: 'nowrap' }}>{new Date(t.createdAt).toLocaleDateString('es-ES')}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {(t.tags || []).slice(0, 3).map(tg => <Tag key={tg} label={tg} />)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Vista Clientes ─────────────────────────────────────────────── */}
        {view === 'customers' && (
          <>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', marginBottom: 18 }}>Clientes</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
              {loading ? <p style={{ color: '#475569' }}>Cargando...</p> : customers.map(c => (
                <div key={c.id} style={{
                  background: 'rgba(30,41,59,.6)', border: '1px solid rgba(255,255,255,.07)',
                  borderRadius: 14, padding: 20, transition: 'transform .2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#1D6ADE,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 16 }}>
                      {c.name[0]}
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
                      background: c.health === 'at_risk' ? 'rgba(220,38,38,.15)' : 'rgba(52,211,153,.12)',
                      color: c.health === 'at_risk' ? '#FCA5A5' : '#6EE7B7',
                      border: `1px solid ${c.health === 'at_risk' ? 'rgba(220,38,38,.3)' : 'rgba(52,211,153,.3)'}`,
                    }}>
                      {c.health === 'at_risk' ? 'En riesgo' : 'Saludable'}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#F1F5F9', marginBottom: 3 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#334155', marginBottom: 14 }}>{c.email}</div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                    <div><span style={{ color: '#334155' }}>Plan: </span><strong style={{ color: '#94A3B8' }}>{c.plan}</strong></div>
                    <div><span style={{ color: '#334155' }}>Tickets: </span><strong style={{ color: '#94A3B8' }}>{tickets.filter(t => t.customerId === c.id).length}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Vista Analítica ─────────────────────────────────────────────── */}
        {view === 'analytics' && stats && (
          <>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', marginBottom: 18 }}>Analítica</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                ['Por estado', Object.entries(STATUS_MAP).map(([k, v]) => [v.label, stats.byStatus?.[k] || 0, v.color])],
                ['Por prioridad', Object.entries(PRIORITY_MAP).map(([k, v]) => [v.label, stats.byPriority?.[k] || 0, v.color])],
                ['Por categoría', Object.entries(stats.byCategory || {}).map(([k, v]) => [k, v, '#60A5FA'])],
              ].map(([title, bars]) => (
                <div key={title} style={{ background: 'rgba(30,41,59,.6)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8', marginBottom: 18 }}>{title}</div>
                  {bars.map(([l, v, c]) => (
                    <div key={l} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                        <span style={{ color: '#64748B' }}>{l}</span>
                        <strong style={{ color: '#94A3B8' }}>{v}</strong>
                      </div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,.05)', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${stats.total > 0 ? Math.round(v / stats.total * 100) : 0}%`, background: c, borderRadius: 3, transition: 'width .6s ease', boxShadow: `0 0 8px ${c}60` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Vista Ajustes ───────────────────────────────────────────────── */}
        {view === 'settings' && (
          <>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', marginBottom: 18 }}>Ajustes de cuenta</div>
            <div style={{ background: 'rgba(30,41,59,.6)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: 24, maxWidth: 480 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8', marginBottom: 16 }}>Perfil</div>
              {[['Nombre', user?.name], ['Email', user?.email], ['Rol', user?.role]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: 13 }}>
                  <span style={{ color: '#475569' }}>{l}</span>
                  <span style={{ color: '#CBD5E1', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8', marginBottom: 12 }}>Autenticación en dos pasos</div>
                <p style={{ fontSize: 12, color: '#475569', marginBottom: 12, lineHeight: 1.6 }}>
                  Protege tu cuenta con Google Authenticator. Una vez activo, necesitarás un código TOTP en cada inicio de sesión.
                </p>
                {user?.twoFactorEnabled
                  ? <span style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, background: 'rgba(52,211,153,.12)', color: '#6EE7B7', border: '1px solid rgba(52,211,153,.3)' }}>✓ 2FA activo</span>
                  : <span style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, background: 'rgba(251,191,36,.1)', color: '#FCD34D', border: '1px solid rgba(251,191,36,.3)' }}>⚠ 2FA no activado — Actívalo desde la API: POST /api/v1/auth/2fa/setup</span>
                }
              </div>
            </div>
          </>
        )}

        {/* Footer crédito */}
        <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.05)', textAlign: 'center', fontSize: 11, color: '#1E293B' }}>
          TicketCRM · Desarrollado por <strong style={{ color: '#334155' }}>Raúl de Jesús Larios</strong>
        </div>
      </main>

      {/* ── Modal nuevo ticket ──────────────────────────────────────────────── */}
      {creating && (
        <div onClick={() => setCreating(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,.08)', borderRadius: 18, padding: 28, width: 480, maxWidth: '100%', boxShadow: '0 32px 80px rgba(0,0,0,.6)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', marginBottom: 20 }}>Nuevo ticket</div>
            {[
              ['Título', 'text', 'title', 'Resumen del problema...'],
              ['Descripción', 'text', 'description', 'Describe el problema en detalle...'],
            ].map(([l, t, k, ph]) => (
              <div key={k} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 6 }}>{l}</label>
                <input type={t} placeholder={ph} value={newTicket[k]}
                  onChange={e => setNewTicket(f => ({ ...f, [k]: e.target.value }))}
                  style={{ width: '100%', padding: '10px 13px', borderRadius: 9, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(15,23,42,.8)', color: '#F1F5F9', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              {[['Prioridad', 'priority', [['critical','Crítica'],['high','Alta'],['medium','Media'],['low','Baja']]],
                ['Categoría', 'category', [['bug','Bug'],['feature','Feature'],['task','Tarea'],['question','Consulta']]]
              ].map(([l, k, opts]) => (
                <div key={k}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 6 }}>{l}</label>
                  <select value={newTicket[k]} onChange={e => setNewTicket(f => ({ ...f, [k]: e.target.value }))}
                    style={{ width: '100%', padding: '10px 13px', borderRadius: 9, border: '1px solid rgba(255,255,255,.1)', background: '#1E293B', color: '#F1F5F9', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
                    {opts.map(([v, lb]) => <option key={v} value={v}>{lb}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleCreateTicket} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1D6ADE,#2563EB)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Crear ticket
              </button>
              <button onClick={() => setCreating(false)} style={{ padding: '11px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'transparent', color: '#64748B', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle ticket */}
      {selected && (
        <TicketModal ticket={selected} onClose={() => setSelected(null)} onUpdate={loadData} />
      )}
    </div>
  )
}
