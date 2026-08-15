import { requireSupabase } from '../lib/supabase'

export type TmdbSearchResult = {
  source: 'tmdb'
  externalId: string
  mediaType: 'movie' | 'series'
  title: string
  originalTitle: string
  overview: string
  posterUrl: string | null
  backdropUrl: string | null
  releaseDate: string | null
  releaseYear: number | null
  rating: number | null
  popularity: number
}

type TmdbSearchResponse = {
  query: string
  page: number
  results: TmdbSearchResult[]
  providers: {
    movies: number
    tv: number
  }
}

export async function searchTmdb(query: string) {
  const client = requireSupabase()
  const normalized = query.trim()

  if (normalized.length < 2) {
    return [] as TmdbSearchResult[]
  }

  const { data, error } = await client.functions.invoke<TmdbSearchResponse>('tmdb-search', {
    body: { query: normalized, page: 1 },
  })

  if (error) throw error
  return data?.results ?? []
}
