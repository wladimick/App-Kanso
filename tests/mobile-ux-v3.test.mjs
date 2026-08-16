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

test('releases route is isolated by URL view', async () => {
  const source = await read('src/components/ReleasesRoute.tsx')
  assert.match(source, /get\('view'\) === 'releases'/)
  assert.match(source, /fetchUpcomingReleases/)
  assert.match(source, /status: 'planned'/)
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

test('tmdb releases queries future movie and tv windows', async () => {
  const source = await read('supabase/functions/tmdb-releases/index.ts')
  assert.match(source, /primary_release_date\.gte=/)
  assert.match(source, /first_air_date\.gte=/)
  assert.match(source, /setDate\(until\.getDate\(\) \+ 90\)/)
})

test('v3 css keeps three-column release cards on normal phones', async () => {
  const source = await read('src/mobile-ux-v3.css')
  assert.match(source, /grid-template-columns: repeat\(3, minmax\(0,1fr\)\)/)
  assert.match(source, /@media \(max-width: 360px\)/)
})

test('v3 mounts after v2 so polish wins cascade', async () => {
  const source = await read('src/main.tsx')
  const v2 = source.indexOf("'./mobile-ux-v2.css'")
  const v3 = source.indexOf("'./mobile-ux-v3.css'")
  assert.ok(v2 >= 0 && v3 > v2)
  assert.match(source, /<NotificationCenter \/>/)
  assert.match(source, /<ReleasesRoute \/>/)
})
