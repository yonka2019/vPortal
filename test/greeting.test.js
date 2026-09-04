import assert from 'node:assert/strict'
import test from 'node:test'
import { greeting, greetings, nextIndex } from '../src/greeting.ts'

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

// 2026-01-01 was a Thursday, so this walks Sunday to Saturday from the 4th.
const on = (dayOfMonth) => new Date(2026, 0, dayOfMonth, 9, 30)

test('the weekday adds its own lines, indexed Sunday first', () => {
  const day = (dayOfMonth) => greetings(on(dayOfMonth)).join(' | ')
  assert.equal(on(4).getDay(), 0)
  assert.match(day(4), /Sunday/)
  assert.match(day(5), /Monday/)
  assert.match(day(6), /Tuesday/)
  assert.match(day(7), /Wednesday/)
  assert.match(day(8), /Thursday/)
  assert.match(day(9), /Friday/)
  assert.match(day(10), /Saturday/)
})

test('the week is the Israeli one: Sunday works, Friday and Saturday are off', () => {
  const pool = (dayOfMonth) => greetings(on(dayOfMonth)).join(' | ').toLowerCase()
  // Sunday and Thursday are workdays, so neither may read as time off.
  for (const workday of [4, 8]) {
    assert.doesNotMatch(pool(workday), /off the clock|nothing ships|the cluster can wait/)
  }
  // Thursday is the last one before the weekend; Friday and Saturday are the weekend.
  assert.match(pool(8), /nearly out|nobody deploys/)
  assert.match(pool(9), /off the clock|the cluster can wait/)
  assert.match(pool(10), /quiet on the wire|nothing ships/)
})

test('the time of day still comes first, so the day name never replaces it', () => {
  assert.match(greeting(on(7)), /Good morning/)
  assert.match(greeting(new Date(2026, 0, 7, 19, 0)), /Good evening/)
})

test('every hour has several lines to rotate through', () => {
  for (let hour = 0; hour < 24; hour++) {
    const lines = greetings(at(hour))
    assert.ok(lines.length >= 3, `hour ${hour} has only ${lines.length} line(s)`)
    assert.equal(new Set(lines).size, lines.length, `hour ${hour} repeats a line`)
  }
})

test('the next line is random but never the one already showing', () => {
  const count = 6
  // Every roll from 0 to just under 1 must land somewhere else in the pool.
  for (const roll of [0, 0.01, 0.2, 0.5, 0.8, 0.99]) {
    for (let current = 0; current < count; current++) {
      const picked = nextIndex(current, count, () => roll)
      assert.notEqual(picked, current, `roll ${roll} repeated index ${current}`)
      assert.ok(picked >= 0 && picked < count, `roll ${roll} left the pool: ${picked}`)
    }
  }
})

test('over many rolls every other line is reachable', () => {
  const count = 6
  const seen = new Set()
  for (let i = 0; i < 5; i++) seen.add(nextIndex(0, count, () => i / 5))
  assert.equal(seen.size, count - 1)
})

test('a pool of one line has nowhere to go and stays put', () => {
  assert.equal(nextIndex(0, 1), 0)
  assert.equal(nextIndex(3, 0), 3)
})
