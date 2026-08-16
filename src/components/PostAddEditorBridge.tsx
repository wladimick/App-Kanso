import { useEffect, useMemo, useState } from 'react'
import type { Database } from '../lib/database.types'
import { useAuth } from '../hooks/useAuth'
import { deleteLibraryItem, updateLibraryItem } from '../services/library'
import type { LibraryItem, LibraryItemPatch } from '../types'
import { MediaEditor } from './MediaEditor'

type LibraryRow = Database['public']['Tables']['library_items']['Row']

function initials(title: string) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'K'
}

function rowToItem(row: LibraryRow): LibraryItem | null {
  if (row.media_type === 'manga') return null

  return {
    id: row.id,
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
  }
}

export function PostAddEditorBridge() {
  const { session } = useAuth()
  const [row, setRow] = useState<LibraryRow | null>(null)

  useEffect(() => {
    const handleAdded = (event: Event) => {
      const customEvent = event as CustomEvent<{ row?: LibraryRow }>
      if (customEvent.detail?.row) setRow(customEvent.detail.row)
    }

    window.addEventListener('kanso:item-added', handleAdded)
    return () => window.removeEventListener('kanso:item-added', handleAdded)
  }, [])

  const item = useMemo(() => row ? rowToItem(row) : null, [row])

  if (!session || !row || !item || row.user_id !== session.user.id) return null

  const save = async (patch: LibraryItemPatch) => {
    const updated = await updateLibraryItem(session.user.id, row.id, {
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
    setRow(updated)
    window.dispatchEvent(new Event('kanso:library-refresh'))
  }

  const remove = async () => {
    await deleteLibraryItem(session.user.id, row.id)
    setRow(null)
    window.dispatchEvent(new Event('kanso:library-refresh'))
  }

  return (
    <MediaEditor
      item={item}
      onClose={() => setRow(null)}
      onSave={save}
      onDelete={remove}
    />
  )
}
