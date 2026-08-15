export type MediaSource = 'tmdb' | 'anilist' | 'manual'
export type DatabaseMediaType = 'movie' | 'series' | 'anime' | 'manga'
export type DatabaseWatchStatus = 'planned' | 'watching' | 'completed' | 'paused' | 'dropped'
export type WatchEventType = 'started' | 'progress' | 'completed' | 'rewatched' | 'rated'

type LibraryItemRow = {
  id: string
  user_id: string
  source: MediaSource
  external_id: string
  media_type: DatabaseMediaType
  title: string
  original_title: string | null
  poster_url: string | null
  release_year: number | null
  status: DatabaseWatchStatus
  current_season: number | null
  current_episode: number | null
  total_seasons: number | null
  total_episodes: number | null
  score: number | null
  favorite: boolean
  notes: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

type CollectionRow = {
  id: string
  user_id: string
  name: string
  slug: string
  description: string | null
  created_at: string
  updated_at: string
}

type CollectionItemRow = {
  user_id: string
  collection_id: string
  library_item_id: string
  sort_order: number
  notes: string | null
  created_at: string
}

type WatchEventRow = {
  id: string
  user_id: string
  library_item_id: string
  event_type: WatchEventType
  season: number | null
  episode: number | null
  score: number | null
  watched_at: string
}

export type Database = {
  public: {
    Tables: {
      library_items: {
        Row: LibraryItemRow
        Insert: Omit<LibraryItemRow, 'id' | 'created_at' | 'updated_at' | 'favorite'> & {
          id?: string
          favorite?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<LibraryItemRow, 'id' | 'user_id' | 'created_at'>> & { updated_at?: string }
        Relationships: []
      }
      collections: {
        Row: CollectionRow
        Insert: Omit<CollectionRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<CollectionRow, 'id' | 'user_id' | 'created_at'>> & { updated_at?: string }
        Relationships: []
      }
      collection_items: {
        Row: CollectionItemRow
        Insert: Omit<CollectionItemRow, 'created_at' | 'sort_order'> & {
          sort_order?: number
          created_at?: string
        }
        Update: Partial<Pick<CollectionItemRow, 'sort_order' | 'notes'>>
        Relationships: []
      }
      watch_events: {
        Row: WatchEventRow
        Insert: Omit<WatchEventRow, 'id' | 'watched_at'> & {
          id?: string
          watched_at?: string
        }
        Update: Partial<Pick<WatchEventRow, 'event_type' | 'season' | 'episode' | 'score' | 'watched_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
