export type MediaType = 'movie' | 'series' | 'anime'
export type WatchStatus = 'planned' | 'watching' | 'completed' | 'paused' | 'dropped'

export interface LibraryItem {
  id: string
  title: string
  type: MediaType
  status: WatchStatus
  year: number
  posterUrl?: string
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

export type LibraryItemPatch = Partial<Pick<
  LibraryItem,
  | 'type'
  | 'status'
  | 'currentSeason'
  | 'currentEpisode'
  | 'totalSeasons'
  | 'totalEpisodes'
  | 'score'
  | 'favorite'
  | 'notes'
>>
