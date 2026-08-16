import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('media editor closes after a successful save', async () => {
  const source = await read('src/components/MediaEditor.tsx')
  const saveIndex = source.indexOf('await onSave({')
  const closeIndex = source.indexOf('onClose()', saveIndex)
  const catchIndex = source.indexOf('} catch {', saveIndex)
  assert.ok(saveIndex >= 0)
  assert.ok(closeIndex > saveIndex && closeIndex < catchIndex)
})

test('discover exposes seen and wishlist quick actions', async () => {
  const source = await read('src/components/DiscoverPanel.tsx')
  assert.match(source, /quickAdd\(item, 'completed'\)/)
  assert.match(source, /quickAdd\(item, 'planned'\)/)
  assert.match(source, /kanso:quick-add/)
  assert.match(source, /Marcar .* como visto/)
  assert.match(source, /lista de deseos/)
})

test('quick actions persist without opening post-add editor', async () => {
  const source = await read('src/components/QuickAddBridge.tsx')
  assert.match(source, /addLibraryItem/)
  assert.match(source, /updateLibraryItem/)
  assert.match(source, /kanso:library-refresh/)
  assert.doesNotMatch(source, /kanso:item-added/)
})

test('quick add bridge is mounted globally', async () => {
  const source = await read('src/main.tsx')
  assert.match(source, /QuickAddBridge/)
  assert.match(source, /<QuickAddBridge \/>/)
})

test('releases reserve sidebar space on tablet and desktop', async () => {
  const css = await read('src/mobile-ux-v3.css')
  assert.match(css, /margin: 0 auto 0 var\(--sidebar-w, 232px\)/)
  assert.match(css, /@media \(max-width: 760px\)/)
  assert.match(css, /margin-left: 0/)
})

test('discover quick buttons retain touch-friendly sizing', async () => {
  const css = await read('src/discover.css')
  assert.match(css, /\.catalog-actions/)
  assert.match(css, /\.catalog-quick-action/)
  assert.match(css, /min-height: 42px/)
})
