import { requireSupabase } from '../lib/supabase'

export type WatchedEpisode = {
  season: number
  episode: number
}

export async function listWatchedEpisodes(userId: string, libraryItemId: string): Promise<WatchedEpisode[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('watch_events')
    .select('season, episode, event_type')
    .eq('user_id', userId)
    .eq('library_item_id', libraryItemId)
    .order('watched_at', { ascending: true })

  if (error) throw error

  const seen = new Set<string>()
  const result: WatchedEpisode[] = []
  for (const row of data) {
    if (row.season == null || row.episode == null) continue
    if (!['progress', 'completed', 'rewatched'].includes(row.event_type)) continue
    const key = `${row.season}:${row.episode}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push({ season: row.season, episode: row.episode })
  }
  return result
}

export async function setEpisodeWatched(
  userId: string,
  libraryItemId: string,
  season: number,
  episode: number,
  watched: boolean,
) {
  const client = requireSupabase()

  if (watched) {
    const { error } = await client.from('watch_events').insert({
      user_id: userId,
      library_item_id: libraryItemId,
      event_type: 'progress',
      season,
      episode,
      score: null,
    })
    if (error) throw error
    return
  }

  const { error } = await client
    .from('watch_events')
    .delete()
    .eq('user_id', userId)
    .eq('library_item_id', libraryItemId)
    .eq('season', season)
    .eq('episode', episode)
    .in('event_type', ['progress', 'rewatched'])

  if (error) throw error
}
