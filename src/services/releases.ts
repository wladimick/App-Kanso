import { requireSupabase } from '../lib/supabase'
import type { TmdbSearchResult } from './tmdb'

export type ReleaseFilter = 'all' | 'movie' | 'series'
export type ActualityMode = 'upcoming' | 'trending'

export type ReleasesResponse = {
  results: TmdbSearchResult[]
  generatedAt: string
  page: number
  hasMore: boolean
}

export async function fetchActualityPage(
  mode: ActualityMode,
  filter: ReleaseFilter = 'all',
  page = 1,
) {
  const client = requireSupabase()
  const { data, error } = await client.functions.invoke<ReleasesResponse>('tmdb-releases', {
    body: { mode, filter, page },
  })
  if (error) throw error
  return {
    results: data?.results ?? [],
    page: data?.page ?? page,
    hasMore: Boolean(data?.hasMore),
  }
}

export async function fetchUpcomingReleases(filter: ReleaseFilter = 'all') {
  const response = await fetchActualityPage('upcoming', filter, 1)
  return response.results
}
