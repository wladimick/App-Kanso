import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../hooks/useAuth'
import { useLibrary } from '../hooks/useLibrary'
import { fetchUpcomingReleases, type ReleaseFilter } from '../services/releases'
import type { TmdbSearchResult } from '../services/tmdb'

function isReleasesView() {
  return new URLSearchParams(window.location.search).get('view') === 'releases'
}

function daysUntil(date: string | null) {
  if (!date) return null
  const target = new Date(`${date}T12:00:00`)
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

function releaseLabel(date: string | null) {
  const days = daysUntil(date)
  if (days == null) return 'Fecha por confirmar'
  if (days === 0) return 'Estrena hoy'
  if (days === 1) return 'Estrena mañana'
  if (days > 1 && days <= 7) return `Estrena en ${days} días`
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' }).format(new Date(`${date}T12:00:00`))
}

export function ReleasesRoute() {
  const { session } = useAuth()
  const { rows, addItem } = useLibrary(session?.user.id)
  const [active, setActive] = useState(() => isReleasesView())
  const [items, setItems] = useState<TmdbSearchResult[]>([])
  const [filter, setFilter] = useState<ReleaseFilter>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarTarget, setSidebarTarget] = useState<Element | null>(null)

  useEffect(() => {
    const sync = () => setActive(isReleasesView())
    window.addEventListener('popstate', sync)
    setSidebarTarget(document.querySelector('.sidebar .nav-list'))
    return () => window.removeEventListener('popstate', sync)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('releases-view-active', active)
    return () => document.body.classList.remove('releases-view-active')
  }, [active])

  useEffect(() => {
    if (!active || !session) return
    setLoading(true)
    setError(null)
    void fetchUpcomingReleases(filter)
      .then(setItems)
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'No pudimos cargar los estrenos.'))
      .finally(() => setLoading(false))
  }, [active, filter, session])

  const existing = useMemo(() => new Set(rows.map((row) => `${row.source}:${row.external_id}`)), [rows])

  const navigate = () => {
    const url = new URL(window.location.href)
    url.searchParams.set('view', 'releases')
    url.searchParams.delete('focus')
    window.history.pushState({}, '', url)
    window.dispatchEvent(new PopStateEvent('popstate'))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const add = async (item: TmdbSearchResult) => {
    if (!session) return
    await addItem({
      source: 'tmdb', externalId: item.externalId, mediaType: item.mediaType,
      title: item.title, originalTitle: item.originalTitle, posterUrl: item.posterUrl,
      releaseYear: item.releaseYear, status: 'planned',
    })
  }

  return (
    <>
      {sidebarTarget && createPortal(
        <div className="nav-group-start releases-sidebar-entry">
          <span className="nav-section-label">Actualidad</span>
          <button className={active ? 'nav-item active' : 'nav-item'} type="button" onClick={navigate}><span>Estrenos</span><b>◷</b></button>
        </div>, sidebarTarget,
      )}
      {active && (
        <section className="releases-page" aria-label="Próximos estrenos">
          <header className="releases-hero">
            <span className="eyebrow">Calendario Kanso</span>
            <h1>Estrenos</h1>
            <p>Películas y series próximas a estrenarse. Agrégalas a tu lista con un toque y Kanso las tendrá presentes.</p>
            <div className="releases-tabs">
              {([['all','Para ti'],['movie','Películas'],['series','Series']] as const).map(([value,label]) => (
                <button key={value} type="button" className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}</button>
              ))}
            </div>
          </header>

          {!session && <div className="release-message"><strong>Inicia sesión para consultar estrenos.</strong></div>}
          {error && <div className="release-message error"><strong>No pudimos cargar los estrenos.</strong><span>{error}</span></div>}
          {loading && <div className="release-message">Buscando próximos estrenos…</div>}

          <div className="release-grid">
            {items.map((item) => {
              const added = existing.has(`tmdb:${item.externalId}`)
              return (
                <article className="release-card" key={`${item.mediaType}:${item.externalId}`}>
                  <div className="release-poster">
                    {item.posterUrl ? <img src={item.posterUrl} alt={`Poster de ${item.title}`} loading="lazy" /> : <span>{item.title.slice(0,1)}</span>}
                    <b>{releaseLabel(item.releaseDate)}</b>
                  </div>
                  <div className="release-copy">
                    <small>{item.mediaType === 'movie' ? 'Película' : 'Serie'} · {item.releaseYear ?? '—'}</small>
                    <h2>{item.title}</h2>
                    <p>{item.overview || 'Sin descripción disponible en español.'}</p>
                    <button type="button" disabled={!session || added} onClick={() => void add(item)}>{added ? '✓ En tu biblioteca' : '+ Agregar'}</button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}
    </>
  )
}
