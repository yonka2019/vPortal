import assert from 'node:assert/strict'
import test from 'node:test'

// `icons.ts` reads `__APP_VERSION__`, which Vite defines at build time.
globalThis.__APP_VERSION__ = 'test'
const { svgToDataUri } = await import('../src/icons.ts')

test('an svg becomes a data URI a CSS mask can use', () => {
  const uri = svgToDataUri('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h1v1z"/></svg>')
  assert.ok(uri.startsWith('data:image/svg+xml,'))
  // Nothing in the URI may end the `url("…")` it gets dropped into, or start a comment.
  assert.ok(!uri.includes('"'))
  assert.ok(!uri.includes('#'))
  assert.match(decodeURIComponent(uri.slice('data:image/svg+xml,'.length)), /^<svg/)
})

test('what comes before the <svg> tag is allowed through', () => {
  assert.ok(svgToDataUri('\n  <svg></svg>').startsWith('data:image/svg+xml,'))
  // Every lucide mark ships this licence comment ahead of the tag. Refusing it meant none
  // of them cached, and their tiles went on fetching the file on every new tab.
  const lucide = svgToDataUri('<!-- @license lucide-static v0.544.0 - ISC -->\n<svg></svg>')
  assert.ok(decodeURIComponent(lucide).includes('@license lucide-static'))
  assert.ok(svgToDataUri('<?xml version="1.0"?><svg></svg>').startsWith('data:image/svg+xml,'))
})

test('anything that is not an svg is refused', () => {
  // A 404 page or an HTML error body must never be cached as a mark.
  assert.throws(() => svgToDataUri('<!doctype html><html>404</html>'), /not an svg/)
  assert.throws(() => svgToDataUri('<html><body>nope</body></html>'), /not an svg/)
  assert.throws(() => svgToDataUri(''), /not an svg/)
})
