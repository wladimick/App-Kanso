import { useEffect, useState } from 'react'

function isDiscoverView() {
  return new URLSearchParams(window.location.search).get('view') === 'discover'
}

export function FloatingSearchButton() {
  const [hidden, setHidden] = useState(() => isDiscoverView())

  useEffect(() => {
    const sync = () => setHidden(isDiscoverView())
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  const openDiscover = () => {
    const url = new URL(window.location.href)
    url.searchParams.set('view', 'discover')
    url.searchParams.delete('universe')
    url.searchParams.delete('focus')
    window.history.pushState({}, '', url)
    window.dispatchEvent(new PopStateEvent('popstate'))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (hidden) return null

  return (
    <button type="button" className="floating-search-trigger" onClick={openDiscover} aria-label="Abrir búsqueda rápida" title="Descubrir">
      <span aria-hidden="true">⌕</span>
    </button>
  )
}
