/** Hour the set stops applying, and the lines that belong to it. Ordered, first match wins. */
const SETS: [number, string[]][] = [
  [5, ['Still up, stranger?', 'The cluster never sleeps', 'Late shift again?', 'Quiet hours on the wire']],
  [12, ['Good morning, stranger', 'Coffee first, then dashboards', 'The stack woke up too', 'Fresh start, clean logs']],
  [17, ['Good afternoon', 'Halfway there', 'Steady on', 'Everything green so far?']],
  [22, ['Good evening, stranger', 'Winding down?', 'Evening shift begins', 'One more look before dinner?']],
  [24, ['Good night', 'Last deploy of the day?', 'Lights out soon', 'The servers can take it from here']],
]

/**
 * Lines tied to the weekday, indexed the way `Date.getDay()` counts — Sunday first.
 * The week is the Israeli one: Sunday opens it, Thursday closes it, and the weekend is
 * Friday and Saturday. Sunday must never read as a day off, Thursday is the last push.
 */
const DAYS: string[][] = [
  ['Sunday, the week starts here', 'Sunday. Check the weekend alerts'],
  ['Monday, second day in', 'Monday, still early in the week'],
  ['Tuesday, over the hump', 'Midweek, halfway up'],
  ['Wednesday, almost', 'Wednesday. Two more after this'],
  ['Thursday, nearly out', 'Nobody deploys on a Thursday'],
  ['Friday, off the clock', 'Friday. The cluster can wait'],
  ['Saturday, quiet on the wire', 'Nothing ships on a Saturday'],
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
