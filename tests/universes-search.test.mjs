import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('universes include Marvel and major anime sagas', async () => {
  const source = await read('src/services/universes.ts')
  assert.match(source, /id: 'marvel'/)
  assert.match(source, /id: 'saint-seiya'/)
  assert.match(source, /id: 'dragon-ball'/)
  assert.match(source, /id: 'naruto'/)
  assert.match(source, /id: 'star-wars'/)
  assert.match(source, /id: 'dc'/)
})

test('universe hub detects titles from the user library before external catalog', async () => {
  const source = await read('src/components/MarvelHubRoute.tsx')
  assert.match(source, /rows\.filter\(\(row\) => belongsToUniverse/)
  assert.match(source, /En tu biblioteca/)
  assert.match(source, /Ya tienes \{owned\.length\}/)
  assert.doesNotMatch(source, /fetchMarvelCatalog/)
})

test('universe catalog uses the existing protected TMDB search service', async () => {
  const source = await read('src/services/universes.ts')
  assert.match(source, /searchTmdb/)
  assert.match(source, /Promise\.allSettled/)
  assert.match(source, /deduped/)
})

test('floating search navigates directly to Discover', async () => {
  const source = await read('src/components/FloatingSearchButton.tsx')
  assert.match(source, /searchParams\.set\('view', 'discover'\)/)
  assert.match(source, /Abrir búsqueda rápida/)
})

test('floating search is mounted globally and mobile-only in css', async () => {
  const main = await read('src/main.tsx')
  const css = await read('src/marvel.css')
  assert.match(main, /<FloatingSearchButton \/>/)
  assert.match(css, /\.floating-search-trigger \{ display: none; \}/)
  assert.match(css, /@media \(max-width: 760px\)/)
  assert.match(css, /left: 14px/)
})

test('universe grid keeps three columns on normal phones', async () => {
  const css = await read('src/marvel.css')
  assert.match(css, /@media \(max-width: 760px\)/)
  assert.match(css, /\.marvel-grid \{ grid-template-columns: repeat\(3, minmax\(0,1fr\)\)/)
})
