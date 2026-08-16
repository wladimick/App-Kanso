export type MediaType = 'movie' | 'series' | 'anime'
export type WatchStatus = 'planned' | 'watching' | 'completed' | 'paused' | 'dropped'

export interface LibraryItem {
  id: string
  source?: 'tmdb' | 'anilist' | 'manual'
  externalId?: string
  title: string
  type: MediaType
  status: WatchStatus
  year: number
  posterUrl?: string
  backdropUrl?: string
  overview?: string
  tmdbRating?: number
  tmdbVoteCount?: number
  currentSeason?: number
  currentEpisode?: number
  totalSeasons?: number
  totalEpisodes?: number
  score?: number
  favorite?: boolean
  notes?: string
  collection?: string
  accent: string
}

export type LibraryItemPatch = {
  type?: MediaType
  status?: WatchStatus
  currentSeason?: number | null
  currentEpisode?: number | null
  totalSeasons?: number | null
  totalEpisodes?: number | null
  score?: number | null
  favorite?: boolean
  notes?: string | null
}
