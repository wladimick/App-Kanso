import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const css = await readFile(new URL('../src/compact-editor.css', import.meta.url), 'utf8')
const main = await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8')

test('compact editor stylesheet loads last', () => {
  const marvelIndex = main.indexOf("./marvel.css")
  const compactIndex = main.indexOf("./compact-editor.css")
  assert.ok(marvelIndex >= 0)
  assert.ok(compactIndex > marvelIndex)
})

test('mobile editor hero is reduced', () => {
  assert.match(css, /\.editor-hero\s*\{[\s\S]*?min-height:\s*104px/)
  assert.match(css, /\.editor-poster\s*\{[\s\S]*?width:\s*56px/)
})

test('quick status becomes a compact three-column control', () => {
  assert.match(css, /\.editor-quick-grid,[\s\S]*?grid-template-columns:\s*repeat\(3,/)
  assert.match(css, /\.quick-status-card span\s*\{[\s\S]*?display:\s*none/)
})

test('status and type remain side by side on mobile', () => {
  assert.match(css, /\.editor-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,/)
})

test('progress fields use two columns on mobile', () => {
  assert.match(css, /\.progress-fields\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,/)
})

test('inputs keep iOS-safe 16px font size', () => {
  assert.match(css, /\.editor-form input\[type='number'\],[\s\S]*?font-size:\s*16px/)
})

test('sticky actions fit in one compact row', () => {
  assert.match(css, /\.editor-actions\s*\{[\s\S]*?position:\s*fixed/)
  assert.match(css, /grid-template-columns:\s*\.78fr 2\.1fr/)
  assert.match(css, /\.danger-action\s*\{[\s\S]*?grid-row:\s*1/)
})

test('touch targets remain at least 44px high', () => {
  assert.match(css, /\.editor-actions button\s*\{[\s\S]*?min-height:\s*44px/)
  assert.match(css, /\.editor-form input\[type='number'\],[\s\S]*?min-height:\s*44px/)
})
