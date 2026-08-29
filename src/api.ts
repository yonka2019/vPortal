import { sanitizeHub } from './sanitize'
import type { Hub } from './types'

/**
 * Where the hub lives now: one key in the extension's own storage. No server, no cookie,
 * no session — whoever opens the tab may edit, because a password checked in the page
 * would guard nothing.
 */

const KEY = 'hub'
const SEED = 'hub.default.json'

// `browser` first: Firefox exposes both, and only its `browser.*` is promise-based for
// certain. Chrome has no `browser`, and its MV3 `chrome.*` already returns promises.
const engine = typeof browser !== 'undefined' ? browser : typeof chrome !== 'undefined' ? chrome : undefined

const area: StorageArea =
  engine?.storage?.local ?? {
    // `npm run dev` opens the page in a plain tab, where chrome.storage does not exist.
    // Same shape over localStorage so the hub is testable outside the extension.
    async get(key) {
      const raw = localStorage.getItem(key)
      return raw ? { [key]: JSON.parse(raw) } : {}
    },
    async set(items) {
      for (const [key, value] of Object.entries(items)) localStorage.setItem(key, JSON.stringify(value))
    },
    async remove(key) {
      localStorage.removeItem(key)
    },
  }

const seedUrl = () => engine?.runtime?.getURL(SEED) ?? `/${SEED}`

/**
 * The copy last read or written. `countClick` needs it: a read-modify-write would have to
 * wait for storage to answer, and the page is usually navigating away by then — a single
 * unawaited write survives, a round-trip does not.
 */
let cached: Hub | null = null

export async function getHub(): Promise<Hub> {
  const stored = (await area.get(KEY))[KEY]
  if (stored) return (cached = sanitizeHub(stored))
  // First run: the bundled sample, shaped like anything else before it is trusted.
  const seed = await fetch(seedUrl()).then((response) => response.json())
  cached = sanitizeHub(seed)
  await area.set({ [KEY]: cached })
  return cached
}

export async function saveHub(hub: Hub): Promise<Hub> {
  const previous = (await area.get(KEY))[KEY] as Hub | undefined
  cached = sanitizeHub(hub, previous ?? cached)
  await area.set({ [KEY]: cached })
  return cached
}

/** Fire-and-forget: a failed count must never delay opening the link. */
export function countClick(linkId: string) {
  if (!cached) return
  let hit = false
  for (const section of cached.sections) {
    for (const link of section.links) {
      if (link.id !== linkId) continue
      link.clicks = (link.clicks ?? 0) + 1
      hit = true
    }
  }
  if (hit) void area.set({ [KEY]: cached }).catch(() => {})
}
