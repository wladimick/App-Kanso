import { useCallback, useState } from 'react'
import { searchTmdb, type TmdbSearchResult } from '../services/tmdb'

export function useTmdbSearch(enabled: boolean) {
  const [results, setResults] = useState<TmdbSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastQuery, setLastQuery] = useState('')

  const search = useCallback(async (query: string) => {
    const normalized = query.trim()

    if (!enabled) {
      setError('Inicia sesión para buscar títulos en TMDB.')
      return
    }

    if (normalized.length < 2) {
      setResults([])
      setError(null)
      setLastQuery(normalized)
      return
    }

    setLoading(true)
    setError(null)
    setLastQuery(normalized)

    try {
      const data = await searchTmdb(normalized)
      setResults(data)
    } catch (cause) {
      console.error('No fue posible buscar en TMDB.', cause)
      setError(cause instanceof Error ? cause.message : 'No fue posible consultar TMDB.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [enabled])

  const clear = useCallback(() => {
    setResults([])
    setError(null)
    setLastQuery('')
  }, [])

  return {
    results,
    loading,
    error,
    lastQuery,
    search,
    clear,
  }
}
