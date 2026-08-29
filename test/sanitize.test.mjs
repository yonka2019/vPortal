import assert from 'node:assert/strict'
import test from 'node:test'
import { CUSTOM_MAX, safeIcon, safeUrl, sanitizeHub } from '../src/sanitize.ts'

const hub = (link) => ({ sections: [{ id: 'sec', title: 'Section', links: [link] }] })
const link = (extra) => ({ id: 'l1', title: 'Grafana', url: 'https://grafana.local', ...extra })
const first = (doc) => doc.sections[0]?.links[0]

test('only http(s) addresses survive — this is the only guard left', () => {
  assert.equal(safeUrl('javascript:alert(1)'), '')
  assert.equal(safeUrl('mongodb://db:27017'), '')
  assert.equal(safeUrl('grafana.internal'), 'https://grafana.internal/')
  assert.equal(safeUrl('/relative'), '/relative')
  // A link with no usable address is dropped, not kept blank.
  assert.equal(sanitizeHub(hub(link({ url: 'javascript:void 0' }))).sections[0].links.length, 0)
})

test('click counts come from the stored copy, never from the incoming one', () => {
  const stored = sanitizeHub(hub(link({ clicks: 0 })))
  stored.sections[0].links[0].clicks = 42
  const saved = sanitizeHub(hub(link({ clicks: 9999 })), stored)
  assert.equal(first(saved).clicks, 42)
})

test('uploaded logos: image data URIs only, 128KB cap', () => {
  const png = 'data:image/png;base64,iVBORw0KGgo='
  assert.equal(safeIcon(png), png)
  assert.equal(safeIcon('data:text/html;base64,PHNjcmlwdD4='), '')
  assert.equal(safeIcon(`data:image/png;base64,${'A'.repeat(CUSTOM_MAX)}`), '')
  assert.equal(first(sanitizeHub(hub(link({ iconSlug: png })))).iconSlug, png)
})

test('junk colours and sizes fall back instead of reaching the CSS', () => {
  const saved = first(sanitizeHub(hub(link({ iconColor: 'red; --x:1', size: 'xl', tintColor: 'nope' }))))
  assert.equal(saved.iconColor, '#9AA8C4')
  assert.equal(saved.size, 's')
  assert.equal(saved.tintColor, undefined)
})

test('a section with no links array does not throw', () => {
  const saved = sanitizeHub({ sections: [{ id: 'a', title: 'A' }, null] })
  assert.equal(saved.sections.length, 1)
  assert.deepEqual(saved.sections[0].links, [])
})
