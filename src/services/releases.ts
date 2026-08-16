import { requireSupabase } from '../lib/supabase'
import type { TmdbSearchResult } from './tmdb'

export type ReleaseFilter = 'all' | 'movie' | 'series'

export type ReleasesResponse = {
  results: TmdbSearchResult[]
  generatedAt: string
}

export async function fetchUpcomingReleases(filter: ReleaseFilter = 'all') {
  const client = requireSupabase()
  const { data, error } = await client.functions.invoke<ReleasesResponse>('tmdb-releases', {
    body: { filter },
  })
  if (error) throw error
  return data?.results ?? []
}
