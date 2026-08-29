/** Hour the set stops applying, and the lines that belong to it. Ordered, first match wins. */
const SETS: [number, string[]][] = [
  [5, ['Still up, stranger?', 'The cluster never sleeps', 'Late shift again?', 'Quiet hours on the wire']],
  [12, ['Good morning, stranger', 'Coffee first, then dashboards', 'The stack woke up too', 'Fresh start, clean logs']],
  [17, ['Good afternoon', 'Halfway there', 'Steady on', 'Everything green so far?']],
  [22, ['Good evening, stranger', 'Winding down?', 'Evening shift begins', 'One more look before dinner?']],
  [24, ['Good night', 'Last deploy of the day?', 'Lights out soon', 'The servers can take it from here']],
]

export const greetings = (at: Date = new Date()) =>
  SETS.find(([until]) => at.getHours() < until)?.[1] ?? SETS[SETS.length - 1][1]

export const greeting = (at: Date = new Date()) => greetings(at)[0]
