/**
 * Which of the rail's categories you are on, as an index into `tops` — each heading's
 * distance from the top of the viewport. Kept apart from the component because it is the
 * one piece of the rail with edge cases worth testing.
 */

/**
 * How close to the top a heading must come to count as the one you are reading. It has to
 * clear the `scroll-margin-top` an `#anchor` jump parks a heading at (18px, 12px on narrow
 * screens) or a clicked category never lights up, and stay well under the gap between two
 * headings of an empty category (~105px) or the one below it lights up instead.
 */
const REACHED = 60

export function currentSection(
  tops: number[],
  view: number,
  canScroll: boolean,
  atBottom: boolean,
) {
  // Clamped at the end of the page, a short tail can never bring its heading to the top,
  // so there the section holding most of the screen wins. Only when the page really
  // scrolls: on one that fits the window every position is already "the bottom", and
  // taking the last section there would light the wrong row for as long as it is open.
  if (canScroll && atBottom) {
    let best = 0
    let bestSeen = -1
    for (let i = 0; i < tops.length; i++) {
      const ends = i + 1 < tops.length ? tops[i + 1] : view
      const seen = Math.min(ends, view) - Math.max(tops[i], 0)
      if (seen > bestSeen) {
        bestSeen = seen
        best = i
      }
    }
    return best
  }

  // Otherwise the last heading that has reached the top; the first one holds until any has.
  let found = 0
  for (let i = 0; i < tops.length; i++) {
    if (tops[i] > REACHED) break
    found = i
  }
  return found
}
