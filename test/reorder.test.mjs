import assert from 'node:assert/strict'
import test from 'node:test'
import { handOver, moveLink, moveSection, sectionOfTarget, zoneId } from '../src/reorder.ts'

const link = (id) => ({ id, title: id, url: `https://${id}.test` })
const hub = () => ({
  title: 'TileTab',
  sections: [
    { id: 's1', title: 'One', links: [link('a'), link('b'), link('c')] },
    { id: 's2', title: 'Two', links: [link('d')] },
    { id: 's3', title: 'Three', links: [] },
  ],
})

const ids = (doc, index) => doc.sections[index].links.map((item) => item.id)

test('a link reorders inside its own section', () => {
  assert.deepEqual(ids(moveLink(hub(), 'c', 'a'), 0), ['c', 'a', 'b'])
  // A drop on the tile it started from changes nothing.
  assert.deepEqual(ids(moveLink(hub(), 'a', 'a'), 0), ['a', 'b', 'c'])
})

test('moveLink refuses a target in another section — that is handOver', () => {
  assert.deepEqual(ids(moveLink(hub(), 'a', 'd'), 0), ['a', 'b', 'c'])
  assert.deepEqual(ids(moveLink(hub(), 'a', 'd'), 1), ['d'])
})

test('a link crosses into another section and lands on the target slot', () => {
  const next = handOver(hub(), 'b', 'd')
  assert.deepEqual(ids(next, 0), ['a', 'c'])
  assert.deepEqual(ids(next, 1), ['b', 'd'])
})

test('an empty section takes a link through its drop zone', () => {
  const next = handOver(hub(), 'a', zoneId('s3'))
  assert.deepEqual(ids(next, 0), ['b', 'c'])
  assert.deepEqual(ids(next, 2), ['a'])
  assert.equal(sectionOfTarget(hub(), zoneId('s3')), 2)
})

test('the last link can leave a section, and nothing is lost on the way', () => {
  const next = handOver(hub(), 'd', 'a')
  assert.deepEqual(ids(next, 1), [])
  assert.deepEqual(ids(next, 0), ['d', 'a', 'b', 'c'])
  assert.equal(next.sections.flatMap((section) => section.links).length, 4)
})

test('sections reorder, and unknown ids leave the hub alone', () => {
  assert.deepEqual(
    moveSection(hub(), 's3', 's1').sections.map((section) => section.id),
    ['s3', 's1', 's2'],
  )
  assert.deepEqual(moveSection(hub(), 's1', 'nope'), hub())
  assert.deepEqual(handOver(hub(), 'a', 'nope'), hub())
  assert.deepEqual(moveLink(hub(), 'nope', 'a'), hub())
})

test('the source hub is never mutated', () => {
  const before = hub()
  handOver(before, 'a', 'd')
  moveLink(before, 'a', 'c')
  moveSection(before, 's1', 's2')
  assert.deepEqual(before, hub())
})
