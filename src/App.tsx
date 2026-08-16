import { useEffect, useMemo, useState } from 'react'
import { AuthPanel } from './components/AuthPanel'
import { DiscoverPanel } from './components/DiscoverPanel'
import { MediaDetail } from './components/MediaDetail'
import { MediaEditor } from './components/MediaEditor'
import { TmdbRating } from './components/TmdbRating'
import { useAuth } from './hooks/useAuth'
import { useLibrary } from './hooks/useLibrary'
import type { TmdbSearchResult } from './services/tmdb'
import type { LibraryItem, LibraryItemPatch, MediaType, WatchStatus } from './types'

const demoItems: LibraryItem[] = [
  { id: 'hxh', title: 'Hunter × Hunter', type: 'anime', status: 'watching', year: 2011, currentEpisode: 137, totalEpisodes: 148, score: 10, favorite: true, accent: 'HXH' },
  { id: 'black-rabbit', title: 'Black Rabbit', type: 'series', status: 'watching', year: 2025, currentEpisode: 1, totalEpisodes: 8, accent: 'BR' },
  { id: 'ahs', title: 'American Horror Story', type: 'series', status: 'paused', year: 2011, currentEpisode: 63, accent: 'AHS' },
  { id: 'endgame', title: 'Avengers: Endgame', type: 'movie', status: 'completed', year: 2019, score: 9, favorite: true, collection: 'Marvel', accent: 'A' },
  { id: 'doomsday', title: 'Avengers: Doomsday', type: 'movie', status: 'planned', year: 2026, collection: 'Marvel', accent: 'AD' },
  { id: 'platinum-end', title: 'Platinum End', type: 'anime', status: 'paused', year: 2021, currentEpisode: 8, totalEpisodes: 24, accent: 'PE' },
]

type AppPage = 'home' | 'library' | 'wishlist' | 'watching' | 'completed' | 'favorites' | 'collections' | 'discover'

const pageMeta: Record<AppPage, { eyebrow: string; title: string; description: string }> = {
  home: { eyebrow: 'Biblioteca personal', title: '¿Qué quieres continuar?', description: 'Tu centro de control para todo lo que ves.' },
  library: { eyebrow: 'Tu catálogo', title: 'Mi biblioteca', description: 'Solo los títulos que agregaste a Kanso.' },
  wishlist: { eyebrow: 'Para después', title: 'Lista de deseos', description: 'Películas, series y anime que quieres ver.' },
  watching: { eyebrow: 'En progreso', title: 'Viendo ahora', description: 'Continúa exactamente donde quedaste.' },
  completed: { eyebrow: 'Historial', title: 'Completados', description: 'Todo lo que ya terminaste o viste.' },
  favorites: { eyebrow: 'Lo mejor para ti', title: 'Favoritos', description: 'Los títulos que decidiste destacar.' },
  collections: { eyebrow: 'Organización', title: 'Colecciones', description: 'Agrupa sagas, universos y listas personales.' },
  discover: { eyebrow: 'Catálogo externo', title: 'Descubrir', description: 'Busca títulos nuevos y agrégalos a Kanso.' },
}

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

function initials(title: string) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'K'
}

function progress(item: LibraryItem) {
  if (item.currentEpisode == null || !item.totalEpisodes) return null
  return Math.min(100, Math.round((item.currentEpisode / item.totalEpisodes) * 100))
}

function pageFromUrl(): AppPage {
  const value = new URLSearchParams(window.location.search).get('view') as AppPage | null
  return value && value in pageMeta ? value : 'home'
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
          onError={(event) => { event.currentTarget.style.display = 'none' }}
        />
      )}
    </>
  )
}

function MediaGrid({ items, onOpen, emptyTitle, emptyText }: {
  items: LibraryItem[]
  onOpen: (item: LibraryItem) => void
  emptyTitle: string
  emptyText: string
}) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <strong>{emptyTitle}</strong>
        <p>{emptyText}</p>
      </div>
    )
  }

  return (
    <div className="library-grid">
      {items.map((item) => (
        <button className="media-card media-card-button" key={item.id} type="button" onClick={() => onOpen(item)}>
          <div className="cover">
            <CoverImage item={item} />
            <em>{labels[item.status]}</em>
            {item.favorite && <b className="favorite-badge">★</b>}
          </div>
          <div className="media-body">
            <TmdbRating item={item} compact />
            <div className="meta"><span>{typeLabels[item.type]}</span><span>{item.year}</span></div>
            <h3>{item.title}</h3>
            {(item.currentEpisode != null || item.score != null) && (
              <div className="card-detail-line">
                {item.currentEpisode != null && item.type !== 'movie' && <span>T{item.currentSeason ?? 1} · E{item.currentEpisode}</span>}
                {item.score != null && <strong>★ {item.score}/10</strong>}
              </div>
            )}
            <div className="media-footer">
              <span>{item.collection ?? labels[item.status]}</span>
              <span>Ver ficha →</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

export default function App() {
  const { session, loading: authLoading } = useAuth()
  const {
    rows,
    loading: libraryLoading,
    error: libraryError,
    addItem,
    editItem,
    removeItem,
    advanceEpisode: advanceRemoteEpisode,
  } = useLibrary(session?.user.id)

  const [localItems, setLocalItems] = useState(demoItems)
  const [page, setPage] = useState<AppPage>(() => pageFromUrl())
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | MediaType>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editorId, setEditorId] = useState<string | null>(null)

  useEffect(() => {
    const syncPage = () => setPage(pageFromUrl())
    window.addEventListener('popstate', syncPage)
    return () => window.removeEventListener('popstate', syncPage)
  }, [])

  const navigate = (next: AppPage) => {
    const url = new URL(window.location.href)
    if (next === 'home') url.searchParams.delete('view')
    else url.searchParams.set('view', next)
    window.history.pushState({}, '', url)
    setPage(next)
    setQuery('')
    setFilter('all')
    setSelectedId(null)
    setEditorId(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const remoteItems = useMemo<LibraryItem[]>(() => rows.flatMap((row) => {
    if (row.media_type === 'manga') return []

    return [{
      id: row.id,
      source: row.source,
      externalId: row.external_id,
      title: row.title,
      type: row.media_type,
      status: row.status,
      year: row.release_year ?? new Date().getFullYear(),
      posterUrl: row.poster_url ?? undefined,
      currentSeason: row.current_season ?? undefined,
      currentEpisode: row.current_episode ?? undefined,
      totalSeasons: row.total_seasons ?? undefined,
      totalEpisodes: row.total_episodes ?? undefined,
      score: row.score ?? undefined,
      favorite: row.favorite,
      notes: row.notes ?? undefined,
      accent: initials(row.title),
    }]
  }), [rows])

  const items = session ? remoteItems : localItems
  const selectedItem = selectedId ? items.find((item) => item.id === selectedId) ?? null : null
  const editorItem = editorId ? items.find((item) => item.id === editorId) ?? null : null

  const watching = items.filter((item) => item.status === 'watching')
  const completed = items.filter((item) => item.status === 'completed')
  const planned = items.filter((item) => item.status === 'planned')
  const favorites = items.filter((item) => item.favorite)

  const pageItems = useMemo(() => {
    switch (page) {
      case 'wishlist': return items.filter((item) => item.status === 'planned')
      case 'watching': return items.filter((item) => item.status === 'watching')
      case 'completed': return items.filter((item) => item.status === 'completed')
      case 'favorites': return items.filter((item) => item.favorite)
      default: return items
    }
  }, [items, page])

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return pageItems.filter((item) => {
      const matchesType = filter === 'all' || item.type === filter
      const matchesSearch = !normalized || item.title.toLowerCase().includes(normalized)
      return matchesType && matchesSearch
    })
  }, [pageItems, query, filter])

  const existingCatalogKeys = useMemo(() => new Set(
    rows.map((row) => `${row.source}:${row.external_id}`),
  ), [rows])

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

  const saveEditorItem = async (patch: LibraryItemPatch) => {
    if (!session || !editorItem) return
    await editItem(editorItem.id, {
      mediaType: patch.type,
      status: patch.status,
      currentSeason: patch.currentSeason,
      currentEpisode: patch.currentEpisode,
      totalSeasons: patch.totalSeasons,
      totalEpisodes: patch.totalEpisodes,
      score: patch.score,
      favorite: patch.favorite,
      notes: patch.notes,
    })
  }

  const deleteEditorItem = async () => {
    if (!session || !editorItem) return
    await removeItem(editorItem.id)
    setEditorId(null)
    setSelectedId(null)
  }

  const advanceEpisode = (id: string) => {
    if (session) {
      const row = rows.find((item) => item.id === id)
      if (row) void advanceRemoteEpisode(row)
      return
    }

    setLocalItems((current) => current.map((item) => {
      if (item.id !== id || !item.totalEpisodes) return item
      const next = Math.min((item.currentEpisode ?? 0) + 1, item.totalEpisodes)
      return { ...item, currentEpisode: next, status: next === item.totalEpisodes ? 'completed' : 'watching' }
    }))
  }

  const dataMode = authLoading
    ? 'Comprobando sesión…'
    : session
      ? libraryLoading
        ? 'Sincronizando con Supabase…'
        : 'Biblioteca sincronizada con Supabase'
      : 'Modo demostración · inicia sesión para usar tus datos reales'

  const meta = pageMeta[page]
  const listPage = ['library', 'wishlist', 'watching', 'completed', 'favorites'].includes(page)

  const navItems: Array<{ page: AppPage; label: string; count?: number }> = [
    { page: 'home', label: 'Inicio' },
    { page: 'library', label: 'Mi biblioteca', count: items.length },
    { page: 'wishlist', label: 'Lista de deseos', count: planned.length },
    { page: 'watching', label: 'Viendo', count: watching.length },
    { page: 'completed', label: 'Completados', count: completed.length },
    { page: 'favorites', label: 'Favoritos', count: favorites.length },
    { page: 'collections', label: 'Colecciones' },
    { page: 'discover', label: 'Descubrir' },
  ]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button type="button" className="brand brand-button" onClick={() => navigate('home')}>
          <span className="brand-mark">K</span>
          <span><strong>Kanso</strong><small>Tu universo, ordenado.</small></span>
        </button>

        <nav className="nav-list" aria-label="Navegación principal">
          {navItems.map((item, index) => (
            <div key={item.page} className={index === 1 || index === 6 ? 'nav-group-start' : undefined}>
              {index === 1 && <span className="nav-section-label">Tu biblioteca</span>}
              {index === 6 && <span className="nav-section-label">Explorar</span>}
              <button className={page === item.page ? 'nav-item active' : 'nav-item'} type="button" onClick={() => navigate(item.page)}>
                <span>{item.label}</span>{item.count != null && <b>{item.count}</b>}
              </button>
            </div>
          ))}
        </nav>

        <div className="sidebar-note">
          <span>Tu cuenta</span>
          <strong>{session?.user.email ?? 'Modo demostración'}</strong>
          <p>{session ? `${items.length} títulos guardados y protegidos por tu usuario.` : 'Inicia sesión para guardar tu progreso en Supabase.'}</p>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">{meta.eyebrow}</p>
            <h1>{meta.title}</h1>
            <p className="page-description">{meta.description}</p>
            <p className={session ? 'data-mode synced' : 'data-mode'}>{dataMode}</p>
          </div>
          <div className="topbar-actions">
            <AuthPanel />
            {listPage && <label className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar en esta lista…" /></label>}
          </div>
        </header>

        {libraryError && session && <div className="system-message error" role="alert"><strong>No pudimos sincronizar tu biblioteca.</strong><span>{libraryError}</span></div>}

        {page === 'home' && (
          <>
            <section className="stats-grid" aria-label="Resumen">
              <button type="button" className="stat-card stat-button" onClick={() => navigate('watching')}><span>Viendo ahora</span><strong>{watching.length}</strong><small>títulos activos</small></button>
              <button type="button" className="stat-card stat-button" onClick={() => navigate('completed')}><span>Completados</span><strong>{completed.length}</strong><small>en tu historial</small></button>
              <button type="button" className="stat-card stat-button" onClick={() => navigate('wishlist')}><span>Lista de deseos</span><strong>{planned.length}</strong><small>por ver</small></button>
              <button type="button" className="stat-card stat-button featured" onClick={() => navigate('favorites')}><span>Favoritos</span><strong>{favorites.length}</strong><small>títulos destacados</small></button>
            </section>

            <section className="section-block">
              <div className="section-heading"><div><p className="eyebrow">Continuar</p><h2>Viendo ahora</h2></div><button className="text-action" type="button" onClick={() => navigate('watching')}>Ver todos →</button></div>
              {watching.length === 0 ? (
                <div className="empty-state"><strong>Aún no tienes títulos en progreso.</strong><p>Abre un título de tu biblioteca y cambia su estado a “Viendo”.</p></div>
              ) : (
                <div className="continue-grid">
                  {watching.slice(0, 4).map((item) => {
                    const value = progress(item)
                    return (
                      <article className="continue-card" key={item.id}>
                        <button className="cover large cover-button" type="button" onClick={() => setSelectedId(item.id)}><CoverImage item={item} /></button>
                        <div className="continue-body">
                          <TmdbRating item={item} />
                          <div className="meta"><span>{typeLabels[item.type]}</span><span>{item.year}</span></div>
                          <button className="title-action" type="button" onClick={() => setSelectedId(item.id)}><h3>{item.title}</h3></button>
                          {item.type !== 'movie' && <p>Temporada {item.currentSeason ?? 1} · Episodio {item.currentEpisode ?? 0}{item.totalEpisodes ? ` de ${item.totalEpisodes}` : ''}</p>}
                          {value != null && <><div className="progress-track"><span style={{ width: `${value}%` }} /></div><small>{value}% completado</small></>}
                          <div className="continue-actions">
                            <button className="secondary-action" type="button" onClick={() => setSelectedId(item.id)}>Ver ficha</button>
                            {item.type !== 'movie' && item.totalEpisodes && <button className="primary-action" type="button" onClick={() => advanceEpisode(item.id)}>+1 episodio</button>}
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>

            <section className="section-block">
              <div className="section-heading"><div><p className="eyebrow">Recientes</p><h2>Tu biblioteca</h2></div><button className="text-action" type="button" onClick={() => navigate('library')}>Abrir biblioteca →</button></div>
              <MediaGrid items={items.slice(0, 6)} onOpen={(item) => setSelectedId(item.id)} emptyTitle="Tu biblioteca está vacía." emptyText="Ve a Descubrir y agrega tu primer título." />
            </section>
          </>
        )}

        {listPage && (
          <section className="section-block page-list-block">
            <div className="section-heading library-heading">
              <div><p className="eyebrow">{visibleItems.length} {visibleItems.length === 1 ? 'título' : 'títulos'}</p><h2>{page === 'library' ? 'Todo lo que agregaste' : meta.title}</h2></div>
              <div className="filters">
                {(['all', 'movie', 'series', 'anime'] as const).map((value) => (
                  <button key={value} className={filter === value ? 'filter active' : 'filter'} type="button" onClick={() => setFilter(value)}>{value === 'all' ? 'Todo' : typeLabels[value]}</button>
                ))}
              </div>
            </div>
            <MediaGrid items={visibleItems} onOpen={(item) => setSelectedId(item.id)} emptyTitle={query ? 'No encontramos coincidencias.' : `No hay títulos en ${meta.title.toLowerCase()}.`} emptyText={query ? 'Prueba con otro nombre o cambia los filtros.' : page === 'wishlist' ? 'Agrega títulos desde Descubrir; entrarán aquí como Pendientes.' : 'Puedes cambiar el estado desde la ficha de cualquier título.'} />
          </section>
        )}

        {page === 'discover' && <DiscoverPanel enabled={Boolean(session)} existingKeys={existingCatalogKeys} onAdd={addTmdbItem} />}

        {page === 'collections' && (
          <section className="section-block collections-page">
            <div className="collections-grid">
              <article className="collection-card featured-collection"><span>Colección sugerida</span><strong>Marvel · MCU</strong><p>Ideal para ordenar tu preparación antes de Doomsday.</p><button type="button" disabled>Próximamente</button></article>
              <article className="collection-card"><span>Personalizadas</span><strong>Crea tus propias listas</strong><p>Sagas, recomendaciones, pendientes de fin de semana y más.</p><button type="button" disabled>Próximo módulo</button></article>
            </div>
          </section>
        )}
      </main>

      {selectedItem && session && (
        <MediaDetail
          item={selectedItem}
          onClose={() => setSelectedId(null)}
          onEdit={() => setEditorId(selectedItem.id)}
          onAdvance={selectedItem.type !== 'movie' ? () => advanceEpisode(selectedItem.id) : undefined}
        />
      )}

      {editorItem && session && (
        <MediaEditor
          item={editorItem}
          onClose={() => setEditorId(null)}
          onSave={saveEditorItem}
          onDelete={deleteEditorItem}
        />
      )}
    </div>
  )
}
