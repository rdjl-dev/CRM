/**
 * TicketCRM — Páginas de autenticación
 * Login · Register · 2FA · ForgotPassword · ResetPassword
 *
 * Desarrollado por: Raúl de Jesús Larios
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { authAPI } from '../utils/api'

// ── Estilos ────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');

  .auth-root {
    min-height: 100vh;
    background: #0F172A;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    font-family: 'Sora', system-ui, sans-serif;
    position: relative;
    overflow: hidden;
  }
  .auth-root::before {
    content: '';
    position: absolute;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(29,106,222,.18) 0%, transparent 70%);
    top: -200px; right: -200px;
    pointer-events: none;
  }
  .auth-root::after {
    content: '';
    position: absolute;
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(124,58,237,.12) 0%, transparent 70%);
    bottom: -100px; left: -100px;
    pointer-events: none;
  }
  .auth-card {
    width: 100%;
    max-width: 420px;
    position: relative;
    z-index: 1;
  }
  .auth-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 32px;
  }
  .auth-logo-icon {
    width: 40px; height: 40px;
    background: linear-gradient(135deg, #1D6ADE, #7C3AED);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
  }
  .auth-logo-text {
    font-size: 18px; font-weight: 700;
    color: #F1F5F9; letter-spacing: -.4px;
  }
  .auth-box {
    background: rgba(30,41,59,.85);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 20px;
    padding: 32px;
    backdrop-filter: blur(16px);
    box-shadow: 0 24px 64px rgba(0,0,0,.4);
  }
  .auth-title {
    font-size: 22px; font-weight: 700;
    color: #F1F5F9; margin-bottom: 4px; text-align: center;
  }
  .auth-sub {
    font-size: 13px; color: #64748B;
    text-align: center; margin-bottom: 28px;
  }
  .auth-label {
    display: block;
    font-size: 11px; font-weight: 600;
    color: #94A3B8; text-transform: uppercase;
    letter-spacing: .5px; margin-bottom: 6px;
  }
  .auth-input {
    width: 100%;
    padding: 11px 14px;
    background: rgba(15,23,42,.8);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 10px;
    color: #F1F5F9;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    transition: border-color .2s;
    margin-bottom: 16px;
  }
  .auth-input:focus { border-color: #1D6ADE; }
  .auth-input::placeholder { color: #475569; }
  .auth-btn {
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    border: none;
    font-size: 14px; font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: all .2s;
  }
  .auth-btn-primary {
    background: linear-gradient(135deg, #1D6ADE, #2563EB);
    color: #fff;
    box-shadow: 0 4px 16px rgba(29,106,222,.3);
  }
  .auth-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(29,106,222,.4); }
  .auth-btn-primary:disabled { opacity: .5; cursor: not-allowed; transform: none; }
  .auth-btn-secondary {
    background: rgba(255,255,255,.05);
    border: 1px solid rgba(255,255,255,.1) !important;
    color: #94A3B8;
    border: none;
  }
  .auth-btn-secondary:hover { background: rgba(255,255,255,.08); color: #F1F5F9; }
  .auth-btn-google {
    display: flex; align-items: center; justify-content: center; gap: 10px;
    background: #fff; color: #374151;
    font-weight: 600;
  }
  .auth-btn-google:hover { background: #F9FAFB; }
  .auth-sep {
    display: flex; align-items: center; gap: 12px;
    margin: 16px 0;
  }
  .auth-sep hr { flex: 1; border: none; border-top: 1px solid rgba(255,255,255,.08); }
  .auth-sep span { font-size: 11px; color: #475569; }
  .auth-err {
    background: rgba(220,38,38,.1);
    border: 1px solid rgba(220,38,38,.3);
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 12px;
    color: #FCA5A5;
    margin-bottom: 14px;
  }
  .auth-ok {
    background: rgba(5,150,105,.1);
    border: 1px solid rgba(5,150,105,.3);
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 12px;
    color: #6EE7B7;
    margin-bottom: 14px;
  }
  .auth-link {
    color: #60A5FA; background: none; border: none;
    cursor: pointer; font-size: 12px; font-family: inherit;
    text-decoration: underline; padding: 0;
  }
  .auth-credit {
    text-align: center; margin-top: 24px;
    font-size: 11px; color: #334155;
  }
  .auth-credit strong { color: #475569; }
  .otp-grid {
    display: flex; gap: 8px; justify-content: center; margin-bottom: 20px;
  }
  .otp-box {
    width: 46px; height: 56px;
    text-align: center; font-size: 24px; font-weight: 700;
    border-radius: 10px;
    border: 2px solid rgba(255,255,255,.1);
    background: rgba(15,23,42,.8);
    color: #F1F5F9;
    outline: none;
    font-family: 'JetBrains Mono', monospace;
    transition: border-color .15s;
  }
  .otp-box:focus { border-color: #1D6ADE; }
  .otp-box.filled { border-color: rgba(29,106,222,.5); }
`

function StyleTag() {
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}

function AuthLayout({ title, sub, children }) {
  return (
    <div className="auth-root">
      <StyleTag />
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🎫</div>
          <span className="auth-logo-text">TicketCRM</span>
        </div>
        <div className="auth-box">
          <div className="auth-title">{title}</div>
          <div className="auth-sub">{sub}</div>
          {children}
        </div>
        <div className="auth-credit">
          Desarrollado por <strong>Raúl de Jesús Larios</strong>
        </div>
      </div>
    </div>
  )
}

// ── LoginPage ─────────────────────────────────────────────────────────────────
export function LoginPage() {
  const navigate = useNavigate()
  const { login, loginWithGoogle, loading, error } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localErr, setLocalErr] = useState('')
  const [pending2FA, setPending2FA] = useState(null)

  // Inicializar Google Sign-In
  useEffect(() => {
    if (!window.google) return
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      callback: async ({ credential }) => {
        const res = await loginWithGoogle(credential)
        if (res.success) navigate('/dashboard')
      },
    })
    window.google.accounts.id.renderButton(
      document.getElementById('google-btn'),
      { theme: 'outline', size: 'large', width: 356, text: 'continue_with' }
    )
  }, [])

  const handleLogin = async (e) => {
    e?.preventDefault()
    setLocalErr('')
    const res = await login(email, password)
    if (res.twoFactorRequired) {
      setPending2FA(res.tempToken)
    } else if (res.success) {
      navigate('/dashboard')
    }
  }

  if (pending2FA) {
    return <TwoFactorPage tempToken={pending2FA} onBack={() => setPending2FA(null)} />
  }

  return (
    <AuthLayout title="Iniciar sesión" sub="Bienvenido de nuevo">
      {(localErr || error) && <div className="auth-err">{localErr || error}</div>}

      <label className="auth-label">Correo electrónico</label>
      <input className="auth-input" type="email" placeholder="tu@empresa.com"
        value={email} onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleLogin()} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <label className="auth-label" style={{ marginBottom: 0 }}>Contraseña</label>
        <Link to="/forgot-password" style={{ fontSize: 12, color: '#60A5FA', textDecoration: 'none' }}>
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
      <input className="auth-input" type="password" placeholder="••••••••"
        value={password} onChange={e => setPassword(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleLogin()} />

      <button className="auth-btn auth-btn-primary" style={{ marginBottom: 12 }}
        onClick={handleLogin} disabled={loading}>
        {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
      </button>

      <div className="auth-sep"><hr /><span>o</span><hr /></div>

      {/* Google Sign-In button renderizado por Google */}
      <div id="google-btn" style={{ marginBottom: 16 }}></div>

      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <span style={{ fontSize: 13, color: '#64748B' }}>¿No tienes cuenta? </span>
        <Link to="/register" style={{ fontSize: 13, color: '#60A5FA', textDecoration: 'none', fontWeight: 600 }}>
          Regístrate
        </Link>
      </div>
    </AuthLayout>
  )
}

// ── TwoFactorPage ─────────────────────────────────────────────────────────────
export function TwoFactorPage({ tempToken, onBack }) {
  const navigate = useNavigate()
  const { verify2FA, loading } = useAuthStore()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [err, setErr] = useState('')
  const refs = Array.from({ length: 6 }, () => useRef(null))

  useEffect(() => { refs[0].current?.focus() }, [])

  const handleInput = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...code]
    next[i] = val
    setCode(next)
    if (val && i < 5) refs[i + 1].current?.focus()
    if (next.every(c => c) && val) handleVerify(next.join(''))
  }

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      refs[i - 1].current?.focus()
    }
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setCode(pasted.split(''))
      handleVerify(pasted)
    }
  }

  const handleVerify = async (codeStr) => {
    setErr('')
    const res = await verify2FA(tempToken, codeStr || code.join(''))
    if (res.success) navigate('/dashboard')
    else { setErr(res.error); setCode(['', '', '', '', '', '']); refs[0].current?.focus() }
  }

  const complete = code.every(c => c)

  return (
    <AuthLayout title="Verificación en dos pasos" sub="Introduce el código de Google Authenticator">
      {err && <div className="auth-err">{err}</div>}

      <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.7, marginBottom: 20, textAlign: 'center' }}>
        Abre <strong style={{ color: '#94A3B8' }}>Google Authenticator</strong> en tu móvil y escribe el código de 6 dígitos para <strong style={{ color: '#94A3B8' }}>TicketCRM</strong>.
      </div>

      <div className="otp-grid" onPaste={handlePaste}>
        {code.map((c, i) => (
          <input key={i} ref={refs[i]}
            className={`otp-box ${c ? 'filled' : ''}`}
            type="text" inputMode="numeric" maxLength={1}
            value={c}
            onChange={e => handleInput(i, e.target.value)}
            onKeyDown={e => handleKey(i, e)} />
        ))}
      </div>

      <button className="auth-btn auth-btn-primary" style={{ marginBottom: 10 }}
        onClick={() => handleVerify()} disabled={loading || !complete}>
        {loading ? 'Verificando...' : 'Verificar código'}
      </button>
      <button className="auth-btn auth-btn-secondary" onClick={onBack}>
        ← Volver
      </button>
    </AuthLayout>
  )
}

// ── RegisterPage ──────────────────────────────────────────────────────────────
export function RegisterPage() {
  const navigate = useNavigate()
  const { register, loading, error } = useAuthStore()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [localErr, setLocalErr] = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async () => {
    setLocalErr('')
    if (!form.name || !form.email || !form.password) return setLocalErr('Rellena todos los campos')
    if (form.password !== form.confirm) return setLocalErr('Las contraseñas no coinciden')
    if (form.password.length < 8) return setLocalErr('La contraseña debe tener al menos 8 caracteres')
    const res = await register(form.name, form.email, form.password)
    if (res.success) navigate('/dashboard')
  }

  return (
    <AuthLayout title="Crear cuenta" sub="Empieza a gestionar tus tickets hoy">
      {(localErr || error) && <div className="auth-err">{localErr || error}</div>}

      <label className="auth-label">Nombre completo</label>
      <input className="auth-input" type="text" placeholder="Tu nombre"
        value={form.name} onChange={set('name')} />

      <label className="auth-label">Correo electrónico</label>
      <input className="auth-input" type="email" placeholder="tu@empresa.com"
        value={form.email} onChange={set('email')} />

      <label className="auth-label">Contraseña</label>
      <input className="auth-input" type="password" placeholder="Mínimo 8 caracteres"
        value={form.password} onChange={set('password')} />

      <label className="auth-label">Confirmar contraseña</label>
      <input className="auth-input" type="password" placeholder="Repite la contraseña"
        value={form.confirm} onChange={set('confirm')}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()} />

      <button className="auth-btn auth-btn-primary" style={{ marginBottom: 12 }}
        onClick={handleSubmit} disabled={loading}>
        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>

      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: 13, color: '#64748B' }}>¿Ya tienes cuenta? </span>
        <Link to="/login" style={{ fontSize: 13, color: '#60A5FA', textDecoration: 'none', fontWeight: 600 }}>
          Inicia sesión
        </Link>
      </div>
    </AuthLayout>
  )
}

// ── ForgotPasswordPage ────────────────────────────────────────────────────────
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')

  const handleSubmit = async () => {
    if (!email) return setErr('Introduce tu email')
    setErr(''); setLoading(true)
    try {
      await authAPI.forgotPassword(email)
      setSent(true)
    } catch {
      setErr('Error al enviar el correo. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Correo enviado" sub="Revisa tu bandeja de Gmail">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
          <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.7, marginBottom: 24 }}>
            Si <strong style={{ color: '#CBD5E1' }}>{email}</strong> está registrado, recibirás un enlace de recuperación en tu bandeja de Gmail. El enlace expira en <strong style={{ color: '#CBD5E1' }}>1 hora</strong>.
          </p>
          <Link to="/login">
            <button className="auth-btn auth-btn-secondary">← Volver al inicio de sesión</button>
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Recuperar contraseña" sub="Te enviaremos un enlace a tu Gmail">
      {err && <div className="auth-err">{err}</div>}
      <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.7, marginBottom: 20 }}>
        Introduce el correo electrónico de tu cuenta y te enviaremos instrucciones para restablecer tu contraseña.
      </p>

      <label className="auth-label">Correo electrónico</label>
      <input className="auth-input" type="email" placeholder="tu@empresa.com"
        value={email} onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()} />

      <button className="auth-btn auth-btn-primary" style={{ marginBottom: 12 }}
        onClick={handleSubmit} disabled={loading || !email}>
        {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
      </button>
      <Link to="/login">
        <button className="auth-btn auth-btn-secondary">← Volver</button>
      </Link>
    </AuthLayout>
  )
}

// ── ResetPasswordPage ─────────────────────────────────────────────────────────
export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState(false)

  useEffect(() => {
    if (!token) navigate('/login')
  }, [token])

  const handleSubmit = async () => {
    if (password.length < 8) return setErr('La contraseña debe tener al menos 8 caracteres')
    if (password !== confirm) return setErr('Las contraseñas no coinciden')
    setErr(''); setLoading(true)
    try {
      await authAPI.resetPassword({ token, newPassword: password })
      setOk(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (e) {
      setErr(e.response?.data?.error || 'Token inválido o expirado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Nueva contraseña" sub="Elige una contraseña segura">
      {err && <div className="auth-err">{err}</div>}
      {ok && <div className="auth-ok">✓ Contraseña actualizada. Redirigiendo al login...</div>}

      <label className="auth-label">Nueva contraseña</label>
      <input className="auth-input" type="password" placeholder="Mínimo 8 caracteres"
        value={password} onChange={e => setPassword(e.target.value)} />

      <label className="auth-label">Confirmar contraseña</label>
      <input className="auth-input" type="password" placeholder="Repite la contraseña"
        value={confirm} onChange={e => setConfirm(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()} />

      <button className="auth-btn auth-btn-primary"
        onClick={handleSubmit} disabled={loading || ok}>
        {loading ? 'Guardando...' : 'Actualizar contraseña'}
      </button>
    </AuthLayout>
  )
}
