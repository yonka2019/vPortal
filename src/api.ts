// Imported with the extension, like `sanitize.ts` imports `uid.ts`: this module's test
// runs in plain Node, which does not resolve an extensionless path the way Vite does.
import { sanitizeHub } from './sanitize.ts'
import type { Hub } from './types'

/**
 * Where the hub lives now: one key in the extension's own storage. No server, no cookie,
 * no session — whoever opens the tab may edit, because a password checked in the page
 * would guard nothing.
 */

const KEY = 'hub'
const SEED = 'hub.default.json'
const MIRROR = 'vp_hub'

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

/**
 * The hub again, in `localStorage`, only so the first frame has something to draw.
 *
 * `storage.local` is an IPC round trip to IndexedDB, and Firefox never preloads an
 * overridden new tab — every tab is a cold content process, so answering that read took
 * about two seconds of "Loading" before a single tile appeared. This is the same trade
 * `vp_icons` makes for the marks: read a synchronous copy at first render, let storage
 * answer a moment later and reconcile. Storage stays the truth; the mirror is never
 * written to by anything but a successful read or write of it.
 *
 * It is parsed through `sanitizeHub` like any other stored copy — `localStorage` is not
 * a trust boundary either.
 */
export function mirroredHub(): Hub | null {
  try {
    const raw = localStorage.getItem(MIRROR)
    return raw ? sanitizeHub(JSON.parse(raw)) : null
  } catch {
    return null // private mode, disabled storage, or junk in the key
  }
}

function mirror(hub: Hub) {
  try {
    localStorage.setItem(MIRROR, JSON.stringify(hub))
  } catch {
    // Over quota or storage disabled: first paint just waits for storage, as it used to.
  }
}

export async function getHub(): Promise<Hub> {
  const stored = (await area.get(KEY))[KEY]
  if (stored) {
    cached = sanitizeHub(stored)
    mirror(cached)
    return cached
  }
  // First run: the bundled sample, shaped like anything else before it is trusted.
  const seed = await fetch(seedUrl()).then((response) => response.json())
  cached = sanitizeHub(seed)
  await area.set({ [KEY]: cached })
  mirror(cached)
  return cached
}

export async function saveHub(hub: Hub): Promise<Hub> {
  const previous = (await area.get(KEY))[KEY] as Hub | undefined
  cached = sanitizeHub(hub, previous ?? cached)
  await area.set({ [KEY]: cached })
  mirror(cached)
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
  if (!hit) return
  // The mirror carries the counts too, or the "Most opened" strip would paint from a copy
  // that is one click behind on every tab.
  mirror(cached)
  void area.set({ [KEY]: cached }).catch(() => {})
}
