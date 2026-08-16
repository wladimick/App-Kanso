import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const css = await readFile(new URL('../src/mobile-polish.css', import.meta.url), 'utf8')
const menu = await readFile(new URL('../src/components/MobileMenu.tsx', import.meta.url), 'utf8')
const main = await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8')

test('mobile account card is removed from page chrome', () => {
  assert.match(css, /\.topbar \.auth-session\s*\{[\s\S]*?display:\s*none\s*!important/)
})

test('mobile library uses three columns on normal phones', () => {
  assert.match(css, /\.library-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,/)
})

test('very narrow devices fall back to two columns', () => {
  assert.match(css, /@media \(max-width:\s*340px\)[\s\S]*?grid-template-columns:\s*repeat\(2,/)
})

test('hamburger account section exposes a sign-out action', () => {
  assert.match(menu, /mobile-menu-signout/)
  assert.match(menu, /supabase\.auth\.signOut\(\)/)
  assert.match(menu, /Cerrar sesión/)
})

test('full mobile menu keeps all major destinations', () => {
  for (const label of ['Inicio', 'Mi biblioteca', 'Lista de deseos', 'Viendo', 'Completados', 'Favoritos', 'Colecciones', 'Descubrir']) {
    assert.ok(menu.includes(label), `Missing mobile destination: ${label}`)
  }
})

test('mobile polish stylesheet loads last', () => {
  const enhancementIndex = main.indexOf("./app-shell-enhancements.css")
  const polishIndex = main.indexOf("./mobile-polish.css")
  assert.ok(enhancementIndex >= 0)
  assert.ok(polishIndex > enhancementIndex)
})
