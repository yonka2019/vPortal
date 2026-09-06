import type { Hub, Link, Section, TileSize } from './types'
// Extension spelled out: `test/sanitize.test.mjs` imports this module in plain Node,
// which does not resolve extensionless paths the way Vite does.
import { uid } from './uid.ts'

/**
 * The whole validation boundary, ported from the server VPortal used to have. Nothing
 * else guards the document now: both Save and Import land here, and an imported file is
 * untrusted input, so `javascript:` addresses and junk colours have to die on this line.
 */

const HEX = /^#[0-9a-f]{6}$/i
const SIZES = ['s', 'w', 't', 'l'] as const

const clean = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

/** An uploaded logo lives in `iconSlug` as a data URI. 128KB each — storage.local holds 10MB. */
export const CUSTOM_MAX = 128 * 1024
const CUSTOM = /^data:image\/(svg\+xml|png|jpeg|webp)[;,]/i

/**
 * Schemes that run code instead of addressing something. This is a denylist, not an
 * allowlist: a hub is full of `mongodb://`, `redis://`, `ssh://`, `rdp://`, `vscode://` and
 * whatever else the machine's tools register, and guessing that list in advance is hopeless.
 * What must never get through is a URL that executes in the page — the tile is an `<a>`,
 * and its href is exactly what the browser would run. Same five as the hosted VPortal.
 */
const DANGEROUS_SCHEMES = new Set(['javascript:', 'data:', 'vbscript:', 'blob:', 'filesystem:'])

export function safeUrl(value: unknown) {
  const raw = clean(value, 2048)
  if (!raw) return ''
  if (raw.startsWith('/')) return raw
  // `grafana.internal` or `192.168.1.10:3000` is what people actually type on an
  // internal hub. Assume https rather than dropping the link on save.
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`
  try {
    // `href`, not the raw string: the parser lowercases the scheme and strips the tabs and
    // newlines a browser would strip too, so `java&#9;script:` cannot slip past the check
    // below and then turn back into `javascript:` in the page. Non-special schemes come
    // back byte-identical, so a multi-host connection string survives whole.
    const parsed = new URL(candidate)
    return DANGEROUS_SCHEMES.has(parsed.protocol) ? '' : parsed.href
  } catch {
    return ''
  }
}

/** A catalogue slug (`mongodb`, `lucide:server`), or an uploaded logo's data URI. */
export function safeIcon(value: unknown) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (raw.startsWith('data:')) {
    return CUSTOM.test(raw) && raw.length <= CUSTOM_MAX ? raw : ''
  }
  return raw.slice(0, 64)
}

const id = (value: unknown) => (typeof value === 'string' && /^[\w-]{1,64}$/.test(value) ? value : uid())

/** Rebuilds the document from untrusted input, carrying click counts over from the stored copy. */
export function sanitizeHub(body: unknown, previous?: Hub | null): Hub {
  const raw = (body ?? {}) as Partial<Hub>
  const clicks = new Map<string, number>()
  for (const section of previous?.sections ?? []) {
    for (const link of section?.links ?? []) clicks.set(link.id, link.clicks ?? 0)
  }
  const sections = Array.isArray(raw.sections) ? raw.sections.slice(0, 50) : []
  return {
    title: clean(raw.title, 80) || 'TileTab',
    subtitle: clean(raw.subtitle, 160),
    sections: sections.filter(Boolean).map((input: Partial<Section>) => ({
      id: id(input?.id),
      title: clean(input?.title, 60) || 'Untitled section',
      links: (Array.isArray(input?.links) ? input.links.slice(0, 200) : [])
        .filter(Boolean)
        .map((link: Partial<Link>) => ({
          id: id(link?.id),
          title: clean(link?.title, 60) || 'Untitled link',
          url: safeUrl(link?.url),
          desc: clean(link?.desc, 140),
          iconSlug: safeIcon(link?.iconSlug),
          iconColor: HEX.test(link?.iconColor ?? '') ? (link.iconColor as string) : '#9AA8C4',
          ...(HEX.test(link?.tintColor ?? '') ? { tintColor: link.tintColor } : {}),
          size: SIZES.includes(link?.size as TileSize) ? (link.size as TileSize) : 's',
          newTab: link?.newTab !== false,
          clicks: clicks.get(link?.id as string) ?? (Number(link?.clicks) || 0),
        }))
        .filter((link) => link.url),
    })),
  }
}
