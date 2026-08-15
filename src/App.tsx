import { useMemo, useState } from 'react'
import { AuthPanel } from './components/AuthPanel'
import { DiscoverPanel } from './components/DiscoverPanel'
import { useAuth } from './hooks/useAuth'
import { useLibrary } from './hooks/useLibrary'
import type { TmdbSearchResult } from './services/tmdb'
import type { LibraryItem, MediaType, WatchStatus } from './types'

const demoItems: LibraryItem[] = [
  { id: 'hxh', title: 'Hunter × Hunter', type: 'anime', status: 'watching', year: 2011, currentEpisode: 137, totalEpisodes: 148, score: 10, accent: 'HXH' },
  { id: 'black-rabbit', title: 'Black Rabbit', type: 'series', status: 'watching', year: 2025, currentEpisode: 1, totalEpisodes: 8, accent: 'BR' },
  { id: 'ahs', title: 'American Horror Story', type: 'series', status: 'paused', year: 2011, currentEpisode: 63, accent: 'AHS' },
  { id: 'endgame', title: 'Avengers: Endgame', type: 'movie', status: 'completed', year: 2019, score: 9, collection: 'Marvel', accent: 'A' },
  { id: 'doomsday', title: 'Avengers: Doomsday', type: 'movie', status: 'planned', year: 2026, collection: 'Marvel', accent: 'AD' },
  { id: 'platinum-end', title: 'Platinum End', type: 'anime', status: 'paused', year: 2021, currentEpisode: 8, totalEpisodes: 24, accent: 'PE' },
]

const labels: Record<WatchStatus, string> = {
  planned: 'Pendiente',
  watching: 'Viendo',
  completed: 'Visto',
  paused: 'Pausado',
  dropped: 'Abandonado',
}

const typeLabels: Record<MediaType, string> = {
  movie: 'Película',
  series: 'Serie',
  anime: 'Anime',
}

function progress(item: LibraryItem) {
  if (!item.currentEpisode || !item.totalEpisodes) return null
  return Math.min(100, Math.round((item.currentEpisode / item.totalEpisodes) * 100))
}

function initials(title: string) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'K'
}

function CoverImage({ item }: { item: LibraryItem }) {
  return (
    <>
      <span>{item.accent}</span>
      {item.posterUrl && (
        <img
          src={item.posterUrl}
          alt={`Poster de ${item.title}`}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />
      )}
    </>
  )
}

export default function App() {
  const { session, loading: authLoading } = useAuth()
  const {
    rows,
    loading: libraryLoading,
    error: libraryError,
    addItem,
    advanceEpisode: advanceRemoteEpisode,
  } = useLibrary(session?.user.id)
  const [localItems, setLocalItems] = useState(demoItems)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | MediaType>('all')

  const remoteItems = useMemo<LibraryItem[]>(() => rows.flatMap((row) => {
    if (row.media_type === 'manga') return []

    return [{
      id: row.id,
      title: row.title,
      type: row.media_type,
      status: row.status,
      year: row.release_year ?? new Date().getFullYear(),
      posterUrl: row.poster_url ?? undefined,
      currentEpisode: row.current_episode ?? undefined,
      totalEpisodes: row.total_episodes ?? undefined,
      score: row.score ?? undefined,
      accent: initials(row.title),
    }]
  }), [rows])

  const items = session ? remoteItems : localItems

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return items.filter((item) => {
      const matchesType = filter === 'all' || item.type === filter
      const matchesSearch = !normalized || item.title.toLowerCase().includes(normalized)
      return matchesType && matchesSearch
    })
  }, [items, query, filter])

  const existingCatalogKeys = useMemo(() => new Set(
    rows.map((row) => `${row.source}:${row.media_type}:${row.external_id}`),
  ), [rows])

  const watching = items.filter((item) => item.status === 'watching')
  const completed = items.filter((item) => item.status === 'completed').length
  const planned = items.filter((item) => item.status === 'planned').length

  const advanceEpisode = (id: string) => {
    if (session) {
      const row = rows.find((item) => item.id === id)
      if (row) void advanceRemoteEpisode(row)
      return
    }

    setLocalItems((current) => current.map((item) => {
      if (item.id !== id || !item.totalEpisodes) return item
      const next = Math.min((item.currentEpisode ?? 0) + 1, item.totalEpisodes)
      return {
        ...item,
        currentEpisode: next,
        status: next === item.totalEpisodes ? 'completed' : 'watching',
      }
    }))
  }

  const addTmdbItem = async (item: TmdbSearchResult) => {
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

  const dataMode = authLoading
    ? 'Comprobando sesión…'
    : session
      ? libraryLoading
        ? 'Sincronizando con Supabase…'
        : 'Biblioteca sincronizada con Supabase'
      : 'Modo demostración · inicia sesión para usar tus datos reales'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">K</span>
          <div>
            <strong>Kanso</strong>
            <small>Tu universo, ordenado.</small>
          </div>
        </div>

        <nav className="nav-list" aria-label="Navegación principal">
          <button className="nav-item active">Inicio</button>
          <button className="nav-item">Mi biblioteca</button>
          <button className="nav-item">Colecciones</button>
          <a className="nav-item nav-link" href="#discover">Descubrir</a>
        </nav>

        <div className="sidebar-note">
          <span>Arquitectura</span>
          <strong>Supabase + TMDB + AniList</strong>
          <p>Tu progreso vive en Kanso; las credenciales externas permanecen en funciones de servidor.</p>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Biblioteca personal</p>
            <h1>¿Qué quieres continuar?</h1>
            <p className={session ? 'data-mode synced' : 'data-mode'}>{dataMode}</p>
          </div>
          <div className="topbar-actions">
            <AuthPanel />
            <label className="search-box">
              <span>⌕</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar en mi biblioteca..." />
            </label>
          </div>
        </header>

        {libraryError && session && (
          <div className="system-message error" role="alert">
            <strong>No pudimos sincronizar tu biblioteca.</strong>
            <span>{libraryError}</span>
          </div>
        )}

        <section className="stats-grid" aria-label="Resumen">
          <article className="stat-card"><span>Viendo ahora</span><strong>{watching.length}</strong><small>títulos activos</small></article>
          <article className="stat-card"><span>Completados</span><strong>{completed}</strong><small>en tu historial</small></article>
          <article className="stat-card"><span>Por ver</span><strong>{planned}</strong><small>en tu lista</small></article>
          <article className="stat-card featured"><span>Colección activa</span><strong>Marvel</strong><small>Preparando Doomsday</small></article>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div><p className="eyebrow">Continuar</p><h2>Viendo ahora</h2></div>
          </div>
          {session && !libraryLoading && watching.length === 0 ? (
            <div className="empty-state">
              <strong>Aún no tienes títulos en progreso.</strong>
              <p>Busca un título en TMDB, agrégalo a Kanso y luego podremos comenzar a registrar su progreso.</p>
            </div>
          ) : (
            <div className="continue-grid">
              {watching.map((item) => {
                const value = progress(item)
                return (
                  <article className="continue-card" key={item.id}>
                    <div className="cover large"><CoverImage item={item} /></div>
                    <div className="continue-body">
                      <div className="meta"><span>{typeLabels[item.type]}</span><span>{item.year}</span></div>
                      <h3>{item.title}</h3>
                      {item.currentEpisode && item.totalEpisodes && (
                        <>
                          <p>Episodio {item.currentEpisode} de {item.totalEpisodes}</p>
                          <div className="progress-track"><span style={{ width: `${value}%` }} /></div>
                          <small>{value}% completado</small>
                          <button className="primary-action" onClick={() => advanceEpisode(item.id)}>Marcar siguiente episodio +1</button>
                        </>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <DiscoverPanel
          enabled={Boolean(session)}
          existingKeys={existingCatalogKeys}
          onAdd={addTmdbItem}
        />

        <section className="section-block">
          <div className="section-heading library-heading">
            <div><p className="eyebrow">Todo en un lugar</p><h2>Mi biblioteca</h2></div>
            <div className="filters">
              {(['all', 'movie', 'series', 'anime'] as const).map((value) => (
                <button key={value} className={filter === value ? 'filter active' : 'filter'} onClick={() => setFilter(value)}>
                  {value === 'all' ? 'Todo' : typeLabels[value]}
                </button>
              ))}
            </div>
          </div>

          {session && !libraryLoading && visibleItems.length === 0 ? (
            <div className="empty-state compact">
              <strong>Tu biblioteca está vacía.</strong>
              <p>Usa el buscador de TMDB para agregar tu primera película o serie.</p>
            </div>
          ) : (
            <div className="library-grid">
              {visibleItems.map((item) => (
                <article className="media-card" key={item.id}>
                  <div className="cover">
                    <CoverImage item={item} />
                    <em>{labels[item.status]}</em>
                  </div>
                  <div className="media-body">
                    <div className="meta"><span>{typeLabels[item.type]}</span><span>{item.year}</span></div>
                    <h3>{item.title}</h3>
                    <div className="media-footer">
                      <span>{item.collection ?? (session ? 'Supabase' : 'Biblioteca')}</span>
                      {item.score ? <strong>★ {item.score}/10</strong> : <span>{labels[item.status]}</span>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
