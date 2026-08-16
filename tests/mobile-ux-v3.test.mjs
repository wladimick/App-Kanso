import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('mobile tab bar promotes releases', async () => {
  const source = await read('src/components/MobileTabBar.tsx')
  assert.match(source, /view: 'releases', label: 'Estrenos'/)
  assert.match(source, /Inicio/)
  assert.match(source, /Biblioteca/)
  assert.match(source, /Agregar/)
  assert.match(source, /Buscar/)
})

test('actuality route is isolated by URL view and supports top mode', async () => {
  const source = await read('src/components/ReleasesRoute.tsx')
  assert.match(source, /get\('view'\) === 'releases'/)
  assert.match(source, /section.*top/)
  assert.match(source, /fetchActualityPage/)
  assert.match(source, /Top actual/)
  assert.match(source, /loadMore/)
  assert.match(source, /status: 'planned'/)
  assert.match(source, /Reintentar/)
})

test('notification center is user scoped in local storage', async () => {
  const source = await read('src/components/NotificationCenter.tsx')
  assert.match(source, /kanso:\$\{userId\}/)
  assert.match(source, /session\.user\.id/)
  assert.match(source, /notifications-seen/)
  assert.match(source, /notification-preferences/)
})

test('notification center supports unread and mark all read', async () => {
  const source = await read('src/components/NotificationCenter.tsx')
  assert.match(source, /const unread/)
  assert.match(source, /markAllRead/)
  assert.match(source, /Marcar todas como leídas/)
})

test('wishlist release notifications use actual library planned rows', async () => {
  const source = await read('src/components/NotificationCenter.tsx')
  assert.match(source, /rows\.filter\(\(item\) => item\.status === 'planned'\)/)
  assert.match(source, /tmdb:\$\{row\.external_id\}/)
})

test('status badges become compact icons without losing aria label', async () => {
  const source = await read('src/components/StatusIconPolish.tsx')
  assert.match(source, /Visto: '✓'/)
  assert.match(source, /Viendo: '▶'/)
  assert.match(source, /Pendiente: '♡'/)
  assert.match(source, /setAttribute\('aria-label', label\)/)
})

test('tmdb releases edge function keeps token server side and requires auth', async () => {
  const source = await read('supabase/functions/tmdb-releases/index.ts')
  assert.match(source, /withSupabase\(\{ auth: "user" \}/)
  assert.match(source, /Deno\.env\.get\("TMDB_READ_ACCESS_TOKEN"\)/)
  assert.doesNotMatch(source, /sb_publishable_SC_/)
})

test('tmdb releases supports upcoming pagination and trending today', async () => {
  const source = await read('supabase/functions/tmdb-releases/index.ts')
  assert.match(source, /release_date\.gte=/)
  assert.match(source, /with_release_type=2\|3\|4\|6/)
  assert.match(source, /air_date\.gte=/)
  assert.match(source, /next_episode_to_air/)
  assert.match(source, /trending\/\$\{media\}\/day/)
  assert.match(source, /page=\$\{page\}/)
  assert.match(source, /hasMore/)
  assert.doesNotMatch(source, /primary_release_date\.gte=/)
})

test('actuality v2 keeps three columns on phones and two on very small screens', async () => {
  const source = await read('src/actuality.css')
  assert.match(source, /grid-template-columns: repeat\(3, minmax\(0,1fr\)\)/)
  assert.match(source, /@media \(max-width: 360px\)/)
  assert.match(source, /grid-template-columns: repeat\(2, minmax\(0,1fr\)\)/)
})

test('home receives a compact upcoming rail', async () => {
  const source = await read('src/components/UpcomingHomeRail.tsx')
  const css = await read('src/upcoming-home.css')
  assert.match(source, /Próximamente/)
  assert.match(source, /fetchUpcomingReleases\('all'\)/)
  assert.match(source, /Ver estrenos/)
  assert.match(css, /overflow-x: auto/)
})

test('actuality stylesheet loads after v3 to own route layout', async () => {
  const source = await read('src/main.tsx')
  const v3 = source.indexOf("'./mobile-ux-v3.css'")
  const actuality = source.indexOf("'./actuality.css'")
  assert.ok(v3 >= 0 && actuality > v3)
  assert.match(source, /<NotificationCenter \/>/)
  assert.match(source, /<ReleasesRoute \/>/)
  assert.match(source, /<UpcomingHomeRail \/>/)
})
