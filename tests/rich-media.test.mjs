import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
const detail = await readFile(new URL('../src/components/MediaDetail.tsx', import.meta.url), 'utf8')
const rating = await readFile(new URL('../src/components/TmdbRating.tsx', import.meta.url), 'utf8')
const tmdb = await readFile(new URL('../src/services/tmdb.ts', import.meta.url), 'utf8')
const edge = await readFile(new URL('../supabase/functions/tmdb-details/index.ts', import.meta.url), 'utf8')
const css = await readFile(new URL('../src/rich-media.css', import.meta.url), 'utf8')
const main = await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8')

test('library items retain TMDB source and external id for detail lookups', () => {
  assert.match(app, /source:\s*row\.source/)
  assert.match(app, /externalId:\s*row\.external_id/)
})

test('cards expose a clearly labelled TMDB rating', () => {
  assert.match(app, /<TmdbRating item=\{item\} compact/)
  assert.match(rating, />TMDB</)
  assert.match(rating, /Math\.round\(rating \* 10\)/)
})

test('opening a library card uses the rich detail experience before editing', () => {
  assert.match(app, /<MediaDetail/)
  assert.match(app, /onEdit=\{\(\) => setEditorId\(selectedItem\.id\)\}/)
})

test('detail view contains overview, progress, seasons and related sections', () => {
  for (const marker of ['detail-overview', 'Tu progreso', 'Temporadas', 'Relacionados']) {
    assert.ok(detail.includes(marker), `Missing rich detail marker: ${marker}`)
  }
})

test('TMDB details function remains protected by authenticated Supabase user auth', () => {
  assert.match(edge, /withSupabase\(\s*\{ auth: "user" \}/)
  assert.match(edge, /TMDB_READ_ACCESS_TOKEN/)
})

test('TMDB details uses official movie, TV, similar and season endpoints', () => {
  assert.match(edge, /\/movie\/\$\{externalId\}/)
  assert.match(edge, /\/tv\/\$\{externalId\}/)
  assert.match(edge, /\/similar\?language=es-CL/)
  assert.match(edge, /\/season\/\$\{payload\.seasonNumber\}/)
})

test('rich details degrade to existing search metadata when advanced endpoint is unavailable', () => {
  assert.match(detail, /loadCardMetadata\(item\)/)
  assert.match(detail, /setFallback\(basic\)/)
})

test('rich media stylesheet is loaded after mobile polish and editor remains above detail', () => {
  assert.ok(main.indexOf("./rich-media.css") > main.indexOf("./mobile-polish.css"))
  assert.match(css, /\.editor-backdrop\s*\{\s*z-index:\s*1320\s*!important/)
})
