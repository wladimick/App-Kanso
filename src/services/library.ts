import { requireSupabase } from '../lib/supabase'
import type { DatabaseWatchStatus, MediaSource, DatabaseMediaType } from '../lib/database.types'

export type LibraryItemInput = {
  source: MediaSource
  externalId: string
  mediaType: DatabaseMediaType
  title: string
  originalTitle?: string | null
  posterUrl?: string | null
  releaseYear?: number | null
  totalSeasons?: number | null
  totalEpisodes?: number | null
  status?: DatabaseWatchStatus
}

export type LibraryItemUpdateInput = {
  mediaType?: DatabaseMediaType
  status?: DatabaseWatchStatus
  currentSeason?: number | null
  currentEpisode?: number | null
  totalSeasons?: number | null
  totalEpisodes?: number | null
  score?: number | null
  favorite?: boolean
  notes?: string | null
}

export async function listLibrary(userId: string) {
  const client = requireSupabase()
  const { data, error } = await client
    .from('library_items')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data
}

async function findLibraryItem(
  userId: string,
  source: MediaSource,
  externalId: string,
  mediaType: DatabaseMediaType,
) {
  const client = requireSupabase()
  const { data, error } = await client
    .from('library_items')
    .select('*')
    .eq('user_id', userId)
    .eq('source', source)
    .eq('external_id', externalId)
    .eq('media_type', mediaType)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function addLibraryItem(userId: string, item: LibraryItemInput) {
  const existing = await findLibraryItem(userId, item.source, item.externalId, item.mediaType)
  if (existing) return existing

  const client = requireSupabase()
  const now = new Date().toISOString()
  const { data, error } = await client
    .from('library_items')
    .insert({
      user_id: userId,
      source: item.source,
      external_id: item.externalId,
      media_type: item.mediaType,
      title: item.title,
      original_title: item.originalTitle ?? null,
      poster_url: item.posterUrl ?? null,
      release_year: item.releaseYear ?? null,
      status: item.status ?? 'planned',
      current_season: null,
      current_episode: null,
      total_seasons: item.totalSeasons ?? null,
      total_episodes: item.totalEpisodes ?? null,
      score: null,
      notes: null,
      started_at: null,
      completed_at: null,
      updated_at: now,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      const duplicated = await findLibraryItem(userId, item.source, item.externalId, item.mediaType)
      if (duplicated) return duplicated
    }
    throw error
  }

  return data
}

export async function updateLibraryItem(
  userId: string,
  libraryItemId: string,
  patch: LibraryItemUpdateInput,
) {
  const client = requireSupabase()
  const now = new Date().toISOString()
  const status = patch.status

  const updates = {
    media_type: patch.mediaType,
    status,
    current_season: patch.currentSeason,
    current_episode: patch.currentEpisode,
    total_seasons: patch.totalSeasons,
    total_episodes: patch.totalEpisodes,
    score: patch.score,
    favorite: patch.favorite,
    notes: patch.notes,
    started_at: status === 'watching' ? now.slice(0, 10) : undefined,
    completed_at: status === 'completed' ? now.slice(0, 10) : status ? null : undefined,
    updated_at: now,
  }

  const { data, error } = await client
    .from('library_items')
    .update(updates)
    .eq('id', libraryItemId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteLibraryItem(userId: string, libraryItemId: string) {
  const client = requireSupabase()
  const { error } = await client
    .from('library_items')
    .delete()
    .eq('id', libraryItemId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function updateProgress(
  userId: string,
  libraryItemId: string,
  progress: { season?: number | null; episode?: number | null; status?: DatabaseWatchStatus },
) {
  const client = requireSupabase()
  const now = new Date().toISOString()
  const updates = {
    current_season: progress.season ?? null,
    current_episode: progress.episode ?? null,
    status: progress.status ?? 'watching',
    started_at: progress.status === 'watching' ? now.slice(0, 10) : undefined,
    completed_at: progress.status === 'completed' ? now.slice(0, 10) : null,
    updated_at: now,
  }

  const { data, error } = await client
    .from('library_items')
    .update(updates)
    .eq('id', libraryItemId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error

  const { error: eventError } = await client.from('watch_events').insert({
    user_id: userId,
    library_item_id: libraryItemId,
    event_type: progress.status === 'completed' ? 'completed' : 'progress',
    season: progress.season ?? null,
    episode: progress.episode ?? null,
    score: null,
  })

  if (eventError) throw eventError
  return data
}
