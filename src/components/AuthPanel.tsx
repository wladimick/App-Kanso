import { useEffect, useState } from 'react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import './AuthPanel.css'

type AuthMode = 'login' | 'signup' | 'forgot' | 'recovery'
type Feedback = { kind: 'error' | 'success' | 'info'; text: string } | null

type AuthPanelProps = {
  session: Session | null
  loading: boolean
  authEvent?: AuthChangeEvent | null
  full?: boolean
}

function friendlyAuthError(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (normalized.includes('email not confirmed')) return 'Tu correo aún no está confirmado.'
  if (normalized.includes('user already registered')) return 'Ya existe una cuenta con este correo.'
  if (normalized.includes('password should be')) return 'La contraseña no cumple los requisitos de seguridad.'
  if (normalized.includes('rate limit')) return 'Se alcanzó temporalmente el límite de intentos. Espera un momento y vuelve a probar.'
  return message
}

export function AuthPanel({ session, loading, authEvent = null, full = false }: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [submitting, setSubmitting] = useState(false)
  const client = supabase

  useEffect(() => {
    if (authEvent === 'PASSWORD_RECOVERY') {
      setMode('recovery')
      setFeedback({ kind: 'info', text: 'Crea una contraseña nueva para conservar esta misma cuenta y biblioteca.' })
      setPassword('')
      setConfirmPassword('')
    }
  }, [authEvent])

  const changeMode = (next: AuthMode) => {
    setMode(next)
    setFeedback(null)
    setPassword('')
    setConfirmPassword('')
  }

  if (!isSupabaseConfigured || !client) {
    return full ? (
      <div className="auth-screen">
        <section className="auth-card auth-unavailable">
          <div className="auth-brand"><span>K</span><div><strong>Kanso</strong><small>Tu universo, ordenado.</small></div></div>
          <h1>Supabase no está configurado</h1>
          <p>Faltan las variables públicas necesarias para iniciar sesión.</p>
        </section>
      </div>
    ) : <div className="auth-state offline">Supabase pendiente</div>
  }

  if (loading) {
    return full ? (
      <div className="auth-screen">
        <section className="auth-card auth-loading-card">
          <div className="auth-brand"><span>K</span><div><strong>Kanso</strong><small>Tu universo, ordenado.</small></div></div>
          <p>Comprobando tu sesión…</p>
        </section>
      </div>
    ) : <div className="auth-state">Comprobando sesión…</div>
  }

  if (session && mode !== 'recovery') {
    const displayName = typeof session.user.user_metadata?.display_name === 'string'
      ? session.user.user_metadata.display_name
      : null

    return (
      <div className="auth-session">
        <div>
          <small>{displayName ? 'Sesión activa' : 'Tu cuenta'}</small>
          <strong>{displayName ?? session.user.email ?? 'Usuario Kanso'}</strong>
          {displayName && session.user.email && <span>{session.user.email}</span>}
        </div>
        <button type="button" onClick={() => void client.auth.signOut()}>Salir</button>
      </div>
    )
  }

  const submitLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || !password) return

    setSubmitting(true)
    setFeedback(null)

    const { error } = await client.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    setSubmitting(false)
    if (error) setFeedback({ kind: 'error', text: friendlyAuthError(error.message) })
  }

  const submitSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedName = name.trim()

    if (!normalizedName || !normalizedEmail || !password || !confirmPassword) {
      setFeedback({ kind: 'error', text: 'Completa todos los campos para crear tu cuenta.' })
      return
    }
    if (password.length < 8) {
      setFeedback({ kind: 'error', text: 'Usa una contraseña de al menos 8 caracteres.' })
      return
    }
    if (password !== confirmPassword) {
      setFeedback({ kind: 'error', text: 'Las contraseñas no coinciden.' })
      return
    }

    setSubmitting(true)
    setFeedback(null)

    const { data, error } = await client.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: normalizedName },
      },
    })

    setSubmitting(false)

    if (error) {
      setFeedback({ kind: 'error', text: friendlyAuthError(error.message) })
      return
    }

    if (data.session) {
      setFeedback({ kind: 'success', text: 'Cuenta creada. Entrando a Kanso…' })
      return
    }

    setFeedback({
      kind: 'success',
      text: 'Cuenta creada. La configuración actual de Supabase requiere confirmar el correo una vez antes de entrar.',
    })
  }

  const submitForgot = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setFeedback({ kind: 'error', text: 'Escribe el correo de tu cuenta.' })
      return
    }

    setSubmitting(true)
    setFeedback(null)

    const { error } = await client.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: window.location.origin,
    })

    setSubmitting(false)
    setFeedback(error
      ? { kind: 'error', text: friendlyAuthError(error.message) }
      : { kind: 'success', text: 'Te enviamos un correo para establecer una contraseña nueva.' })
  }

  const submitRecovery = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (password.length < 8) {
      setFeedback({ kind: 'error', text: 'Usa una contraseña de al menos 8 caracteres.' })
      return
    }
    if (password !== confirmPassword) {
      setFeedback({ kind: 'error', text: 'Las contraseñas no coinciden.' })
      return
    }

    setSubmitting(true)
    setFeedback(null)
    const { error } = await client.auth.updateUser({ password })

    if (error) {
      setSubmitting(false)
      setFeedback({ kind: 'error', text: friendlyAuthError(error.message) })
      return
    }

    await client.auth.signOut()
    setSubmitting(false)
    setMode('login')
    setPassword('')
    setConfirmPassword('')
    window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}`)
    setFeedback({ kind: 'success', text: 'Contraseña actualizada. Ya puedes iniciar sesión normalmente.' })
  }

  const isRecovery = mode === 'recovery'
  const title = mode === 'signup'
    ? 'Crea tu universo'
    : mode === 'forgot'
      ? 'Recupera tu acceso'
      : isRecovery
        ? 'Nueva contraseña'
        : 'Bienvenido a Kanso'
  const description = mode === 'signup'
    ? 'Tu biblioteca, progreso y favoritos quedarán vinculados a tu propia cuenta.'
    : mode === 'forgot'
      ? 'Te enviaremos un enlace de recuperación. Solo lo necesitas cuando olvides tu contraseña.'
      : isRecovery
        ? 'Esta contraseña quedará asociada a tu usuario actual sin cambiar tu biblioteca.'
        : 'Inicia sesión y continúa exactamente donde quedaste.'

  return (
    <div className={full ? 'auth-screen' : 'auth-screen auth-screen-embedded'}>
      <section className="auth-card">
        <div className="auth-brand">
          <span>K</span>
          <div><strong>Kanso</strong><small>Tu universo, ordenado.</small></div>
        </div>

        {!isRecovery && mode !== 'forgot' && (
          <div className="auth-tabs" role="tablist" aria-label="Acceso a Kanso">
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => changeMode('login')}>Iniciar sesión</button>
            <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => changeMode('signup')}>Crear cuenta</button>
          </div>
        )}

        <div className="auth-heading">
          <p className="eyebrow">Cuenta Kanso</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        {mode === 'login' && (
          <form className="auth-password-form" onSubmit={submitLogin}>
            <label><span>Correo</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@email.com" required /></label>
            <label><span>Contraseña</span><div className="password-field"><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Tu contraseña" required /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Ocultar' : 'Ver'}</button></div></label>
            <button className="auth-primary" type="submit" disabled={submitting}>{submitting ? 'Entrando…' : 'Entrar a Kanso'}</button>
            <button className="auth-link" type="button" onClick={() => changeMode('forgot')}>Olvidé mi contraseña / venía de Magic Link</button>
          </form>
        )}

        {mode === 'signup' && (
          <form className="auth-password-form" onSubmit={submitSignup}>
            <label><span>Nombre</span><input type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Tu nombre" required /></label>
            <label><span>Correo</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@email.com" required /></label>
            <label><span>Contraseña</span><div className="password-field"><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 8 caracteres" minLength={8} required /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Ocultar' : 'Ver'}</button></div></label>
            <label><span>Repetir contraseña</span><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repite tu contraseña" minLength={8} required /></label>
            <button className="auth-primary" type="submit" disabled={submitting}>{submitting ? 'Creando cuenta…' : 'Crear mi cuenta'}</button>
          </form>
        )}

        {mode === 'forgot' && (
          <form className="auth-password-form" onSubmit={submitForgot}>
            <label><span>Correo</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@email.com" required /></label>
            <button className="auth-primary" type="submit" disabled={submitting}>{submitting ? 'Enviando…' : 'Recuperar contraseña'}</button>
            <button className="auth-link" type="button" onClick={() => changeMode('login')}>← Volver a iniciar sesión</button>
          </form>
        )}

        {mode === 'recovery' && (
          <form className="auth-password-form" onSubmit={submitRecovery}>
            <label><span>Nueva contraseña</span><div className="password-field"><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 8 caracteres" minLength={8} required /><button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Ocultar' : 'Ver'}</button></div></label>
            <label><span>Repetir contraseña</span><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repite tu contraseña" minLength={8} required /></label>
            <button className="auth-primary" type="submit" disabled={submitting}>{submitting ? 'Guardando…' : 'Guardar nueva contraseña'}</button>
          </form>
        )}

        {feedback && <div className={`auth-feedback ${feedback.kind}`} role={feedback.kind === 'error' ? 'alert' : 'status'}>{feedback.text}</div>}

        {!isRecovery && mode !== 'forgot' && <p className="auth-footnote">La sesión queda guardada en este dispositivo hasta que cierres sesión.</p>}
      </section>
    </div>
  )
}
