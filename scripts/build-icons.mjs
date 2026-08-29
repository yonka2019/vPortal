// Builds public/icons/: every one-colour mark as its own SVG file, a search index over
// them, the colour logos the seed asks for, and the add-on's own PNG icons.
//
// Run before `vite build` (npm run build does). Output is gitignored — ~9MB, ~5,250 files.

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'
import * as simpleIcons from 'simple-icons'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public', 'icons')
const LUCIDE_DIR = path.join(ROOT, 'node_modules', 'lucide-static', 'icons')
// Colour logos are vendored in the server VPortal grew up in; only the ones the seed
// names get copied — the whole SVG half of that catalogue is 44MB.
const DASH_SRC = process.env.DASH_SRC ?? 'X:/EXT-VP/VPortal/server/icons'
const GENERIC = '#9AA8C4'

const title = (name) => name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

fs.rmSync(OUT, { recursive: true, force: true })
for (const dir of ['si', 'lu', 'dash']) fs.mkdirSync(path.join(OUT, dir), { recursive: true })

const index = []

// ---------------------------------------------------------------- one-colour marks

for (const icon of Object.values(simpleIcons)) {
  if (typeof icon?.slug !== 'string' || typeof icon?.path !== 'string') continue
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="${icon.path}"/></svg>`
  fs.writeFileSync(path.join(OUT, 'si', `${icon.slug}.svg`), svg)
  index.push({ s: icon.slug, t: icon.title, h: `#${icon.hex}` })
}

for (const file of fs.readdirSync(LUCIDE_DIR)) {
  if (!file.endsWith('.svg')) continue
  const name = file.slice(0, -4)
  fs.copyFileSync(path.join(LUCIDE_DIR, file), path.join(OUT, 'lu', file))
  index.push({ s: `lucide:${name}`, t: title(name), h: GENERIC })
}

// ---------------------------------------------------------------- colour logos

const seed = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'hub.default.json'), 'utf8'))
const wanted = new Set(
  seed.sections
    .flatMap((section) => section.links ?? [])
    .map((link) => link.iconSlug)
    .filter((slug) => typeof slug === 'string' && slug.startsWith('dash:'))
    .map((slug) => slug.slice(5)),
)

let copied = 0
for (const name of wanted) {
  // SVG only. A PNG served under a .svg name is a broken image, and the client stays
  // extension-blind on purpose — upload the logo instead if only a PNG exists.
  const from = path.join(DASH_SRC, `${path.basename(name)}.svg`)
  if (!fs.existsSync(from)) {
    console.warn(`no SVG colour logo for dash:${name} — skipped`)
    continue
  }
  fs.copyFileSync(from, path.join(OUT, 'dash', `${name}.svg`))
  index.push({ s: `dash:${name}`, t: title(name), h: GENERIC })
  copied += 1
}

fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index))

// ---------------------------------------------------------------- the add-on's own icon

const CRC = Int32Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c
})

const crc32 = (buffer) => {
  let c = 0xffffffff
  for (const byte of buffer) c = CRC[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

const chunk = (type, body) => {
  const head = Buffer.alloc(8)
  head.writeUInt32BE(body.length, 0)
  head.write(type, 4, 'ascii')
  const tail = Buffer.alloc(4)
  tail.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0)
  return Buffer.concat([head, body, tail])
}

/** RGBA pixels → PNG. Four tiny icons don't justify a rasteriser dependency. */
function png(size, pixels) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const rows = []
  for (let y = 0; y < size; y += 1) {
    rows.push(Buffer.from([0]), pixels.subarray(y * size * 4, (y + 1) * size * 4))
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** The mark: a teal orbit — one ring, one satellite, one core. Same shape as the favicon. */
function orbit(size) {
  const [r, g, b] = [0x34, 0xe0, 0xb4]
  const pixels = Buffer.alloc(size * size * 4)
  const mid = (size - 1) / 2
  const ring = size * 0.38
  const stroke = Math.max(1, size * 0.075)
  const core = size * 0.13
  const satellite = { x: mid + ring * 0.707, y: mid - ring * 0.707, r: Math.max(1, size * 0.11) }
  // One sample per pixel plus a half-pixel feather: enough at 16px, invisible at 128px.
  const cover = (distance, edge) => Math.max(0, Math.min(1, edge - distance + 0.5))

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x - mid
      const dy = y - mid
      const d = Math.hypot(dx, dy)
      const alpha = Math.max(
        cover(Math.abs(d - ring), stroke / 2),
        cover(d, core),
        cover(Math.hypot(x - satellite.x, y - satellite.y), satellite.r),
      )
      const at = (y * size + x) * 4
      pixels[at] = r
      pixels[at + 1] = g
      pixels[at + 2] = b
      pixels[at + 3] = Math.round(alpha * 255)
    }
  }
  return png(size, pixels)
}

for (const size of [16, 32, 48, 128]) {
  fs.writeFileSync(path.join(OUT, `orbit-${size}.png`), orbit(size))
}

console.log(`${index.length} icons indexed (${copied} colour logos), 4 add-on icons`)
