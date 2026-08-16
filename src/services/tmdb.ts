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
  voteCount?: number
  popularity: number
}

export type TmdbSeasonSummary = {
  seasonNumber: number
  name: string
  episodeCount: number
  airDate: string | null
  posterUrl: string | null
}

export type TmdbEpisodeSummary = {
  episodeNumber: number
  name: string
  overview: string
  airDate: string | null
  runtime: number | null
  stillUrl: string | null
  rating: number | null
}

export type TmdbRelatedItem = {
  externalId: string
  mediaType: 'movie' | 'series'
  title: string
  posterUrl: string | null
  releaseYear: number | null
  rating: number | null
  voteCount: number
}

export type TmdbMediaDetails = {
  externalId: string
  mediaType: 'movie' | 'series'
  title: string
  originalTitle: string
  overview: string
  tagline: string | null
  posterUrl: string | null
  backdropUrl: string | null
  releaseDate: string | null
  releaseYear: number | null
  rating: number | null
  voteCount: number
  runtime: number | null
  genres: string[]
  totalSeasons: number | null
  totalEpisodes: number | null
  seasons: TmdbSeasonSummary[]
  related: TmdbRelatedItem[]
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

type TmdbDetailsResponse = {
  details?: TmdbMediaDetails
  episodes?: TmdbEpisodeSummary[]
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

export async function findTmdbMetadata(title: string, externalId?: string) {
  const results = await searchTmdb(title)
  if (!externalId) return results[0] ?? null
  return results.find((item) => item.externalId === externalId) ?? results[0] ?? null
}

export async function getTmdbDetails(externalId: string, mediaType: 'movie' | 'series') {
  const client = requireSupabase()
  const { data, error } = await client.functions.invoke<TmdbDetailsResponse>('tmdb-details', {
    body: { externalId, mediaType, action: 'details' },
  })

  if (error) throw error
  if (!data?.details) throw new Error('TMDB no devolvió detalles para este título.')
  return data.details
}

export async function getTmdbSeasonEpisodes(externalId: string, seasonNumber: number) {
  const client = requireSupabase()
  const { data, error } = await client.functions.invoke<TmdbDetailsResponse>('tmdb-details', {
    body: { externalId, mediaType: 'series', action: 'season', seasonNumber },
  })

  if (error) throw error
  return data?.episodes ?? []
}
