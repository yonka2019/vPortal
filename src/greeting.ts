/** Hour the set stops applying, and the lines that belong to it. Ordered, first match wins. */
const SETS: [number, string[]][] = [
  [5, ['Still up, stranger?', 'The cluster never sleeps', 'Late shift again?', 'Quiet hours on the wire']],
  [12, ['Good morning, stranger', 'Coffee first, then dashboards', 'The stack woke up too', 'Fresh start, clean logs']],
  [17, ['Good afternoon', 'Halfway there', 'Steady on', 'Everything green so far?']],
  [22, ['Good evening, stranger', 'Winding down?', 'Evening shift begins', 'One more look before dinner?']],
  [24, ['Good night', 'Last deploy of the day?', 'Lights out soon', 'The servers can take it from here']],
]

/** Lines tied to the weekday, indexed the way `Date.getDay()` counts — Sunday first. */
const DAYS: string[][] = [
  ['Sunday, quiet on the wire', 'Nothing ships on a Sunday'],
  ['Monday again, stranger', 'Monday. Check the weekend alerts'],
  ['Tuesday, the real Monday', 'Tuesday, still early in the week'],
  ['Wednesday, over the hump', 'Midweek, halfway up'],
  ['Thursday, almost', 'Thursday. One more after this'],
  ['Friday, nearly out', 'Nobody deploys on a Friday'],
  ['Saturday, off the clock', 'Saturday. The cluster can wait'],
]

const hours = (at: Date) => SETS.find(([until]) => at.getHours() < until)?.[1] ?? SETS[SETS.length - 1][1]

/**
 * The pool the header rotates through: the hour's lines first, then the weekday's, so the
 * greeting still opens on the time of day and the day name turns up as you watch.
 */
export const greetings = (at: Date = new Date()) => [...hours(at), ...DAYS[at.getDay()]]

export const greeting = (at: Date = new Date()) => greetings(at)[0]

/**
 * A random line other than the one showing. Stepping by a random part-lap instead of
 * rolling a fresh index means the header always visibly changes — a plain `Math.random()`
 * index repeats often enough at this pool size to look like the rotation has stopped.
 * `roll` is injectable so the choice can be tested without randomness.
 */
export const nextIndex = (current: number, count: number, roll: () => number = Math.random) =>
  count < 2 ? current : (current + 1 + Math.floor(roll() * (count - 1))) % count
