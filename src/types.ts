export type MediaType = 'movie' | 'series' | 'anime'
export type WatchStatus = 'planned' | 'watching' | 'completed' | 'paused' | 'dropped'

export interface LibraryItem {
  id: string
  title: string
  type: MediaType
  status: WatchStatus
  year: number
  currentEpisode?: number
  totalEpisodes?: number
  score?: number
  collection?: string
  accent: string
}
