import { useMemo, useState } from 'react'
import { useTmdbSearch } from '../hooks/useTmdbSearch'
import type { TmdbSearchResult } from '../services/tmdb'

export type DiscoverPanelProps = {
  enabled: boolean
  existingKeys: Set<string>
  onAdd: (item: TmdbSearchResult) => Promise<unknown>
}

function catalogKey(item: Pick<TmdbSearchResult, 'externalId'>) {
  return `tmdb:${item.externalId}`
}

export function DiscoverPanel({ enabled, existingKeys, onAdd }: DiscoverPanelProps) {
  const [query, setQuery] = useState('')
  const [addingKey, setAddingKey] = useState<string | null>(null)
  const [addError, setAddError] = useState<string | null>(null)
  const { results, loading, error, lastQuery, search } = useTmdbSearch(enabled)

  const hasResults = results.length > 0
  const resultCount = useMemo(() => results.length, [results])

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void search(query)
  }

  const add = async (item: TmdbSearchResult) => {
    const key = catalogKey(item)
    setAddingKey(key)
    setAddError(null)

    try {
      await onAdd(item)
    } catch (cause) {
      setAddError(cause instanceof Error ? cause.message : 'No fue posible agregar el título.')
    } finally {
      setAddingKey(null)
    }
  }

  return (
    <section className="section-block discover-block" id="discover">
      <div className="section-heading discover-heading">
        <div>
          <p className="eyebrow">Catálogo externo</p>
          <h2>Descubrir en TMDB</h2>
        </div>
        <span className="provider-badge">Películas + Series</span>
      </div>

      <form className="discover-search" onSubmit={submit}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={enabled ? 'Busca una película o serie…' : 'Inicia sesión para buscar en TMDB'}
          disabled={!enabled || loading}
          aria-label="Buscar películas y series en TMDB"
        />
        <button type="submit" disabled={!enabled || loading || query.trim().length < 2}>
          {loading ? 'Buscando…' : 'Buscar'}
        </button>
      </form>

      {!enabled && (
        <div className="discover-note">El catálogo externo se habilita al iniciar sesión para que la credencial de TMDB permanezca protegida detrás del servidor.</div>
      )}

      {(error || addError) && (
        <div className="system-message error" role="alert">
          <strong>No pudimos completar la operación.</strong>
          <span>{addError ?? error}</span>
        </div>
      )}

      {enabled && lastQuery && !loading && !hasResults && !error && (
        <div className="empty-state compact">
          <strong>No encontramos resultados para “{lastQuery}”.</strong>
          <p>Prueba con otro título, idioma o nombre original.</p>
        </div>
      )}

      {hasResults && (
        <>
          <div className="discover-summary">{resultCount} resultados principales para “{lastQuery}”</div>
          <div className="discover-grid">
            {results.map((item) => {
              const key = catalogKey(item)
              const alreadyAdded = existingKeys.has(key)
              const isAdding = addingKey === key

              return (
                <article className="discover-card" key={`${key}:${item.mediaType}`}>
                  <div className="discover-poster">
                    {item.posterUrl ? (
                      <img src={item.posterUrl} alt={`Poster de ${item.title}`} loading="lazy" />
                    ) : (
                      <span>{item.title.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="discover-content">
                    <div className="meta">
                      <span>{item.mediaType === 'movie' ? 'Película' : 'Serie'}</span>
                      {item.releaseYear && <span>{item.releaseYear}</span>}
                      {item.rating !== null && <span>★ {item.rating.toFixed(1)}</span>}
                    </div>
                    <h3>{item.title}</h3>
                    {item.originalTitle !== item.title && <small>{item.originalTitle}</small>}
                    <p>{item.overview || 'Sin sinopsis disponible en TMDB.'}</p>
                    <button
                      type="button"
                      className={alreadyAdded ? 'catalog-action added' : 'catalog-action'}
                      onClick={() => void add(item)}
                      disabled={alreadyAdded || isAdding}
                    >
                      {alreadyAdded ? 'Ya está en Kanso' : isAdding ? 'Agregando…' : '+ Agregar a Kanso'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}

      <p className="tmdb-attribution">This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
    </section>
  )
}
