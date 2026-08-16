import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../hooks/useAuth'
import { fetchUpcomingReleases } from '../services/releases'
import type { TmdbSearchResult } from '../services/tmdb'

function isHome() {
  const view = new URLSearchParams(window.location.search).get('view')
  return !view || view === 'home'
}

function label(date: string | null) {
  if (!date) return 'Próximamente'
  const target = new Date(`${date}T12:00:00`)
  const today = new Date(); today.setHours(12,0,0,0)
  const days = Math.ceil((target.getTime() - today.getTime()) / 86400000)
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Mañana'
  if (days > 1 && days <= 7) return `En ${days} días`
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' }).format(target)
}

export function UpcomingHomeRail() {
  const { session } = useAuth()
  const [active, setActive] = useState(() => isHome())
  const [target, setTarget] = useState<Element | null>(null)
  const [items, setItems] = useState<TmdbSearchResult[]>([])

  useEffect(() => {
    const sync = () => { setActive(isHome()); setTarget(document.querySelector('.app-shell > .content')) }
    sync()
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  useEffect(() => {
    if (!active || !session || items.length > 0) return
    void fetchUpcomingReleases('all').then((results) => setItems(results.slice(0, 6))).catch(() => setItems([]))
  }, [active, items.length, session])

  const openReleases = () => {
    const url = new URL(window.location.href)
    url.searchParams.set('view', 'releases')
    url.searchParams.delete('focus')
    window.history.pushState({}, '', url)
    window.dispatchEvent(new PopStateEvent('popstate'))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!active || !session || !target || items.length === 0) return null

  return createPortal(
    <section className="section-block upcoming-home-section">
      <div className="section-heading"><div><p className="eyebrow">Calendario</p><h2>Próximamente</h2></div><button className="text-action" type="button" onClick={openReleases}>Ver estrenos →</button></div>
      <div className="upcoming-home-strip">
        {items.map((item) => (
          <button type="button" className="upcoming-home-card" key={`${item.mediaType}:${item.externalId}`} onClick={openReleases}>
            <div>{item.posterUrl ? <img src={item.posterUrl} alt={`Poster de ${item.title}`} loading="lazy" /> : <span>{item.title.slice(0,1)}</span>}<b>{label(item.releaseDate)}</b></div>
            <strong>{item.title}</strong><small>{item.mediaType === 'movie' ? 'Película' : 'Serie'}</small>
          </button>
        ))}
      </div>
    </section>, target,
  )
}
