import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useEpisodeProgress } from '../hooks/useEpisodeProgress'
import {
  getTmdbDetails,
  getTmdbSeasonEpisodes,
  type TmdbEpisodeSummary,
  type TmdbMediaDetails,
  type TmdbSearchResult,
} from '../services/tmdb'
import type { LibraryItem } from '../types'
import { loadCardMetadata } from './TmdbRating'

type Props = {
  item: LibraryItem
  onClose: () => void
  onEdit: () => void
  onAdvance?: () => void
  onSetEpisode?: (season: number, episode: number) => Promise<void> | void
}

const statusLabels = {
  planned: 'Lista de deseos',
  watching: 'Viendo ahora',
  completed: 'Visto completo',
  paused: 'Pausado',
  dropped: 'Abandonado',
} as const

function formatVotes(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`
  return String(value)
}

function runtimeText(minutes: number | null) {
  if (!minutes) return null
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest} min`
  return `${hours} h${rest ? ` ${rest} min` : ''}`
}

function BasicDetail({ item, metadata }: { item: LibraryItem; metadata: TmdbSearchResult | null }) {
  const rating = metadata?.rating ?? item.tmdbRating
  return (
    <>
      {(metadata?.backdropUrl || item.backdropUrl) && (
        <div className="detail-backdrop-image">
          <img src={metadata?.backdropUrl ?? item.backdropUrl} alt="" />
          <span />
        </div>
      )}
      <div className="detail-main-copy">
        <div className="detail-kicker-row">
          <span>{item.type === 'movie' ? 'Película' : item.type === 'anime' ? 'Anime' : 'Serie'}</span>
          <span>{metadata?.releaseYear ?? item.year}</span>
          <span>{statusLabels[item.status]}</span>
        </div>
        <h2>{item.title}</h2>
        {rating != null && rating > 0 && (
          <div className="detail-rating-row">
            <span className="detail-rating-badge"><b>TMDB</b><strong>{Math.round(rating * 10)}%</strong><small>{rating.toFixed(1)}/10</small></span>
          </div>
        )}
        <p className="detail-overview">{metadata?.overview || item.overview || 'TMDB no tiene una descripción disponible en español para este título.'}</p>
      </div>
    </>
  )
}

export function MediaDetail({ item, onClose, onEdit, onAdvance, onSetEpisode }: Props) {
  const { session } = useAuth()
  const { watched, loading: progressLoading, toggle } = useEpisodeProgress(session?.user.id, item.id)
  const [details, setDetails] = useState<TmdbMediaDetails | null>(null)
  const [fallback, setFallback] = useState<TmdbSearchResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  const [episodes, setEpisodes] = useState<TmdbEpisodeSummary[]>([])
  const [episodesLoading, setEpisodesLoading] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setDetails(null)
    setFallback(null)
    setSelectedSeason(null)
    setEpisodes([])

    const run = async () => {
      if (item.source === 'tmdb' && item.externalId) {
        try {
          const rich = await getTmdbDetails(item.externalId, item.type === 'movie' ? 'movie' : 'series')
          if (!active) return
          setDetails(rich)
          setLoading(false)
          return
        } catch {
          const basic = await loadCardMetadata(item)
          if (!active) return
          setFallback(basic)
          setLoading(false)
          return
        }
      }
      setLoading(false)
    }

    void run()
    return () => { active = false }
  }, [item.externalId, item.id, item.source, item.title, item.type])

  useEffect(() => {
    if (!details?.seasons?.length || item.type === 'movie') return
    const preferred = item.currentSeason && details.seasons.some((season) => season.seasonNumber === item.currentSeason)
      ? item.currentSeason
      : details.seasons[0]?.seasonNumber
    if (preferred != null && selectedSeason == null) void selectSeason(preferred)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details?.seasons, item.currentSeason, item.type])

  const progressText = useMemo(() => {
    if (item.type === 'movie') return item.status === 'completed' ? 'Película completada' : statusLabels[item.status]
    if (item.status === 'completed') return 'Serie completada'
    if (item.currentEpisode == null) return statusLabels[item.status]
    return `Temporada ${item.currentSeason ?? 1} · Episodio ${item.currentEpisode}`
  }, [item])

  const selectSeason = async (seasonNumber: number) => {
    if (!item.externalId) return
    setSelectedSeason(seasonNumber)
    setEpisodesLoading(true)
    setEpisodes([])
    try {
      setEpisodes(await getTmdbSeasonEpisodes(item.externalId, seasonNumber))
    } catch {
      setEpisodes([])
    } finally {
      setEpisodesLoading(false)
    }
  }

  const toggleEpisode = async (season: number, episode: number) => {
    const nowWatched = await toggle(season, episode)
    if (nowWatched && onSetEpisode) await onSetEpisode(season, episode)
  }

  const backdrop = details?.backdropUrl ?? fallback?.backdropUrl ?? item.backdropUrl
  const poster = details?.posterUrl ?? fallback?.posterUrl ?? item.posterUrl
  const rating = details?.rating ?? fallback?.rating ?? item.tmdbRating
  const year = details?.releaseYear ?? fallback?.releaseYear ?? item.year
  const overview = details?.overview || fallback?.overview || item.overview

  return (
    <div className="media-detail-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <article className="media-detail" role="dialog" aria-modal="true" aria-label={`Ficha de ${item.title}`}>
        <button className="detail-close" type="button" onClick={onClose} aria-label="Cerrar ficha">×</button>

        <section className="detail-hero">
          {backdrop ? (
            <div className="detail-backdrop-image"><img src={backdrop} alt="" /><span /></div>
          ) : <div className="detail-backdrop-placeholder" />}

          <div className="detail-hero-content">
            <div className="detail-poster">{poster ? <img src={poster} alt={`Poster de ${item.title}`} /> : <span>{item.accent}</span>}</div>
            <div className="detail-main-copy">
              <div className="detail-kicker-row">
                <span>{item.type === 'movie' ? 'Película' : item.type === 'anime' ? 'Anime' : 'Serie'}</span>
                <span>{year}</span>
                {details?.totalSeasons ? <span>{details.totalSeasons} temporadas</span> : null}
                {details?.runtime ? <span>{runtimeText(details.runtime)}</span> : null}
              </div>
              <h2>{details?.title ?? item.title}</h2>
              {details?.tagline && <p className="detail-tagline">{details.tagline}</p>}
              <div className="detail-rating-row">
                {rating != null && rating > 0 && (
                  <span className="detail-rating-badge"><b>TMDB</b><strong>{Math.round(rating * 10)}%</strong><small>{rating.toFixed(1)}/10{details?.voteCount ? ` · ${formatVotes(details.voteCount)} votos` : ''}</small></span>
                )}
                {item.score != null && <span className="detail-user-score"><b>Tu nota</b><strong>★ {item.score}/10</strong></span>}
              </div>
              {details?.genres?.length ? <p className="detail-genres">{details.genres.join(' · ')}</p> : null}
              <p className="detail-overview">{overview || (loading ? 'Cargando descripción…' : 'TMDB no tiene una descripción disponible en español para este título.')}</p>
            </div>
          </div>
        </section>

        <section className="detail-actions-bar">
          <button type="button" className={item.status === 'planned' ? 'detail-action active' : 'detail-action'} onClick={onEdit}><span>♡</span><strong>{item.status === 'planned' ? 'En mi lista' : 'Seguimiento'}</strong></button>
          <button type="button" className={item.status === 'completed' ? 'detail-action active' : 'detail-action'} onClick={onEdit}><span>✓</span><strong>{item.status === 'completed' ? 'Visto todo' : 'Marcar visto'}</strong></button>
          <button type="button" className={item.favorite ? 'detail-action active' : 'detail-action'} onClick={onEdit}><span>★</span><strong>Favorito</strong></button>
          <button type="button" className="detail-action" onClick={onEdit}><span>✎</span><strong>Editar</strong></button>
        </section>

        <section className="detail-section progress-detail-section">
          <div className="detail-section-heading"><div><span>Tu progreso</span><h3>{progressText}</h3></div><button type="button" onClick={onEdit}>Editar seguimiento</button></div>
          {item.type !== 'movie' && (
            <div className="detail-progress-card">
              <div><strong>T{item.currentSeason ?? 1} · E{item.currentEpisode ?? 0}</strong><span>{details?.totalEpisodes ? `de ${details.totalEpisodes} episodios` : 'Progreso guardado en Kanso'}</span></div>
              {item.status === 'watching' && onAdvance && <button type="button" onClick={onAdvance}>+1 episodio</button>}
            </div>
          )}
        </section>

        {details?.seasons?.length ? (
          <section className="detail-section">
            <div className="detail-section-heading"><div><span>Temporadas</span><h3>{details.totalSeasons} temporadas · {details.totalEpisodes ?? '—'} episodios</h3></div></div>
            <div className="season-strip">
              {details.seasons.map((season) => (
                <button type="button" key={season.seasonNumber} className={selectedSeason === season.seasonNumber ? 'season-card active' : 'season-card'} onClick={() => void selectSeason(season.seasonNumber)}>
                  <div>{season.posterUrl ? <img src={season.posterUrl} alt="" /> : <span>T{season.seasonNumber}</span>}</div>
                  <strong>{season.name}</strong>
                  <small>{season.episodeCount} episodios</small>
                </button>
              ))}
            </div>
            {selectedSeason != null && (
              <div className="episode-panel">
                <div className="episode-panel-title"><strong>Temporada {selectedSeason}</strong><span>{episodesLoading ? 'Cargando episodios…' : `${episodes.length} episodios · toca ✓ para marcar`}</span></div>
                {!episodesLoading && episodes.length > 0 && (
                  <div className="episode-list">
                    {episodes.map((episode) => {
                      const key = `${selectedSeason}:${episode.episodeNumber}`
                      const isWatched = watched.has(key)
                      const isCurrent = (item.currentSeason ?? 1) === selectedSeason && item.currentEpisode === episode.episodeNumber
                      return (
                        <article key={episode.episodeNumber} className={`${isCurrent ? 'episode-row current' : 'episode-row'}${isWatched ? ' watched' : ''}`}>
                          <div className="episode-still">{episode.stillUrl ? <img src={episode.stillUrl} alt="" /> : <span>E{episode.episodeNumber}</span>}</div>
                          <div className="episode-copy"><span>Episodio {episode.episodeNumber}</span><strong>{episode.name}</strong>{episode.overview && <p>{episode.overview}</p>}</div>
                          <button
                            type="button"
                            className={isWatched ? 'episode-check active' : 'episode-check'}
                            aria-label={isWatched ? `Desmarcar episodio ${episode.episodeNumber}` : `Marcar episodio ${episode.episodeNumber} como visto`}
                            disabled={progressLoading}
                            onClick={() => void toggleEpisode(selectedSeason, episode.episodeNumber)}
                          >✓</button>
                        </article>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </section>
        ) : null}

        {details?.related?.length ? (
          <section className="detail-section related-section">
            <div className="detail-section-heading"><div><span>Más para descubrir</span><h3>Relacionados</h3></div></div>
            <div className="related-strip">
              {details.related.map((related) => (
                <article className="related-card" key={`${related.mediaType}:${related.externalId}`}>
                  <div className="related-poster">{related.posterUrl ? <img src={related.posterUrl} alt={`Poster de ${related.title}`} /> : <span>?</span>}</div>
                  <div className="related-rating"><b>TMDB</b><strong>{related.rating ? `${Math.round(related.rating * 10)}%` : '—'}</strong></div>
                  <strong className="related-title">{related.title}</strong>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {!details && !loading && fallback && (
          <section className="detail-section detail-basic-note">
            <BasicDetail item={item} metadata={fallback} />
            <p>La ficha básica está disponible. Temporadas, episodios y relacionados aparecerán cuando el servicio de detalle TMDB esté activo.</p>
          </section>
        )}
      </article>
    </div>
  )
}
