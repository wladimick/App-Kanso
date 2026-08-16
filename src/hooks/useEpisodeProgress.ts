import { useCallback, useEffect, useMemo, useState } from 'react'
import { listWatchedEpisodes, setEpisodeWatched } from '../services/episodeProgress'

export function useEpisodeProgress(userId?: string, libraryItemId?: string) {
  const [watched, setWatched] = useState<Set<string>>(() => new Set())
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!userId || !libraryItemId) {
      setWatched(new Set())
      return
    }
    setLoading(true)
    try {
      const rows = await listWatchedEpisodes(userId, libraryItemId)
      setWatched(new Set(rows.map((row) => `${row.season}:${row.episode}`)))
    } catch (error) {
      console.error('No fue posible cargar el seguimiento por episodio.', error)
      setWatched(new Set())
    } finally {
      setLoading(false)
    }
  }, [libraryItemId, userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const toggle = useCallback(async (season: number, episode: number) => {
    if (!userId || !libraryItemId) return false
    const key = `${season}:${episode}`
    const next = !watched.has(key)
    setWatched((current) => {
      const copy = new Set(current)
      if (next) copy.add(key)
      else copy.delete(key)
      return copy
    })
    try {
      await setEpisodeWatched(userId, libraryItemId, season, episode, next)
      return next
    } catch (error) {
      console.error('No fue posible guardar el episodio.', error)
      await refresh()
      throw error
    }
  }, [libraryItemId, refresh, userId, watched])

  return useMemo(() => ({ watched, loading, refresh, toggle }), [loading, refresh, toggle, watched])
}
