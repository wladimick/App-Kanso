import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const menuItems = [
  { view: 'home', label: 'Inicio', icon: '⌂' },
  { view: 'library', label: 'Mi biblioteca', icon: '▦' },
  { view: 'wishlist', label: 'Lista de deseos', icon: '♡' },
  { view: 'watching', label: 'Viendo', icon: '▶' },
  { view: 'completed', label: 'Completados', icon: '✓' },
  { view: 'favorites', label: 'Favoritos', icon: '★' },
  { view: 'collections', label: 'Colecciones', icon: '▣' },
  { view: 'releases', label: 'Estrenos', icon: '◷' },
  { view: 'marvel', label: 'Marvel', icon: '✦' },
  { view: 'discover', label: 'Descubrir', icon: '⌕' },
] as const

type ViewKey = typeof menuItems[number]['view']

function currentView(): ViewKey {
  const value = new URLSearchParams(window.location.search).get('view')
  return menuItems.some((item) => item.view === value) ? value as ViewKey : 'home'
}

export function MobileMenu() {
  const { session } = useAuth()
  const [open, setOpen] = useState(false)
  const [activeView, setActiveView] = useState<ViewKey>(() => currentView())
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    const sync = () => { setActiveView(currentView()); setOpen(false) }
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('mobile-menu-open', open)
    return () => document.body.classList.remove('mobile-menu-open')
  }, [open])

  const navigate = (view: ViewKey) => {
    const url = new URL(window.location.href)
    if (view === 'home') url.searchParams.delete('view')
    else url.searchParams.set('view', view)
    url.searchParams.delete('focus')
    window.history.pushState({}, '', url)
    window.dispatchEvent(new PopStateEvent('popstate'))
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setOpen(false)
  }

  const signOut = async () => {
    if (!supabase || signingOut) return
    setSigningOut(true)
    await supabase.auth.signOut()
    setSigningOut(false)
    setOpen(false)
  }

  return (
    <>
      <button type="button" className="mobile-menu-trigger" aria-label="Abrir menú" aria-expanded={open} onClick={() => setOpen(true)}><span /><span /><span /></button>
      {open && (
        <div className="mobile-menu-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
          <aside className="mobile-menu-drawer" role="dialog" aria-modal="true" aria-label="Menú principal">
            <header className="mobile-menu-header">
              <div className="mobile-menu-brand"><span className="mobile-menu-mark">K</span><div><strong>Kanso</strong><small>Tu universo, ordenado.</small></div></div>
              <button type="button" className="mobile-menu-close" onClick={() => setOpen(false)} aria-label="Cerrar menú">×</button>
            </header>
            <nav className="mobile-menu-nav" aria-label="Navegación móvil completa">
              {menuItems.map((item) => (
                <button key={item.view} type="button" className={activeView === item.view ? 'mobile-menu-item active' : 'mobile-menu-item'} onClick={() => navigate(item.view)}>
                  <span className="mobile-menu-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span><b aria-hidden="true">›</b>
                </button>
              ))}
            </nav>
            <footer className="mobile-menu-account">
              <span>Tu cuenta</span><strong>{session?.user.email ?? 'Usuario Kanso'}</strong>
              <button type="button" className="mobile-menu-signout" onClick={() => void signOut()} disabled={!session || signingOut}>{signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}</button>
            </footer>
          </aside>
        </div>
      )}
    </>
  )
}
