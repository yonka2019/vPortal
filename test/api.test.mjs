import assert from 'node:assert/strict'
import test from 'node:test'

// `api.ts` picks its storage at import time, so the fake has to be in place first. With
// no `browser` and no `chrome`, it takes the localStorage path — the same one `npm run
// dev` uses.
const store = new Map()
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => void store.set(key, String(value)),
  removeItem: (key) => void store.delete(key),
}

const { countClick, getHub, mirroredHub, saveHub } = await import('../src/api.ts')

const hub = {
  title: 'Hub',
  sections: [{ id: 'sec', title: 'Section', links: [{ id: 'l1', title: 'Grafana', url: 'https://grafana.local' }] }],
}

test('the mirror is what makes the first frame paintable', async () => {
  assert.equal(mirroredHub(), null, 'nothing to draw before the first load')

  await saveHub(hub)
  assert.equal(mirroredHub()?.sections[0].links[0].title, 'Grafana')

  // A fresh tab reads it synchronously, before storage has answered anything.
  store.delete('hub')
  assert.equal(mirroredHub()?.sections[0].links[0].url, 'https://grafana.local/')

  // Junk in the key must not blank the page — it just falls back to waiting for storage.
  store.set('vp_hub', 'not json')
  assert.equal(mirroredHub(), null)
})

test('a click is mirrored too, or the strip paints one behind', async () => {
  store.clear()
  await saveHub(hub)
  countClick('l1')
  assert.equal(mirroredHub()?.sections[0].links[0].clicks, 1)
})

test('storage still wins: the mirror follows what was read', async () => {
  store.clear()
  store.set('hub', JSON.stringify({ title: 'From storage', sections: [] }))
  const loaded = await getHub()
  assert.equal(loaded.title, 'From storage')
  assert.equal(mirroredHub()?.title, 'From storage')
})
