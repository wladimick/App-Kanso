import { useCallback, useEffect, useState } from 'react'
import type { Database } from '../lib/database.types'
import {
  addLibraryItem,
  deleteLibraryItem,
  listLibrary,
  updateLibraryItem,
  updateProgress,
  type LibraryItemInput,
  type LibraryItemUpdateInput,
} from '../services/library'

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

  useEffect(() => {
    const handleRefresh = () => void refresh()
    window.addEventListener('kanso:library-refresh', handleRefresh)
    return () => window.removeEventListener('kanso:library-refresh', handleRefresh)
  }, [refresh])

  const addItem = useCallback(async (item: LibraryItemInput) => {
    if (!userId) return null

    try {
      const added = await addLibraryItem(userId, item)
      setRows((current) => {
        const withoutExisting = current.filter((row) => row.id !== added.id)
        return [added, ...withoutExisting]
      })
      setError(null)
      window.dispatchEvent(new CustomEvent('kanso:item-added', { detail: { row: added } }))
      return added
    } catch (cause) {
      console.error('No fue posible agregar el título a Supabase.', cause)
      setError(cause instanceof Error ? cause.message : 'No fue posible agregar el título.')
      throw cause
    }
  }, [userId])

  const editItem = useCallback(async (id: string, patch: LibraryItemUpdateInput) => {
    if (!userId) return null

    try {
      const updated = await updateLibraryItem(userId, id, patch)
      setRows((current) => current.map((row) => row.id === updated.id ? updated : row))
      setError(null)
      return updated
    } catch (cause) {
      console.error('No fue posible editar el título en Supabase.', cause)
      setError(cause instanceof Error ? cause.message : 'No fue posible guardar los cambios.')
      throw cause
    }
  }, [userId])

  const removeItem = useCallback(async (id: string) => {
    if (!userId) return

    try {
      await deleteLibraryItem(userId, id)
      setRows((current) => current.filter((row) => row.id !== id))
      setError(null)
    } catch (cause) {
      console.error('No fue posible eliminar el título de Supabase.', cause)
      setError(cause instanceof Error ? cause.message : 'No fue posible eliminar el título.')
      throw cause
    }
  }, [userId])

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
    addItem,
    editItem,
    removeItem,
    advanceEpisode,
  }
}
