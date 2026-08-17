import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../hooks/useAuth'
import { useLibrary } from '../hooks/useLibrary'
import { belongsToUniverse, fetchUniverseCatalog, universeDefinitions, type UniverseId } from '../services/universes'
import type { TmdbSearchResult } from '../services/tmdb'

type UniverseFilter = 'all' | 'movie' | 'series'

function isUniverseView() {
  const view = new URLSearchParams(window.location.search).get('view')
  return view === 'universes' || view === 'marvel'
}

function requestedUniverse(): UniverseId {
  const value = new URLSearchParams(window.location.search).get('universe') as UniverseId | null
  return universeDefinitions.some((item) => item.id === value) ? value! : 'marvel'
}

function ratingLabel(rating: number | null) {
  if (rating == null || !Number.isFinite(rating)) return 'TMDB —'
  return `TMDB ${Math.round(rating * 10)}%`
}

const statusIcon = {
  planned: '♡',
  watching: '▶',
  completed: '✓',
  paused: 'Ⅱ',
  dropped: '×',
} as const

export function MarvelHubRoute() {
  const { session } = useAuth()
  const { rows, addItem } = useLibrary(session?.user.id)
  const [active, setActive] = useState(() => isUniverseView())
  const [universeId, setUniverseId] = useState<UniverseId>(() => requestedUniverse())
  const [items, setItems] = useState<TmdbSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<UniverseFilter>('all')
  const [visibleCount, setVisibleCount] = useState(18)
  const [sidebarTarget, setSidebarTarget] = useState<Element | null>(null)

  const universe = useMemo(
    () => universeDefinitions.find((item) => item.id === universeId) ?? universeDefinitions[0],
    [universeId],
  )

  useEffect(() => {
    const sync = () => {
      setActive(isUniverseView())
      setUniverseId(requestedUniverse())
    }
    window.addEventListener('popstate', sync)
    setSidebarTarget(document.querySelector('.sidebar .nav-list'))
    return () => window.removeEventListener('popstate', sync)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('marvel-view-active', active)
    return () => document.body.classList.remove('marvel-view-active')
  }, [active])

  useEffect(() => {
    if (!active || !session) return
    setItems([])
    setVisibleCount(18)
    setLoading(true)
    setError(null)

    void fetchUniverseCatalog(universe)
      .then(setItems)
      .catch((cause) => setError(cause instanceof Error ? cause.message : `No pudimos cargar ${universe.label}.`))
      .finally(() => setLoading(false))
  }, [active, session, universe])

  const existing = useMemo(
    () => new Set(rows.map((row) => `${row.source}:${row.external_id}`)),
    [rows],
  )

  const owned = useMemo(
    () => rows.filter((row) => belongsToUniverse(row.title, row.original_title, universe)),
    [rows, universe],
  )

  const visibleCatalog = useMemo(
    () => items
      .filter((item) => filter === 'all' || item.mediaType === filter)
      .slice(0, visibleCount),
    [items, filter, visibleCount],
  )

  const filteredCatalogCount = useMemo(
    () => items.filter((item) => filter === 'all' || item.mediaType === filter).length,
    [items, filter],
  )

  const navigate = () => {
    const url = new URL(window.location.href)
    url.searchParams.set('view', 'universes')
    url.searchParams.set('universe', universeId)
    window.history.pushState({}, '', url)
    window.dispatchEvent(new PopStateEvent('popstate'))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const selectUniverse = (next: UniverseId) => {
    const url = new URL(window.location.href)
    url.searchParams.set('view', 'universes')
    url.searchParams.set('universe', next)
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
            <span>Universos</span><b>✦</b>
          </button>
        </div>,
        sidebarTarget,
      )}

      {active && (
        <section className="marvel-hub universe-hub" aria-label="Universos y sagas">
          <header className="universe-hero">
            <span className="marvel-kicker">Universos Kanso</span>
            <h1>{universe.label}</h1>
            <p>{universe.description}</p>

            <div className="universe-switcher" aria-label="Elegir universo">
              {universeDefinitions.map((item) => (
                <button key={item.id} type="button" className={item.id === universeId ? 'active' : ''} onClick={() => selectUniverse(item.id)}>
                  {item.shortLabel}
                </button>
              ))}
            </div>
          </header>

          {!session && <div className="marvel-message"><strong>Inicia sesión para usar Universos.</strong><span>Primero veremos lo que ya tienes y luego el catálogo para explorar.</span></div>}

          {session && (
            <section className="universe-owned" aria-label={`Tus títulos de ${universe.label}`}>
              <div className="universe-section-heading">
                <div><span className="marvel-kicker">En tu biblioteca</span><h2>Ya tienes {owned.length}</h2></div>
                <small>Detectado desde tus títulos guardados.</small>
              </div>

              {owned.length > 0 ? (
                <div className="universe-owned-rail">
                  {owned.map((row) => (
                    <article className="universe-owned-card" key={row.id}>
                      <div className="universe-owned-poster">
                        {row.poster_url ? <img src={row.poster_url} alt={`Poster de ${row.title}`} loading="lazy" /> : <span>{row.title.slice(0, 1)}</span>}
                        <b aria-label={row.status}>{statusIcon[row.status]}</b>
                      </div>
                      <strong>{row.title}</strong>
                      <small>{row.release_year ?? '—'}</small>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="universe-empty-owned">
                  <strong>Aún no detectamos títulos de {universe.label} en tu biblioteca.</strong>
                  <span>Puedes agregarlos desde el catálogo inferior o usando la lupa rápida.</span>
                </div>
              )}
            </section>
          )}

          <section className="universe-explore" aria-label={`Explorar ${universe.label}`}>
            <div className="universe-section-heading explore-heading">
              <div><span className="marvel-kicker">Explorar</span><h2>Más de {universe.label}</h2></div>
              <div className="marvel-tabs" role="tablist" aria-label={`Filtrar ${universe.label}`}>
                {([['all', 'Todo'], ['movie', 'Películas'], ['series', 'Series']] as const).map(([value, label]) => (
                  <button key={value} type="button" className={filter === value ? 'active' : ''} onClick={() => { setFilter(value); setVisibleCount(18) }}>{label}</button>
                ))}
              </div>
            </div>

            {error && <div className="marvel-message error" role="alert"><strong>No pudimos completar el catálogo.</strong><span>{error}</span></div>}
            {loading && <div className="marvel-loading">Buscando títulos de {universe.label}…</div>}

            {!loading && !error && visibleCatalog.length === 0 && (
              <div className="marvel-message"><strong>No encontramos resultados externos.</strong><span>Tu biblioteca de arriba seguirá visible aunque TMDB no responda con coincidencias.</span></div>
            )}

            <div className="marvel-grid universe-grid">
              {visibleCatalog.map((item) => {
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
                      <button type="button" disabled={!session || added} onClick={() => void add(item)}>{added ? '✓ En tu biblioteca' : '+ Agregar'}</button>
                    </div>
                  </article>
                )
              })}
            </div>

            {visibleCount < filteredCatalogCount && (
              <button className="marvel-load-more" type="button" onClick={() => setVisibleCount((count) => count + 18)}>Mostrar más</button>
            )}
          </section>
        </section>
      )}
    </>
  )
}
