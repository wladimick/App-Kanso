import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { addLibraryItem, updateLibraryItem } from '../services/library'
import type { TmdbSearchResult } from '../services/tmdb'
import type { DatabaseWatchStatus } from '../lib/database.types'

type QuickAddDetail = {
  item?: TmdbSearchResult
  status?: Extract<DatabaseWatchStatus, 'planned' | 'completed'>
}

export function QuickAddBridge() {
  const { session } = useAuth()

  useEffect(() => {
    if (!session) return

    const handleQuickAdd = (event: Event) => {
      const detail = (event as CustomEvent<QuickAddDetail>).detail
      if (!detail?.item || !detail.status) return

      const { item, status } = detail

      void (async () => {
        try {
          const added = await addLibraryItem(session.user.id, {
            source: 'tmdb',
            externalId: item.externalId,
            mediaType: item.mediaType,
            title: item.title,
            originalTitle: item.originalTitle,
            posterUrl: item.posterUrl,
            releaseYear: item.releaseYear,
            status,
          })

          if (status === 'completed') {
            await updateLibraryItem(session.user.id, added.id, { status: 'completed' })
          }

          window.dispatchEvent(new Event('kanso:library-refresh'))
          window.dispatchEvent(new CustomEvent('kanso:quick-add-complete', {
            detail: { externalId: item.externalId, status },
          }))
        } catch (error) {
          window.dispatchEvent(new CustomEvent('kanso:quick-add-error', {
            detail: {
              externalId: item.externalId,
              message: error instanceof Error ? error.message : 'No fue posible guardar el título.',
            },
          }))
        }
      })()
    }

    window.addEventListener('kanso:quick-add', handleQuickAdd)
    return () => window.removeEventListener('kanso:quick-add', handleQuickAdd)
  }, [session])

  return null
}
