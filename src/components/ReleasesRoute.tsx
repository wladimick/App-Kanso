import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../hooks/useAuth'
import { useLibrary } from '../hooks/useLibrary'
import {
  fetchActualityPage,
  type ActualityMode,
  type ReleaseFilter,
} from '../services/releases'
import type { TmdbSearchResult } from '../services/tmdb'

const PAGE_REVEAL = 12

function routeState() {
  const params = new URLSearchParams(window.location.search)
  return {
    active: params.get('view') === 'releases',
    mode: params.get('section') === 'top' ? 'trending' as const : 'upcoming' as const,
  }
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
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Mañana'
  if (days > 1 && days <= 7) return `En ${days} días`
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' })
    .format(new Date(`${date}T12:00:00`))
}

function dedupe(items: TmdbSearchResult[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${item.mediaType}:${item.externalId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function ReleasesRoute() {
  const { session } = useAuth()
  const { rows, addItem } = useLibrary(session?.user.id)
  const initial = routeState()
  const [active, setActive] = useState(initial.active)
  const [mode, setMode] = useState<ActualityMode>(initial.mode)
  const [items, setItems] = useState<TmdbSearchResult[]>([])
  const [filter, setFilter] = useState<ReleaseFilter>('all')
  const [page, setPage] = useState(1)
  const [visibleCount, setVisibleCount] = useState(PAGE_REVEAL)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [sidebarTarget, setSidebarTarget] = useState<Element | null>(null)
  const [contentTarget, setContentTarget] = useState<Element | null>(null)

  useEffect(() => {
    const sync = () => {
      const next = routeState()
      setActive(next.active)
      setMode(next.mode)
    }
    window.addEventListener('popstate', sync)
    setSidebarTarget(document.querySelector('.sidebar .nav-list'))
    setContentTarget(document.querySelector('.app-shell > .content'))
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
    setItems([])
    setPage(1)
    setVisibleCount(PAGE_REVEAL)
    void fetchActualityPage(mode, filter, 1)
      .then((response) => {
        setItems(dedupe(response.results))
        setHasMore(response.hasMore)
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'No pudimos cargar la actualidad.'))
      .finally(() => setLoading(false))
  }, [active, filter, mode, session, reloadKey])

  const existing = useMemo(
    () => new Set(rows.map((row) => `${row.source}:${row.external_id}`)),
    [rows],
  )

  const visibleItems = items.slice(0, visibleCount)
  const canLoadMore = visibleCount < items.length || hasMore

  const navigate = (nextMode: ActualityMode) => {
    const url = new URL(window.location.href)
    url.searchParams.set('view', 'releases')
    if (nextMode === 'trending') url.searchParams.set('section', 'top')
    else url.searchParams.delete('section')
    url.searchParams.delete('focus')
    window.history.pushState({}, '', url)
    window.dispatchEvent(new PopStateEvent('popstate'))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const switchMode = (nextMode: ActualityMode) => {
    if (nextMode === mode) return
    navigate(nextMode)
  }

  const add = async (item: TmdbSearchResult) => {
    if (!session) return
    await addItem({
      source: 'tmdb',
      externalId: item.externalId,
      mediaType: item.mediaType,
      title: item.title,
      originalTitle: item.originalTitle,
      posterUrl: item.posterUrl,
      releaseYear: item.releaseYear,
      status: 'planned',
    })
  }

  const loadMore = async () => {
    if (loadingMore) return

    if (visibleCount < items.length) {
      setVisibleCount((current) => Math.min(current + PAGE_REVEAL, items.length))
      return
    }

    if (!hasMore) return
    setLoadingMore(true)
    setError(null)
    try {
      const nextPage = page + 1
      const response = await fetchActualityPage(mode, filter, nextPage)
      setItems((current) => dedupe([...current, ...response.results]))
      setPage(nextPage)
      setHasMore(response.hasMore)
      setVisibleCount((current) => current + PAGE_REVEAL)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos cargar más títulos.')
    } finally {
      setLoadingMore(false)
    }
  }

  const pageContent = active ? (
    <section className="actuality-page" aria-label={mode === 'trending' ? 'Top actual' : 'Próximos estrenos'}>
      <header className="actuality-hero">
        <div>
          <span className="eyebrow">Actualidad Kanso</span>
          <h1>{mode === 'trending' ? 'Top actual' : 'Estrenos'}</h1>
          <p>
            {mode === 'trending'
              ? 'Lo que está marcando tendencia hoy en películas y series.'
              : 'Próximos lanzamientos y nuevas emisiones para que no se te pase nada.'}
          </p>
        </div>
        <div className="actuality-mode-tabs" aria-label="Sección de actualidad">
          <button type="button" className={mode === 'upcoming' ? 'active' : ''} onClick={() => switchMode('upcoming')}>Estrenos</button>
          <button type="button" className={mode === 'trending' ? 'active' : ''} onClick={() => switchMode('trending')}>Top actual</button>
        </div>
      </header>

      <div className="actuality-toolbar">
        <div className="actuality-filter-tabs" aria-label="Filtrar contenido">
          {([['all', 'Todo'], ['movie', 'Películas'], ['series', 'Series']] as const).map(([value, label]) => (
            <button key={value} type="button" className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}</button>
          ))}
        </div>
        {!loading && !error && items.length > 0 && <span>{items.length}+ títulos disponibles</span>}
      </div>

      {!session && <div className="actuality-message"><strong>Inicia sesión para consultar actualidad.</strong></div>}
      {error && (
        <div className="actuality-message error">
          <strong>No pudimos completar la carga.</strong>
          <span>{error}</span>
          <button type="button" onClick={() => setReloadKey((value) => value + 1)}>Reintentar</button>
        </div>
      )}
      {loading && <div className="actuality-skeleton-grid" aria-label="Cargando"><i /><i /><i /><i /><i /><i /></div>}
      {!loading && !error && session && items.length === 0 && (
        <div className="actuality-message">
          <strong>No encontramos contenido para este filtro.</strong>
          <span>Prueba otra categoría o actualiza la consulta.</span>
          <button type="button" onClick={() => setReloadKey((value) => value + 1)}>Actualizar</button>
        </div>
      )}

      {!loading && (
        <div className="actuality-grid">
          {visibleItems.map((item, index) => {
            const added = existing.has(`tmdb:${item.externalId}`)
            const rating = item.rating == null ? null : Math.round(item.rating * 10)
            return (
              <article className="actuality-card" key={`${item.mediaType}:${item.externalId}`}>
                <div className="actuality-poster">
                  {item.posterUrl ? <img src={item.posterUrl} alt={`Poster de ${item.title}`} loading="lazy" /> : <span>{item.title.slice(0, 1)}</span>}
                  {mode === 'upcoming' ? (
                    <b className="actuality-chip">{releaseLabel(item.releaseDate)}</b>
                  ) : (
                    <b className="actuality-rank">#{index + 1}</b>
                  )}
                </div>
                <div className="actuality-copy">
                  <small>{item.mediaType === 'movie' ? 'Película' : 'Serie'}{item.releaseYear ? ` · ${item.releaseYear}` : ''}</small>
                  <h2>{item.title}</h2>
                  <div className="actuality-card-footer">
                    <span>{rating == null ? 'TMDB —' : `TMDB ${rating}%`}</span>
                    <button type="button" disabled={!session || added} onClick={() => void add(item)} aria-label={added ? `${item.title} ya está en Kanso` : `Agregar ${item.title} a Kanso`}>
                      {added ? '✓' : '+'}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {!loading && !error && canLoadMore && (
        <div className="actuality-more">
          <button type="button" onClick={() => void loadMore()} disabled={loadingMore}>
            {loadingMore ? 'Cargando…' : visibleCount < items.length ? 'Mostrar más' : 'Cargar más'}
          </button>
        </div>
      )}
    </section>
  ) : null

  return (
    <>
      {sidebarTarget && createPortal(
        <div className="nav-group-start actuality-sidebar-entry">
          <span className="nav-section-label">Actualidad</span>
          <button className={active && mode === 'upcoming' ? 'nav-item active' : 'nav-item'} type="button" onClick={() => navigate('upcoming')}><span>Estrenos</span><b>◷</b></button>
          <button className={active && mode === 'trending' ? 'nav-item active' : 'nav-item'} type="button" onClick={() => navigate('trending')}><span>Top actual</span><b>↗</b></button>
        </div>,
        sidebarTarget,
      )}
      {contentTarget && pageContent && createPortal(pageContent, contentTarget)}
    </>
  )
}
