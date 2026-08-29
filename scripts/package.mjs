// Builds the two zips a store upload needs:
//   dist.zip    — what the browser runs (upload this to AMO and the Chrome Web Store)
//   source.zip  — AMO requires the sources whenever a bundler produced the upload
//
// Node has no zip writer and shelling out is a coin toss on Windows (GNU tar can't write
// zip, Compress-Archive crawls over 5k files), so this writes the archive itself.

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'manifest.json'), 'utf8'))
if (pkg.version !== manifest.version) {
  console.error(`version mismatch: package.json ${pkg.version}, manifest ${manifest.version}`)
  process.exit(1)
}

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

/** Files as `{ name, body }`, deflated, with a central directory. No zip64, no comments. */
function zip(files) {
  const parts = []
  const central = []
  let offset = 0

  for (const { name, body } of files) {
    const deflated = zlib.deflateRawSync(body, { level: 9 })
    // Stored beats deflate when deflate grew the file (tiny SVGs do this).
    const stored = deflated.length >= body.length
    const payload = stored ? body : deflated
    const nameBytes = Buffer.from(name, 'utf8')
    const sum = crc32(body)

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4) // version needed
    local.writeUInt16LE(0x0800, 6) // UTF-8 names
    local.writeUInt16LE(stored ? 0 : 8, 8)
    local.writeUInt32LE(sum, 14)
    local.writeUInt32LE(payload.length, 18)
    local.writeUInt32LE(body.length, 22)
    local.writeUInt16LE(nameBytes.length, 26)
    parts.push(local, nameBytes, payload)

    const entry = Buffer.alloc(46)
    entry.writeUInt32LE(0x02014b50, 0)
    entry.writeUInt16LE(20, 4)
    entry.writeUInt16LE(20, 6)
    entry.writeUInt16LE(0x0800, 8)
    entry.writeUInt16LE(stored ? 0 : 8, 10)
    entry.writeUInt32LE(sum, 16)
    entry.writeUInt32LE(payload.length, 20)
    entry.writeUInt32LE(body.length, 24)
    entry.writeUInt16LE(nameBytes.length, 28)
    entry.writeUInt32LE(offset, 42)
    central.push(entry, nameBytes)

    offset += local.length + nameBytes.length + payload.length
  }

  const directory = Buffer.concat(central)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(files.length, 8)
  end.writeUInt16LE(files.length, 10)
  end.writeUInt32LE(directory.length, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...parts, directory, end])
}

/** Every file under `dir`, as zip entries rooted at `prefix`. */
function walk(dir, prefix = '') {
  const out = []
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name)
    const name = prefix ? `${prefix}/${item.name}` : item.name
    if (item.isDirectory()) out.push(...walk(full, name))
    else out.push({ name, body: fs.readFileSync(full) })
  }
  return out
}

const write = (file, files) => {
  const body = zip(files)
  fs.writeFileSync(path.join(ROOT, file), body)
  console.log(`${file}: ${files.length} files, ${(body.length / 1e6).toFixed(1)}MB`)
}

const dist = path.join(ROOT, 'dist')
if (!fs.existsSync(path.join(dist, 'manifest.json'))) {
  console.error('no dist/manifest.json — run `npm run build` first')
  process.exit(1)
}
write('dist.zip', walk(dist))

// The sources a reviewer needs to reproduce that build. `public/icons/` is left out on
// purpose: `npm run build:icons` regenerates it from simple-icons and lucide-static.
const SOURCE = [
  'src', 'scripts', 'test', 'store', 'public/fonts',
  'public/manifest.json', 'public/hub.default.json',
  'newtab.html', 'package.json', 'package-lock.json', 'tsconfig.json', 'vite.config.ts',
  'README.md', 'CLAUDE.md', 'CHANGELOG.md', 'LICENSE', '.gitignore',
]
const source = SOURCE.flatMap((item) => {
  const full = path.join(ROOT, item)
  if (!fs.existsSync(full)) return []
  return fs.statSync(full).isDirectory()
    ? walk(full, item)
    : [{ name: item, body: fs.readFileSync(full) }]
})
write('source.zip', source)
