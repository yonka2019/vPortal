import assert from 'node:assert/strict'
import test from 'node:test'
import { CUSTOM_MAX, safeIcon, safeUrl, sanitizeHub } from '../src/sanitize.ts'

const hub = (link) => ({ sections: [{ id: 'sec', title: 'Section', links: [link] }] })
const link = (extra) => ({ id: 'l1', title: 'Grafana', url: 'https://grafana.local', ...extra })
const first = (doc) => doc.sections[0]?.links[0]

// The address cases are the same ones the hosted VPortal's `test/safe.test.js` runs: the
// two projects share one scheme policy, and drifting apart should turn a suite red.
test('any scheme the machine answers to survives — the tile is an <a>', () => {
  assert.equal(
    safeUrl('mongodb://user:pass@10.0.0.5:27017/admin?authSource=admin'),
    'mongodb://user:pass@10.0.0.5:27017/admin?authSource=admin',
  )
  assert.equal(
    safeUrl('mongodb://a.int,b.int,c.int:27017/db?replicaSet=rs0'),
    'mongodb://a.int,b.int,c.int:27017/db?replicaSet=rs0',
    'a multi-host connection string must not be normalised into something else',
  )
  assert.equal(safeUrl('ssh://root@192.168.1.5'), 'ssh://root@192.168.1.5')
  assert.equal(safeUrl('rdp://desk.internal'), 'rdp://desk.internal')
  assert.equal(safeUrl('https://grafana.internal/'), 'https://grafana.internal/')
  // A bare host is assumed https rather than dropped; a root-relative path is kept as typed.
  assert.equal(safeUrl('grafana.internal'), 'https://grafana.internal/')
  assert.equal(safeUrl('192.168.1.10:3000'), 'https://192.168.1.10:3000/')
  assert.equal(safeUrl('/relative'), '/relative')
})

test('anything that would run code in the page is dropped — this is the only guard left', () => {
  for (const bad of [
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'blob:https://a.test/1234',
    'filesystem:https://a.test/temporary/x',
  ]) {
    assert.equal(safeUrl(bad), '', `${JSON.stringify(bad)} must never become an href`)
  }
  for (const junk of ['', '   ', null, undefined, 42, {}, [], 'http://']) {
    assert.equal(safeUrl(junk), '')
  }
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
