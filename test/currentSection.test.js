import assert from 'node:assert/strict'
import test from 'node:test'
import { currentSection } from '../src/currentSection.ts'

// Six headings as the rail sees them: distance from the top of an 900px viewport.
const view = 900

test('the last heading that reached the top is the one you are on', () => {
  assert.equal(currentSection([-800, -115, 18, 400, 900, 1400], view, true, false), 2)
  assert.equal(currentSection([-1200, -500, -115, 55, 560, 1100], view, true, false), 3)
})

test('the first category holds until a heading has reached the top', () => {
  assert.equal(currentSection([101, 786, 1174, 1562, 2100, 2600], view, true, false), 0)
})

test('a heading parked by an #anchor jump counts as reached', () => {
  // 18px on a wide screen, 12px under 1200px — both must clear the threshold.
  assert.equal(currentSection([-500, 18, 700, 1200], view, true, false), 1)
  assert.equal(currentSection([-500, 12, 700, 1200], view, true, false), 1)
})

test('an empty category does not hand the highlight to the one below it', () => {
  // A category with no links leaves only ~105px between its heading and the next.
  assert.equal(currentSection([-400, 12, 117, 800], view, true, false), 1)
})

test('at the bottom the section holding most of the screen wins', () => {
  // Clicked the second-to-last category, but the page ran out of scroll: its heading
  // rests at 234px and still covers most of the viewport.
  assert.equal(currentSection([-900, -400, 234, 690], view, true, true), 2)
  // A last section tall enough to fill the screen does win there.
  assert.equal(currentSection([-1800, -900, -300, 60], view, true, true), 3)
})

test('a page that fits the window is not treated as scrolled to the bottom', () => {
  // Every position is "the bottom" when nothing can scroll — the last category must not
  // light up while the first one is on screen, and no scroll will ever correct it.
  assert.equal(currentSection([101, 786, 1174, 1562], view, false, true), 0)
})

test('one category is always a valid answer', () => {
  assert.equal(currentSection([18], view, true, false), 0)
  assert.equal(currentSection([500], view, false, true), 0)
})
