import { useCallback, useEffect, useState } from 'react'
import type { Database } from '../lib/database.types'
import { listLibrary, updateProgress } from '../services/library'

type LibraryRow = Database['public']['Tables']['library_items']['Row']

export function useLibrary(userId?: string) {
  const [rows, setRows] = useState<LibraryRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!userId) {
      setRows([])
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await listLibrary(userId)
      setRows(data)
    } catch (cause) {
      console.error('No fue posible cargar la biblioteca de Supabase.', cause)
      setError(cause instanceof Error ? cause.message : 'No fue posible cargar tu biblioteca.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const advanceEpisode = useCallback(async (row: LibraryRow) => {
    if (!userId || !row.total_episodes) return

    const nextEpisode = Math.min((row.current_episode ?? 0) + 1, row.total_episodes)
    const nextStatus = nextEpisode === row.total_episodes ? 'completed' : 'watching'

    try {
      const updated = await updateProgress(userId, row.id, {
        season: row.current_season,
        episode: nextEpisode,
        status: nextStatus,
      })

      setRows((current) => current.map((item) => item.id === updated.id ? updated : item))
      setError(null)
    } catch (cause) {
      console.error('No fue posible actualizar el progreso en Supabase.', cause)
      setError(cause instanceof Error ? cause.message : 'No fue posible actualizar el progreso.')
    }
  }, [userId])

  return {
    rows,
    loading,
    error,
    refresh,
    advanceEpisode,
  }
}
