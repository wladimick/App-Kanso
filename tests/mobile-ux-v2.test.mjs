import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const app = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const detail = fs.readFileSync(new URL('../src/components/MediaDetail.tsx', import.meta.url), 'utf8')
const tabbar = fs.readFileSync(new URL('../src/components/MobileTabBar.tsx', import.meta.url), 'utf8')
const episodeService = fs.readFileSync(new URL('../src/services/episodeProgress.ts', import.meta.url), 'utf8')
const hook = fs.readFileSync(new URL('../src/hooks/useEpisodeProgress.ts', import.meta.url), 'utf8')
const css = fs.readFileSync(new URL('../src/mobile-ux-v2.css', import.meta.url), 'utf8')
const schema = fs.readFileSync(new URL('../supabase/migrations/20260815125300_initial_kanso_schema.sql', import.meta.url), 'utf8')

test('mobile tab bar exposes five primary actions', () => {
  assert.match(tabbar, /Inicio/)
  assert.match(tabbar, /Biblioteca/)
  assert.match(tabbar, /Agregar/)
  assert.match(tabbar, /Estrenos/)
  assert.match(tabbar, /Buscar/)
  assert.match(css, /grid-template-columns: repeat\(5/)
})

test('legacy mobile sidebar is hidden when v2 tab bar is active', () => {
  assert.match(css, /\.sidebar \{\s*display: none !important;/)
  assert.match(css, /\.mobile-tabbar \{/)
})

test('library offers unified status filters', () => {
  assert.match(app, /libraryStatusFilter/)
  assert.match(app, /Pendientes/)
  assert.match(app, /Favoritos/)
  assert.match(app, /Filtrar biblioteca por estado/)
})

test('library keeps independent media type filtering', () => {
  assert.match(app, /Todos los tipos/)
  assert.match(app, /matchesType/)
  assert.match(app, /matchesLibraryStatus/)
})

test('episode tracking uses the existing protected watch_events table', () => {
  assert.match(episodeService, /from\('watch_events'\)/)
  assert.match(episodeService, /eq\('user_id', userId\)/)
  assert.match(episodeService, /eq\('library_item_id', libraryItemId\)/)
})

test('watch_events already has owner-only RLS policies', () => {
  assert.match(schema, /watch_events_select_own/)
  assert.match(schema, /watch_events_insert_own/)
  assert.match(schema, /watch_events_delete_own/)
  assert.match(schema, /auth\.uid\(\).*user_id/s)
})

test('episode progress hook persists and rolls back failed optimistic updates', () => {
  assert.match(hook, /setEpisodeWatched/)
  assert.match(hook, /setWatched/)
  assert.match(hook, /await refresh\(\)/)
})

test('media detail renders a tappable episode check action', () => {
  assert.match(detail, /episode-check/)
  assert.match(detail, /Marcar episodio/)
  assert.match(detail, /toggleEpisode/)
})

test('marking an episode can advance the current Kanso position', () => {
  assert.match(detail, /onSetEpisode/)
  assert.match(app, /setRemoteEpisode/)
  assert.match(app, /onSetEpisode=/)
})

test('episode list is compacted for phone layouts', () => {
  assert.match(css, /grid-template-columns: 92px minmax\(0,1fr\) 44px/)
  assert.match(css, /-webkit-line-clamp: 2/)
})

test('mobile tab bar respects safe-area insets', () => {
  assert.match(css, /env\(safe-area-inset-bottom\)/)
})

test('mobile primary actions retain useful touch targets', () => {
  assert.match(css, /min-height: 52px/)
  assert.match(css, /width: 54px/)
  assert.match(css, /height: 42px/)
})
