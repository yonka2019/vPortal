import assert from 'node:assert/strict'
import test from 'node:test'
import { greeting, greetings } from '../src/greeting.ts'

const at = (hour) => new Date(2026, 0, 1, hour, 30)

test('each hour lands in the right part of the day', () => {
  assert.match(greeting(at(0)), /Still up/)
  assert.match(greeting(at(4)), /Still up/)
  assert.match(greeting(at(5)), /Good morning/)
  assert.match(greeting(at(11)), /Good morning/)
  assert.match(greeting(at(12)), /Good afternoon/)
  assert.match(greeting(at(16)), /Good afternoon/)
  assert.match(greeting(at(17)), /Good evening/)
  assert.match(greeting(at(21)), /Good evening/)
  assert.match(greeting(at(22)), /Good night/)
  assert.match(greeting(at(23)), /Good night/)
})

test('every hour has several lines to rotate through', () => {
  for (let hour = 0; hour < 24; hour++) {
    const lines = greetings(at(hour))
    assert.ok(lines.length >= 3, `hour ${hour} has only ${lines.length} line(s)`)
    assert.equal(new Set(lines).size, lines.length, `hour ${hour} repeats a line`)
  }
})
