import { useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import './AuthPanel.css'

export function AuthPanel() {
  const { session, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const client = supabase

  if (!isSupabaseConfigured || !client) {
    return <div className="auth-state offline">Supabase pendiente</div>
  }

  if (loading) {
    return <div className="auth-state">Comprobando sesión…</div>
  }

  if (session) {
    return (
      <div className="auth-session">
        <div>
          <small>Sesión activa</small>
          <strong>{session.user.email ?? 'Usuario Kanso'}</strong>
        </div>
        <button type="button" onClick={() => void client.auth.signOut()}>Salir</button>
      </div>
    )
  }

  const sendMagicLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = email.trim()
    if (!normalizedEmail) return

    setSubmitting(true)
    setMessage('')

    const { error } = await client.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: window.location.origin,
        shouldCreateUser: true,
      },
    })

    setSubmitting(false)
    setMessage(error ? error.message : 'Te enviamos un enlace de acceso a tu correo.')
  }

  return (
    <form className="auth-form" onSubmit={sendMagicLink}>
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="tu@email.com"
        aria-label="Correo para iniciar sesión"
      />
      <button type="submit" disabled={submitting}>{submitting ? 'Enviando…' : 'Entrar'}</button>
      {message && <small>{message}</small>}
    </form>
  )
}
