import { useEffect, useState } from 'react'

const items = [
  { view: 'home', label: 'Inicio', icon: '⌂' },
  { view: 'library', label: 'Biblioteca', icon: '▦' },
  { view: 'discover', label: 'Agregar', icon: '+' },
  { view: 'marvel', label: 'Marvel', icon: '✦' },
  { view: 'discover', label: 'Buscar', icon: '⌕' },
] as const

type ViewKey = 'home' | 'library' | 'marvel' | 'discover'

function getView(): ViewKey {
  const value = new URLSearchParams(window.location.search).get('view')
  if (value === 'library' || value === 'marvel' || value === 'discover') return value
  return 'home'
}

export function MobileTabBar() {
  const [active, setActive] = useState<ViewKey>(() => getView())

  useEffect(() => {
    const sync = () => setActive(getView())
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  const navigate = (view: ViewKey, focusSearch = false) => {
    const url = new URL(window.location.href)
    if (view === 'home') url.searchParams.delete('view')
    else url.searchParams.set('view', view)
    if (focusSearch) url.searchParams.set('focus', 'search')
    else url.searchParams.delete('focus')
    window.history.pushState({}, '', url)
    window.dispatchEvent(new PopStateEvent('popstate'))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <nav className="mobile-tabbar" aria-label="Navegación principal móvil">
      {items.map((item, index) => {
        const isAdd = index === 2
        const isSearch = index === 4
        const isActive = active === item.view && (!isSearch || new URLSearchParams(window.location.search).get('focus') === 'search')
        return (
          <button
            key={`${item.label}-${index}`}
            type="button"
            className={`${isAdd ? 'mobile-tabbar-item add' : 'mobile-tabbar-item'}${isActive ? ' active' : ''}`}
            onClick={() => navigate(item.view, isSearch)}
            aria-label={item.label}
          >
            <span aria-hidden="true">{item.icon}</span>
            <small>{item.label}</small>
          </button>
        )
      })}
    </nav>
  )
}
