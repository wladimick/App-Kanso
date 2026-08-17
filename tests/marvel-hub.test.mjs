import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const component = await readFile(new URL('../src/components/MarvelHubRoute.tsx', import.meta.url), 'utf8')
const universes = await readFile(new URL('../src/services/universes.ts', import.meta.url), 'utf8')
const edge = await readFile(new URL('../supabase/functions/tmdb-marvel/index.ts', import.meta.url), 'utf8')
const menu = await readFile(new URL('../src/components/MobileMenu.tsx', import.meta.url), 'utf8')
const css = await readFile(new URL('../src/marvel.css', import.meta.url), 'utf8')
const main = await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8')

test('Universos replaces Marvel as the first-class mobile destination', () => {
  assert.match(menu, /view: 'universes'/)
  assert.match(menu, /label: 'Universos'/)
  assert.match(menu, /value === 'marvel'/)
})

test('Universe catalog reuses the protected TMDB search path', () => {
  assert.match(universes, /searchTmdb/)
  assert.match(component, /fetchUniverseCatalog/)
  assert.doesNotMatch(component, /fetchMarvelCatalog/)
})

test('legacy Marvel Edge Function remains protected if used elsewhere', () => {
  assert.match(edge, /withSupabase\([\s\S]*auth: "user"/)
  assert.match(edge, /Deno\.env\.get\("TMDB_READ_ACCESS_TOKEN"\)/)
})

test('Universe results can be added to the authenticated library', () => {
  assert.match(component, /addItem\(\{/)
  assert.match(component, /source: 'tmdb'/)
  assert.match(component, /status: 'planned'/)
})

test('Universe hub exposes movie and series filters and progressive reveal', () => {
  assert.match(component, /'movie', 'Películas'/)
  assert.match(component, /'series', 'Series'/)
  assert.match(component, /Mostrar más/)
})

test('Universe hub surfaces existing library titles before explore results', () => {
  assert.match(component, /En tu biblioteca/)
  assert.match(component, /belongsToUniverse\(row\.title, row\.original_title, universe\)/)
})

test('Universe mobile grid keeps the three-column Kanso density', () => {
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.marvel-grid\s*\{\s*grid-template-columns:\s*repeat\(3,/)
})

test('Universe stylesheet and route are mounted globally', () => {
  assert.match(main, /MarvelHubRoute/)
  assert.match(main, /\.\/marvel\.css/)
})
