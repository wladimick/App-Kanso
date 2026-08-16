import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../hooks/useAuth'
import { useLibrary } from '../hooks/useLibrary'
import { fetchMarvelCatalog } from '../services/marvel'
import type { TmdbSearchResult } from '../services/tmdb'

type MarvelFilter = 'all' | 'movie' | 'series'

function isMarvelView() {
  return new URLSearchParams(window.location.search).get('view') === 'marvel'
}

function ratingLabel(rating: number | null) {
  if (rating == null || !Number.isFinite(rating)) return 'TMDB —'
  return `TMDB ${Math.round(rating * 10)}%`
}

export function MarvelHubRoute() {
  const { session } = useAuth()
  const { rows, addItem } = useLibrary(session?.user.id)
  const [active, setActive] = useState(() => isMarvelView())
  const [items, setItems] = useState<TmdbSearchResult[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<MarvelFilter>('all')
  const [sidebarTarget, setSidebarTarget] = useState<Element | null>(null)

  useEffect(() => {
    const sync = () => setActive(isMarvelView())
    window.addEventListener('popstate', sync)
    setSidebarTarget(document.querySelector('.sidebar .nav-list'))
    return () => window.removeEventListener('popstate', sync)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('marvel-view-active', active)
    return () => document.body.classList.remove('marvel-view-active')
  }, [active])

  useEffect(() => {
    if (!active || !session || items.length > 0 || loading) return
    void loadPage(1, true)
  }, [active, session])

  const existing = useMemo(
    () => new Set(rows.map((row) => `${row.source}:${row.external_id}`)),
    [rows],
  )

  const visible = useMemo(
    () => items.filter((item) => filter === 'all' || item.mediaType === filter),
    [items, filter],
  )

  async function loadPage(nextPage: number, replace = false) {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchMarvelCatalog(nextPage)
      setItems((current) => {
        const source = replace ? response.results : [...current, ...response.results]
        const deduped = new Map(source.map((item) => [`${item.mediaType}:${item.externalId}`, item]))
        return [...deduped.values()]
      })
      setPage(response.page)
      setHasMore(response.hasMore)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos cargar el universo Marvel.')
    } finally {
      setLoading(false)
    }
  }

  const navigate = () => {
    const url = new URL(window.location.href)
    url.searchParams.set('view', 'marvel')
    window.history.pushState({}, '', url)
    window.dispatchEvent(new PopStateEvent('popstate'))
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  return (
    <>
      {sidebarTarget && createPortal(
        <div className="nav-group-start marvel-sidebar-entry">
          <span className="nav-section-label">Universos</span>
          <button className={active ? 'nav-item active marvel-nav-item' : 'nav-item marvel-nav-item'} type="button" onClick={navigate}>
            <span>Marvel</span><b>✦</b>
          </button>
        </div>,
        sidebarTarget,
      )}

      {active && (
        <section className="marvel-hub" aria-label="Universo Marvel">
          <header className="marvel-hero">
            <div className="marvel-hero-copy">
              <span className="marvel-kicker">Universo Marvel</span>
              <h1>Marvel en un solo lugar.</h1>
              <p>Películas y series vinculadas a compañías Marvel en TMDB. Agrega lo que ya viste, lo que estás viendo o lo que quieres ver.</p>
              <div className="marvel-tabs" role="tablist" aria-label="Filtrar Marvel">
                {([
                  ['all', 'Todo'],
                  ['movie', 'Películas'],
                  ['series', 'Series'],
                ] as const).map(([value, label]) => (
                  <button key={value} type="button" className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}</button>
                ))}
              </div>
            </div>
            <div className="marvel-hero-mark" aria-hidden="true">M</div>
          </header>

          {!session && <div className="marvel-message"><strong>Inicia sesión para usar Marvel.</strong><span>El catálogo y tu progreso se guardan por usuario.</span></div>}
          {error && <div className="marvel-message error" role="alert"><strong>No pudimos cargar Marvel.</strong><span>{error}</span></div>}

          <div className="marvel-summary">
            <span>{visible.length} títulos cargados</span>
            <small>Ordenados por estreno, de lo más nuevo a lo más antiguo.</small>
          </div>

          <div className="marvel-grid">
            {visible.map((item) => {
              const key = `tmdb:${item.externalId}`
              const added = existing.has(key)
              return (
                <article className="marvel-card" key={`${item.mediaType}:${item.externalId}`}>
                  <div className="marvel-poster">
                    {item.posterUrl ? <img src={item.posterUrl} alt={`Poster de ${item.title}`} loading="lazy" /> : <span>{item.title.slice(0, 1)}</span>}
                    <b>{ratingLabel(item.rating)}</b>
                  </div>
                  <div className="marvel-card-body">
                    <span>{item.mediaType === 'movie' ? 'Película' : 'Serie'} · {item.releaseYear ?? '—'}</span>
                    <h2>{item.title}</h2>
                    <p>{item.overview || 'Sin descripción disponible en español.'}</p>
                    <button type="button" disabled={!session || added} onClick={() => void add(item)}>{added ? '✓ En tu biblioteca' : '+ Agregar a Kanso'}</button>
                  </div>
                </article>
              )
            })}
          </div>

          {session && items.length === 0 && loading && <div className="marvel-loading">Cargando universo Marvel…</div>}
          {session && hasMore && items.length > 0 && (
            <button className="marvel-load-more" type="button" disabled={loading} onClick={() => void loadPage(page + 1)}>{loading ? 'Cargando…' : 'Cargar más'}</button>
          )}
        </section>
      )}
    </>
  )
}
