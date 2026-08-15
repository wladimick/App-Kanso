import { useMemo, useState } from 'react'
import type { LibraryItem, MediaType, WatchStatus } from './types'

const initialItems: LibraryItem[] = [
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

export default function App() {
  const [items, setItems] = useState(initialItems)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | MediaType>('all')

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return items.filter((item) => {
      const matchesType = filter === 'all' || item.type === filter
      const matchesSearch = !normalized || item.title.toLowerCase().includes(normalized)
      return matchesType && matchesSearch
    })
  }, [items, query, filter])

  const watching = items.filter((item) => item.status === 'watching')
  const completed = items.filter((item) => item.status === 'completed').length
  const planned = items.filter((item) => item.status === 'planned').length

  const advanceEpisode = (id: string) => {
    setItems((current) => current.map((item) => {
      if (item.id !== id || !item.totalEpisodes) return item
      const next = Math.min((item.currentEpisode ?? 0) + 1, item.totalEpisodes)
      return {
        ...item,
        currentEpisode: next,
        status: next === item.totalEpisodes ? 'completed' : 'watching',
      }
    }))
  }

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
          <button className="nav-item">Descubrir</button>
        </nav>

        <div className="sidebar-note">
          <span>Próxima integración</span>
          <strong>TMDB + AniList</strong>
          <p>El catálogo externo se conectará sin mezclarlo con tu progreso personal.</p>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Biblioteca personal</p>
            <h1>¿Qué quieres continuar?</h1>
          </div>
          <label className="search-box">
            <span>⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar en Kanso..." />
          </label>
        </header>

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
          <div className="continue-grid">
            {watching.map((item) => {
              const value = progress(item)
              return (
                <article className="continue-card" key={item.id}>
                  <div className="cover large"><span>{item.accent}</span></div>
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
        </section>

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

          <div className="library-grid">
            {visibleItems.map((item) => (
              <article className="media-card" key={item.id}>
                <div className="cover"><span>{item.accent}</span><em>{labels[item.status]}</em></div>
                <div className="media-body">
                  <div className="meta"><span>{typeLabels[item.type]}</span><span>{item.year}</span></div>
                  <h3>{item.title}</h3>
                  <div className="media-footer">
                    <span>{item.collection ?? 'Biblioteca'}</span>
                    {item.score ? <strong>★ {item.score}/10</strong> : <span>{labels[item.status]}</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
