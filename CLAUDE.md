# TileTab newtab — working notes

An MV3 new-tab extension: one page of grouped links, editable in place, stored in the
browser. Ported from the hosted VPortal (Express + Mongo) at `X:\EXT-VP\VPortal`. Read
`README.md` for setup; this file records what the code alone doesn't say.

## Shape

- Vite + React 19 + TS. No router, no Tailwind, no CSS-in-JS, no content script, no
  toolbar action. One page: `newtab.html`.
- `public/background.js` is the only background code: `onInstalled` (install + update)
  opens one new tab so the page shows itself. Plain file, not bundled. Manifest lists it as
  both `service_worker` (Chrome) and `scripts` (Firefox has no MV3 service workers yet);
  each browser reads its key and ignores the other. `tabs.create` needs no permission.
- `permissions: ["storage"]` and **no `host_permissions`** — the add-on makes no network
  requests, which is what the store listing promises. Keep it that way; anything that
  needs a host permission changes the review and the privacy claim.
- `public/manifest.json` (Vite copies `public/` verbatim). Its version must match
  `package.json` — `npm run package` fails if they drift.
- Everything ships local: fonts in `public/fonts/`, icons generated into `public/icons/`.
  Never load a font or icon from a CDN.

## Data

- One document in `chrome.storage.local` under `hub`, seeded once from the bundled
  `public/hub.default.json`.
- **`src/sanitize.ts` is the whole validation boundary** — the server that used to do this
  is gone. Both Save and Import go through it, and an imported file is untrusted input:
  `safeUrl` drops anything that isn't `http(s)` or root-relative, colours must be `#rrggbb`,
  and click counts are carried from the stored copy so an edit never resets them.
  `test/sanitize.test.mjs` covers those.
- `src/api.ts` keeps the last read hub in a module variable. `countClick` needs it: a
  read-modify-write would have to wait for storage to answer, and the tab is usually
  navigating away by then. One unawaited `set` survives; a round-trip does not.
- **The hub is mirrored into `localStorage` under `vp_hub`, and that mirror is what the
  first frame draws.** `storage.local` is an IPC round trip to IndexedDB and Firefox never
  preloads an overridden new tab, so every tab is a cold content process: answering that
  read took about two seconds of "Loading" before a tile appeared. `mirroredHub()` is the
  initial state of `Hub`, `getHub`/`saveHub`/`countClick` rewrite the mirror, and the real
  read reconciles when it lands — identical documents keep the same object so an open draft
  never looks unsaved. Storage stays the truth; the mirror is a paint cache, goes through
  `sanitizeHub` like anything else stored, and never travels with Export.
  `test/api.test.mjs` covers it. `api.ts` therefore imports `./sanitize.ts` **with** the
  extension, for the same reason `sanitize.ts` imports `./uid.ts` that way.
- **`public/title.js` sets the tab title, and it has to stay a separate file in `<head>`.**
  `newtab.html` carries one fixed `<title>`, so a renamed hub flashed "TileTab" for as long
  as the bundle took to load and mount — every new tab. A classic (non-module) script in
  the head runs while the document is still parsing, about a second before React on a cold
  load, and reads the hub name out of the same `vp_hub` mirror. It cannot be inlined: MV3
  page CSP allows no inline `<script>`. Vite copies `public/` verbatim and leaves the
  absolute `/title.js` tag alone — check `dist/newtab.html` if you touch it. React's effect
  still owns the title after that, including the "— editing" suffix and a live rename.
  `test/title.test.mjs` runs the file the way the browser does.
- `src/greeting.ts` works the **Israeli week**: Sunday opens it, Thursday is the last
  workday, Friday and Saturday are the weekend. A Sunday line that reads as time off is a
  bug; `test/greeting.test.js` asserts it.
- No password. A gate checked in the page guards nothing when the data sits in
  `chrome.storage`, so edit mode is always open. Don't reintroduce a login.
- `npm run dev` has no `chrome.storage`, so `api.ts` falls back to `localStorage` with the
  same shape. That fallback is what makes the page testable outside the extension.
- `src/prefs.ts` holds the three per-browser switches — new tab / this tab, the "Most
  opened" strip, and whether edit mode was left on. All three are `localStorage`, read
  synchronously at first render, and none of them travels with Export. Nothing here may use
  `sessionStorage`: a new-tab page gets a fresh session on every tab, so the choice would be
  forgotten every time.

## Icons

`scripts/build-icons.mjs` writes `public/icons/` (gitignored, ~9MB, ~5,250 files) and the
search index. `src/icons.ts` holds the browse list, the aliases and the ranking, ported
from the server's `/api/icons` so search behaves the same.

- **One-colour marks are CSS masks, not images**: `.licon__mask` masks the SVG and paints
  `--icon-color` behind it. That replaces the server's `?c=` recolouring — one file per
  mark, any colour. `dash:` logos and uploaded files stay real `<img>`s; a mask would
  flatten them to one tone.
- `LinkIcon` renders a **wrapper** plus the masked child on purpose. `filter` is applied
  before `mask`, so `.tile__icon`'s drop-shadow on the masked element itself would trace
  its whole square instead of the mark.
- Only `dash:` logos named by the seed are copied, and only SVG ones. A hub imported from
  the hosted VPortal can therefore reference a colour logo this build lacks — it shows as a
  broken image, and the fix is to upload the file or pick another mark.
- Uploaded logos live in `link.iconSlug` as a `data:` URI (so Export carries them), capped
  at 128KB, and are painted **only** through `<img src="data:…">` — a non-scripting
  context. Never inline a custom SVG into the DOM.

## Design language

Unchanged from the hosted version: dark "Aurora Glass + Bento", three slow radial blobs
whose colour follows the tile you point at (`setBeam()` in `src/components/Aurora.tsx`),
4-column bento, 28px corners, brand colour arriving as a corner light. Tokens in
`src/styles/tokens.css`, everything else in `src/styles/app.css`. Modern CSS always sits
one line below a plain fallback (`-webkit-mask` before `mask`, flat colour before
`color-mix()`, `vh` before `dvh`). Brand hexes go through `readable()` in `src/color.ts`.

## Gotchas

- `body` must stay `background: transparent`, or it paints over the aurora at `z-index: -2`.
- **The aurora drift steps, and must keep stepping.** `steps()` on each blob works out to
  six moves a second. Every move re-blurs the backdrop of all 16 tiles, so easing it at
  60fps pinned the GPU forever (Viz compositor 42% busy, GPU main 38%) for motion of about
  one pixel a frame. Stepping costs a tenth of that and looks identical. Restore
  `ease-in-out` and the drain comes straight back.
- **A hub's marks are inlined and cached; masks must never go back to fetching files.**
  `cacheIcons()` in `src/icons.ts` fetches each mark once, turns it into a `data:` URI and
  keeps the map in `localStorage` under `vp_icons`, keyed by the app version so a rebuild
  with redrawn marks invalidates it. `iconUrl()` reads that map synchronously at first
  render, so from the second new tab onwards a tile's mask needs no request at all. A miss
  falls back to the file path, which is the old behaviour, so this can never be slower.
  It is called unawaited — nothing waits on it, and the first ever load paints as it always
  did.
  **Preloading was the obvious fix and it does not work.** A `mask-image` only starts
  loading once its tile has painted, and a mask reads a cache that neither `new Image()`
  nor `<link rel="preload" as="image">` fills — both doubled the requests. Warming it with
  a real offscreen masked `<span>` works in Chrome but **not** in a Firefox extension page,
  where the tiles fetched every mark a third time: three requests per mark on every new
  tab, and marks that took about a second to appear. That shipped once and was reverted.
  Don't try it again.
  The guard in `svgToDataUri` has to allow what precedes the tag — every lucide mark opens
  with its ISC licence comment, and requiring `<svg` first silently refused all of them.
  `test/icons.test.mjs` covers that.
- **The page fades in as one; individual tiles never animate.** `body::after` is a curtain
  in the void colour that starts opaque and fades away in 0.35s. Five per-tile entrances
  were tried before this and every one was rejected: a `scale(0.985)` grow-in that widened
  a 2x2 tile by 8px late, a 12px rise on a per-tile stagger that made every title look like
  it travelled, a plain opacity fade at three speeds, and a 4px rise split from its fade.
  Anything that moves or restages a tile reads as the page jumping — one fade over
  everything does not, because nothing shifts relative to anything else.
  Two things about the curtain are load-bearing. It must stay an overlay: putting `opacity`
  on `.shell` or `#root` wraps the content in an opacity group, and every tile's
  `backdrop-filter` then samples that group instead of the real backdrop while the fade
  runs. And its resting state must be `opacity: 0` with the keyframe starting at 1 — write
  it the other way round and the reduced-motion rule, which kills the animation, leaves the
  curtain sitting over the page for good.
  If a per-tile entrance is ever revisited, the `index` prop that fed the stagger is gone
  from `Tile`, `EditableTile` and `SortableTile`.
- Links change section on `onDragOver`, so the layout is rewritten mid-drag. That needs
  `MeasuringStrategy.Always`: with the default the droppable rects go stale and the release
  lands on the old layout. The list surgery is pure and tested in `src/reorder.ts`.
- A section with no links has no tile to aim at, so it renders `DropZone` — a droppable
  whose id is `zone:<sectionId>`, which is how the last link can leave a section.
- dnd-kit animates in JavaScript, so the stylesheet's `prefers-reduced-motion` block cannot
  reach it: `calmMotion()` in `EditLayer` reads the query and drops the slide-aside. The
  drop settle is off for everyone — it fought `Always` measuring and left the overlay
  hanging for over a second.
- `crypto.randomUUID` is secure-context only; ids go through `src/uid.ts`.
- `src/sanitize.ts` imports `./uid.ts` **with** the extension: its test runs in plain Node,
  which doesn't resolve extensionless paths the way Vite does.
- `EditLayer` is lazy-loaded so dnd-kit stays out of the first chunk. Check the build
  output if you touch the import.
- MV3 page CSP allows no inline `<script>` and no `eval`. Vite's output is fine; keep it
  that way.
- `build.minify: false` is deliberate — AMO reviewers read the shipped file.

## Releasing

`/y-git-up` in this repo must also run `/build` — the store zips are part of a release
here, not a separate errand. `/build` runs `npm run package`, which writes `dist.zip` and
`source.zip` and refuses if `package.json` and `public/manifest.json` versions differ.
Order: bump both versions, `npm run build`, then `/build`, then commit, push, tag.

## Not built (deliberately)

Accounts, sync between browsers (Export/Import instead), the RSS ticker (it needs a host
permission), a popup or toolbar action, light mode, image upload beyond the 128KB logo.
Each is a real feature, not an oversight — ask before adding.
