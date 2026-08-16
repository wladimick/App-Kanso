import { useEffect, useState } from 'react'
import { findTmdbMetadata, type TmdbSearchResult } from '../services/tmdb'
import type { LibraryItem } from '../types'

const metadataCache = new Map<string, Promise<TmdbSearchResult | null>>()

function cacheKey(item: LibraryItem) {
  return `${item.source ?? 'unknown'}:${item.externalId ?? item.title}`
}

export function loadCardMetadata(item: LibraryItem) {
  if (item.source !== 'tmdb' || !item.externalId) return Promise.resolve(null)
  const key = cacheKey(item)
  const existing = metadataCache.get(key)
  if (existing) return existing

  const request = findTmdbMetadata(item.title, item.externalId).catch(() => null)
  metadataCache.set(key, request)
  return request
}

export function TmdbRating({ item, compact = false }: { item: LibraryItem; compact?: boolean }) {
  const [metadata, setMetadata] = useState<TmdbSearchResult | null>(null)

  useEffect(() => {
    let active = true
    void loadCardMetadata(item).then((result) => {
      if (active) setMetadata(result)
    })
    return () => { active = false }
  }, [item.externalId, item.source, item.title])

  const rating = item.tmdbRating ?? metadata?.rating
  if (rating == null || rating <= 0) return <span className="tmdb-rating muted">TMDB —</span>

  const percentage = Math.round(rating * 10)
  return (
    <span className={compact ? 'tmdb-rating compact' : 'tmdb-rating'} title={`TMDB ${rating.toFixed(1)}/10`}>
      <b>TMDB</b>
      <strong>{percentage}%</strong>
      {!compact && <small>{rating.toFixed(1)}/10</small>}
    </span>
  )
}
