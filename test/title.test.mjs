import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

// `public/title.js` is a plain file, not a module — it is run here the way the browser
// runs it, with `localStorage` and `document` handed in.
const source = readFileSync(new URL('../public/title.js', import.meta.url), 'utf8')
const run = (stored) => {
  const doc = { title: 'TileTab' }
  const localStorage = { getItem: () => stored }
  new Function('localStorage', 'document', source)(localStorage, doc)
  return doc.title
}

test('the tab title comes from the mirror before anything mounts', () => {
  assert.equal(run(JSON.stringify({ title: 'Yonka Hub', sections: [] })), 'Yonka Hub')
  assert.equal(run(JSON.stringify({ title: '  Padded  ', sections: [] })), 'Padded')
})

test('nothing usable in the key leaves the fixed title standing', () => {
  assert.equal(run(null), 'TileTab')
  assert.equal(run('not json'), 'TileTab')
  assert.equal(run(JSON.stringify({ sections: [] })), 'TileTab')
  assert.equal(run(JSON.stringify({ title: '   ' })), 'TileTab')
  assert.equal(run(JSON.stringify({ title: 42 })), 'TileTab')
})

test('a title longer than sanitizeHub would ever write is cut, not trusted', () => {
  assert.equal(run(JSON.stringify({ title: 'x'.repeat(500) })).length, 80)
})
