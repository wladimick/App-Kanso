import { requireSupabase } from '../lib/supabase'
import type { TmdbSearchResult } from './tmdb'

export type MarvelCatalogResponse = {
  page: number
  results: TmdbSearchResult[]
  hasMore: boolean
  companies: Array<{ id: number; name: string }>
}

export async function fetchMarvelCatalog(page = 1) {
  const client = requireSupabase()
  const { data, error } = await client.functions.invoke<MarvelCatalogResponse>('tmdb-marvel', {
    body: { page },
  })

  if (error) throw error
  return data ?? { page, results: [], hasMore: false, companies: [] }
}
