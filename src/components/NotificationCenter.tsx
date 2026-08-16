import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLibrary } from '../hooks/useLibrary'
import { fetchUpcomingReleases } from '../services/releases'
import type { TmdbSearchResult } from '../services/tmdb'

type Preferences = {
  wishlistReleases: boolean
  upcoming: boolean
  marvel: boolean
}

const defaults: Preferences = { wishlistReleases: true, upcoming: true, marvel: true }

function key(userId: string, suffix: string) { return `kanso:${userId}:${suffix}` }

function daysUntil(date: string | null) {
  if (!date) return null
  const target = new Date(`${date}T12:00:00`)
  const today = new Date(); today.setHours(12,0,0,0)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

export function NotificationCenter() {
  const { session } = useAuth()
  const { rows } = useLibrary(session?.user.id)
  const [open, setOpen] = useState(false)
  const [releases, setReleases] = useState<TmdbSearchResult[]>([])
  const [seen, setSeen] = useState<string[]>([])
  const [prefs, setPrefs] = useState<Preferences>(defaults)

  useEffect(() => {
    if (!session) return
    const storedSeen = localStorage.getItem(key(session.user.id, 'notifications-seen'))
    const storedPrefs = localStorage.getItem(key(session.user.id, 'notification-preferences'))
    if (storedSeen) setSeen(JSON.parse(storedSeen) as string[])
    if (storedPrefs) setPrefs({ ...defaults, ...(JSON.parse(storedPrefs) as Partial<Preferences>) })
    void fetchUpcomingReleases('all').then(setReleases).catch(() => setReleases([]))
  }, [session?.user.id])

  const notifications = useMemo(() => {
    if (!session) return []
    const byKey = new Map(releases.map((item) => [`tmdb:${item.externalId}`, item]))
    const list: Array<{ id: string; icon: string; title: string; message: string; view?: string }> = []

    if (prefs.wishlistReleases) {
      for (const row of rows.filter((item) => item.status === 'planned')) {
        const release = byKey.get(`tmdb:${row.external_id}`)
        if (!release) continue
        const days = daysUntil(release.releaseDate)
        if (days == null || days < 0 || days > 14) continue
        list.push({
          id: `wishlist:${row.id}:${release.releaseDate}`,
          icon: days === 0 ? '●' : '◷',
          title: row.title,
          message: days === 0 ? 'Se estrena hoy.' : days === 1 ? 'Se estrena mañana.' : `Se estrena en ${days} días.`,
          view: 'library',
        })
      }
    }

    if (prefs.upcoming) {
      for (const item of releases.slice(0, 4)) {
        const days = daysUntil(item.releaseDate)
        if (days == null || days < 0 || days > 7) continue
        list.push({ id: `release:${item.mediaType}:${item.externalId}:${item.releaseDate}`, icon: '◷', title: item.title, message: days === 0 ? 'Estreno destacado de hoy.' : `Estreno destacado en ${days} días.`, view: 'releases' })
      }
    }

    return list.slice(0, 12)
  }, [prefs, releases, rows, session])

  const unread = notifications.filter((item) => !seen.includes(item.id)).length

  const persistSeen = (next: string[]) => {
    setSeen(next)
    if (session) localStorage.setItem(key(session.user.id, 'notifications-seen'), JSON.stringify(next))
  }

  const markAllRead = () => persistSeen([...new Set([...seen, ...notifications.map((item) => item.id)])])

  const updatePreference = (name: keyof Preferences, value: boolean) => {
    const next = { ...prefs, [name]: value }
    setPrefs(next)
    if (session) localStorage.setItem(key(session.user.id, 'notification-preferences'), JSON.stringify(next))
  }

  const navigate = (view?: string) => {
    if (!view) return
    const url = new URL(window.location.href)
    url.searchParams.set('view', view)
    url.searchParams.delete('focus')
    window.history.pushState({}, '', url)
    window.dispatchEvent(new PopStateEvent('popstate'))
    setOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!session) return null

  return (
    <>
      <button className="notification-trigger" type="button" aria-label={`Notificaciones${unread ? `, ${unread} sin leer` : ''}`} onClick={() => setOpen(true)}>
        <span aria-hidden="true">♢</span>{unread > 0 && <b>{unread > 9 ? '9+' : unread}</b>}
      </button>
      {open && (
        <div className="notification-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
          <aside className="notification-drawer" role="dialog" aria-modal="true" aria-label="Notificaciones">
            <header><div><span className="eyebrow">Actividad</span><h2>Notificaciones</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Cerrar">×</button></header>
            <div className="notification-actions"><span>{unread} sin leer</span>{unread > 0 && <button type="button" onClick={markAllRead}>Marcar todas como leídas</button>}</div>
            <div className="notification-list">
              {notifications.length === 0 ? <div className="notification-empty"><strong>Todo al día.</strong><p>Cuando se acerque un estreno relevante aparecerá aquí.</p></div> : notifications.map((item) => {
                const read = seen.includes(item.id)
                return <button key={item.id} type="button" className={read ? 'notification-item read' : 'notification-item'} onClick={() => { persistSeen([...new Set([...seen, item.id])]); navigate(item.view) }}>
                  <span className="notification-icon">{item.icon}</span><span><strong>{item.title}</strong><small>{item.message}</small></span>{!read && <i />}
                </button>
              })}
            </div>
            <section className="notification-preferences">
              <span className="eyebrow">Preferencias</span>
              <label><span><strong>Estrenos de mi lista</strong><small>Avisa cuando algo pendiente esté cerca.</small></span><input type="checkbox" checked={prefs.wishlistReleases} onChange={(e) => updatePreference('wishlistReleases', e.target.checked)} /></label>
              <label><span><strong>Estrenos destacados</strong><small>Lo más próximo del calendario.</small></span><input type="checkbox" checked={prefs.upcoming} onChange={(e) => updatePreference('upcoming', e.target.checked)} /></label>
            </section>
          </aside>
        </div>
      )}
    </>
  )
}
