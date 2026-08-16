import { useEffect, useState } from 'react'
import type { LibraryItem, LibraryItemPatch, MediaType, WatchStatus } from '../types'

const statusOptions: Array<{ value: WatchStatus; label: string }> = [
  { value: 'planned', label: 'Lista de deseos' },
  { value: 'watching', label: 'Viendo' },
  { value: 'completed', label: 'Visto / Completado' },
  { value: 'paused', label: 'Pausado' },
  { value: 'dropped', label: 'Abandonado' },
]

const typeOptions: Array<{ value: MediaType; label: string }> = [
  { value: 'movie', label: 'Película' },
  { value: 'series', label: 'Serie' },
  { value: 'anime', label: 'Anime' },
]

type Props = {
  item: LibraryItem
  onClose: () => void
  onSave: (patch: LibraryItemPatch) => Promise<void>
  onDelete: () => Promise<void>
}

function optionalNumber(value: string) {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function MediaEditor({ item, onClose, onSave, onDelete }: Props) {
  const [status, setStatus] = useState<WatchStatus>(item.status)
  const [type, setType] = useState<MediaType>(item.type)
  const [season, setSeason] = useState(item.currentSeason?.toString() ?? '')
  const [episode, setEpisode] = useState(item.currentEpisode?.toString() ?? '')
  const [totalSeasons, setTotalSeasons] = useState(item.totalSeasons?.toString() ?? '')
  const [totalEpisodes, setTotalEpisodes] = useState(item.totalEpisodes?.toString() ?? '')
  const [score, setScore] = useState(item.score?.toString() ?? '')
  const [favorite, setFavorite] = useState(Boolean(item.favorite))
  const [notes, setNotes] = useState(item.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setStatus(item.status)
    setType(item.type)
    setSeason(item.currentSeason?.toString() ?? '')
    setEpisode(item.currentEpisode?.toString() ?? '')
    setTotalSeasons(item.totalSeasons?.toString() ?? '')
    setTotalEpisodes(item.totalEpisodes?.toString() ?? '')
    setScore(item.score?.toString() ?? '')
    setFavorite(Boolean(item.favorite))
    setNotes(item.notes ?? '')
    setMessage(null)
  }, [item])

  const selectQuickStatus = (nextStatus: WatchStatus) => {
    setStatus(nextStatus)
    setMessage(null)

    if (type !== 'movie' && nextStatus === 'watching') {
      if (!season) setSeason('1')
      if (!episode) setEpisode('1')
    }

    if (type !== 'movie' && nextStatus === 'completed') {
      if (totalSeasons) setSeason(totalSeasons)
      if (totalEpisodes) setEpisode(totalEpisodes)
    }
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      await onSave({
        status,
        type,
        currentSeason: type === 'movie' ? null : optionalNumber(season),
        currentEpisode: type === 'movie' ? null : optionalNumber(episode),
        totalSeasons: type === 'movie' ? null : optionalNumber(totalSeasons),
        totalEpisodes: type === 'movie' ? null : optionalNumber(totalEpisodes),
        score: optionalNumber(score),
        favorite,
        notes: notes.trim() || null,
      })
      onClose()
    } catch {
      setMessage('No fue posible guardar los cambios.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!window.confirm(`¿Eliminar “${item.title}” de tu biblioteca?`)) return
    setDeleting(true)
    setMessage(null)
    try {
      await onDelete()
    } catch {
      setMessage('No fue posible eliminar el título.')
      setDeleting(false)
    }
  }

  return (
    <div className="editor-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <aside className="media-editor" role="dialog" aria-modal="true" aria-label={`Editar ${item.title}`}>
        <div className="editor-hero">
          <div className="editor-poster">
            {item.posterUrl ? <img src={item.posterUrl} alt={`Poster de ${item.title}`} /> : <span>{item.accent}</span>}
          </div>
          <div className="editor-heading">
            <span className="editor-kicker">Tu ficha</span>
            <h2>{item.title}</h2>
            <p>{item.year} · {typeOptions.find((option) => option.value === type)?.label}</p>
          </div>
          <button type="button" className="editor-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <form className="editor-form" onSubmit={submit}>
          <section className="editor-quick-status" aria-labelledby={`quick-status-${item.id}`}>
            <div className="editor-quick-heading">
              <div>
                <span className="editor-kicker">Seguimiento rápido</span>
                <h3 id={`quick-status-${item.id}`}>¿Cómo vas con este título?</h3>
              </div>
              <small>Elige una opción y luego guarda.</small>
            </div>
            <div className={type === 'movie' ? 'editor-quick-grid movie' : 'editor-quick-grid'}>
              <button
                type="button"
                className={status === 'planned' ? 'quick-status-card active' : 'quick-status-card'}
                onClick={() => selectQuickStatus('planned')}
              >
                <strong>Lo veré después</strong>
                <span>Queda en tu lista de deseos.</span>
              </button>
              {type !== 'movie' && (
                <button
                  type="button"
                  className={status === 'watching' ? 'quick-status-card active' : 'quick-status-card'}
                  onClick={() => selectQuickStatus('watching')}
                >
                  <strong>Estoy viendo</strong>
                  <span>Indica abajo temporada y episodio.</span>
                </button>
              )}
              <button
                type="button"
                className={status === 'completed' ? 'quick-status-card active' : 'quick-status-card'}
                onClick={() => selectQuickStatus('completed')}
              >
                <strong>Ya lo vi completo</strong>
                <span>Se moverá a Completados.</span>
              </button>
            </div>
          </section>

          <div className="editor-grid">
            <label>
              <span>Estado</span>
              <select value={status} onChange={(event) => setStatus(event.target.value as WatchStatus)}>
                {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span>Tipo</span>
              <select value={type} onChange={(event) => setType(event.target.value as MediaType)}>
                {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>

          {type !== 'movie' && (
            <div className="editor-grid progress-fields">
              <label><span>Temporada actual</span><input type="number" min="0" value={season} onChange={(event) => setSeason(event.target.value)} placeholder="1" /></label>
              <label><span>Episodio actual</span><input type="number" min="0" value={episode} onChange={(event) => setEpisode(event.target.value)} placeholder="1" /></label>
              <label><span>Total temporadas</span><input type="number" min="0" value={totalSeasons} onChange={(event) => setTotalSeasons(event.target.value)} placeholder="—" /></label>
              <label><span>Total episodios</span><input type="number" min="0" value={totalEpisodes} onChange={(event) => setTotalEpisodes(event.target.value)} placeholder="—" /></label>
            </div>
          )}

          <div className="editor-grid score-row">
            <label>
              <span>Tu puntuación</span>
              <input type="number" min="0" max="10" step="0.5" value={score} onChange={(event) => setScore(event.target.value)} placeholder="0–10" />
            </label>
            <label className="favorite-toggle">
              <input type="checkbox" checked={favorite} onChange={(event) => setFavorite(event.target.checked)} />
              <span>★ Marcar como favorito</span>
            </label>
          </div>

          <label className="notes-field">
            <span>Notas personales</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} placeholder="Qué te pareció, dónde quedaste, qué quieres recordar…" />
          </label>

          {message && <p className="editor-message">{message}</p>}

          <div className="editor-actions">
            <button type="button" className="danger-action" onClick={() => void remove()} disabled={saving || deleting}>{deleting ? 'Eliminando…' : 'Eliminar'}</button>
            <div>
              <button type="button" className="secondary-action" onClick={onClose}>Cancelar</button>
              <button type="submit" className="primary-action" disabled={saving || deleting}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
            </div>
          </div>
        </form>
      </aside>
    </div>
  )
}
