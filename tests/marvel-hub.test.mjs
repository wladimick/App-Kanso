import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const component = await readFile(new URL('../src/components/MarvelHubRoute.tsx', import.meta.url), 'utf8')
const service = await readFile(new URL('../src/services/marvel.ts', import.meta.url), 'utf8')
const edge = await readFile(new URL('../supabase/functions/tmdb-marvel/index.ts', import.meta.url), 'utf8')
const menu = await readFile(new URL('../src/components/MobileMenu.tsx', import.meta.url), 'utf8')
const css = await readFile(new URL('../src/marvel.css', import.meta.url), 'utf8')
const main = await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8')

test('Marvel is a first-class mobile destination', () => {
  assert.match(menu, /view: 'marvel'/)
  assert.match(menu, /label: 'Marvel'/)
})

test('Marvel catalog is requested through a protected Edge Function', () => {
  assert.match(service, /functions\.invoke<MarvelCatalogResponse>\('tmdb-marvel'/)
  assert.match(edge, /withSupabase\([\s\S]*auth: "user"/)
})

test('Marvel discover uses TMDB company filtering for movies and TV', () => {
  assert.match(edge, /\/discover\/movie/)
  assert.match(edge, /\/discover\/tv/)
  assert.match(edge, /with_companies/)
  assert.match(edge, /id === 420/)
})

test('Marvel results can be added to the authenticated library', () => {
  assert.match(component, /addItem\(\{/)
  assert.match(component, /source: 'tmdb'/)
  assert.match(component, /status: 'planned'/)
})

test('Marvel hub exposes movie and series filters and pagination', () => {
  assert.match(component, /'movie', 'Películas'/)
  assert.match(component, /'series', 'Series'/)
  assert.match(component, /Cargar más/)
})

test('Marvel mobile grid keeps the three-column Kanso density', () => {
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.marvel-grid\s*\{\s*grid-template-columns:\s*repeat\(3,/)
})

test('Marvel stylesheet and route are mounted globally', () => {
  assert.match(main, /MarvelHubRoute/)
  assert.match(main, /\.\/marvel\.css/)
})
