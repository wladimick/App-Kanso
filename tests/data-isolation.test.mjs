import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const library = await readFile(new URL('../src/services/library.ts', import.meta.url), 'utf8')
const schema = await readFile(new URL('../supabase/migrations/20260815125300_initial_kanso_schema.sql', import.meta.url), 'utf8')

test('library reads are scoped to the authenticated user id', () => {
  assert.match(library, /\.from\('library_items'\)[\s\S]*?\.eq\('user_id', userId\)/)
})

test('library updates remain scoped to item and user', () => {
  assert.match(library, /\.update\(updates\)[\s\S]*?\.eq\('id', libraryItemId\)[\s\S]*?\.eq\('user_id', userId\)/)
})

test('library deletes remain scoped to item and user', () => {
  assert.match(library, /\.delete\(\)[\s\S]*?\.eq\('id', libraryItemId\)[\s\S]*?\.eq\('user_id', userId\)/)
})

test('RLS is enabled for personal tracking tables', () => {
  for (const table of ['library_items', 'collections', 'collection_items', 'watch_events']) {
    assert.ok(schema.includes(`alter table public.${table} enable row level security;`), `RLS not enabled: ${table}`)
  }
})

test('library select policy binds auth.uid to user_id', () => {
  assert.match(schema, /policy "library_items_select_own"[\s\S]*?auth\.uid\(\)\) = user_id/)
})
