# Changelog

## [v1.1.4] : 2026-09-05

- Fixed: a new tab in Firefox showed "Loading" for about two seconds before a single tile
  appeared. The page painted nothing until `chrome.storage.local` answered, and that read
  is an IPC round trip to IndexedDB — cheap in Chrome, slow in Firefox, which never
  preloads an overridden new tab, so every tab pays it in a cold content process. The hub
  is now mirrored into `localStorage` and read synchronously at first render, the same
  trade the inlined marks already make; storage answers a moment later and reconciles.
  Measured at 16 of 16 tiles in the first frame and a 0ms mirror read. The very first tab
  after installing is unchanged — there is nothing mirrored yet.
- Storage stays the only source of truth: the mirror is a paint cache, it is shaped by
  `sanitizeHub` like anything else read back, it carries click counts so the "Most opened"
  strip is never a click behind, and Export does not include it.

## [v1.1.3] : 2026-09-04

- Working notes only, no code change: `CLAUDE.md` gains a Releasing section recording that
  `/y-git-up` in this repo must also run `/build`, so the store zips are produced as part
  of a release rather than being remembered separately.

## [v1.1.2] : 2026-09-04

- The footer byline links to yonka.digital. Opens in a new tab, `rel="noreferrer noopener"`.
  No new permission and no request from the page — a link the reader clicks is navigation,
  so the "no network requests" claim in the listing still holds.
- The page fades in as a whole, over 0.2s, instead of the tiles arriving one by one.
  Several per-tile entrances were tried — a scale-in, a staggered rise, a plain fade at
  three speeds, a small rise split from its fade — and each read as the page jumping,
  because anything that moves a tile moves the title and mark a reader is looking at. The
  fade is an overlay that lifts, so no tile's position, size or backdrop blur changes at
  any point. Reduced motion skips it.
- Fixed: the marks appeared a frame or two after the tiles that carry them. A CSS mask
  only starts loading once its tile has been painted, so a tile was always drawn complete
  with its text and empty where its mark goes. Each mark a hub uses is now fetched once,
  inlined as a `data:` URI and cached per browser, so from the second new tab onwards the
  mask is already in the stylesheet and needs no request: measured at 16 of 16 marks
  cached and zero icon requests per load, in Chrome and Firefox both. The first ever load
  is unchanged, nothing waits on the cache being filled.
- The aurora drift steps six times a second instead of easing at 60fps. Each move re-blurs
  the backdrop of every tile, so the old version kept the GPU compositing the whole window
  for as long as the tab was open — GPU compositor busy time drops from ~42% to ~3.5%, and
  drawn frames from 200/s to 7/s. The blobs travel about 7px a second, so a step is one or
  two pixels of a gradient that is blurred to nothing: the motion looks the same.
- Fixed: the category rail painted with no row lit and lit one a frame later. The first
  category is lit from the start, which is what a page opened at the top measures to
  anyway.
- Greeting weekdays follow the Israeli week: Sunday opens it, Thursday is the last workday,
  Friday and Saturday are the weekend.

## [v1.1.1] : 2026-09-03

- Store listing rewritten for the Chrome Web Store spam policy: bare name, plain factual
  description, no emoji. Emoji copy kept for Ko-fi and GitHub. Appeal draft added. No code
  change.

## [v1.1.0] : 2026-09-02

- **Renamed to TileTab.** Manifest name, page title, seed hub title, package name, store
  listing and privacy policy all carry the new name, and an exported file is now
  `tiletab-<date>.json`. Listing copy rewritten and the screenshots retaken under the new
  name as `store/tiletab-1280x800-*.png` plus a 1920×1080 hero, two Chrome promo tiles and
  Ko-fi cover art.
  References to the hosted VPortal the page was ported from are left as they are — that is
  a different project, not this one.
- **New mark.** The icon is the bento itself — one tall tile beside two small ones, drawn
  in `scripts/build-icons.mjs` as `icons/tile-*.png`, replacing the orbit. Same teal. The
  in-page glyph and `store/icon-128.png` match.
- A **Support** link in the footer, pointing at Ko-fi. Inline heart glyph, not Ko-fi's
  hosted button image — nothing on the page may load from a CDN.
- Fixed: `source.zip` now carries `public/background.js`. The packager names `public/`
  files one by one, and the worker was not on the list — AMO would have seen a file in the
  build with no source behind it.
- Install and update open one new tab (`public/background.js`, `onInstalled`). Manifest
  gains `background` with `service_worker` + `scripts`. No new permissions.
- Links can be dragged into another section, and a section emptied that way offers a drop
  zone so links can come back. Move logic in `src/reorder.ts`, covered by
  `test/reorder.test.mjs`.
- The header greeting now draws a random line from the pool for this hour and this weekday,
  from the first paint. Monday and Friday read differently, and the line always changes on
  each turn rather than repeating.
- Fixed: the new tab / this tab switch is remembered for good. It sat in `sessionStorage`,
  and a new-tab page starts a fresh session on every tab, so it reset every time.
- Fixed: the dragged tile trailed the pointer by 340ms with an overshoot, because `.tile`'s
  transform transition was animating the drag. The tile now tracks the pointer as an
  overlay, and the tile it left holds its slot open.

## [v1.0.1] : 2026-08-30

Store-submission fixes. No code changes.

- Manifest: `data_collection_permissions: { required: ["none"] }` — AMO now rejects
  submissions without it.
- `store/privacy-policy.md` — no-data-collected policy for the Chrome Web Store privacy
  URL (host as a gist).
- `store/icon-128.png` and `store/vportal-newtab-*.png` — listing icon and screenshots
  (1440×900, 1920×1080, 1280×800).

## [v1.0.0] : 2026-08-30

----------- ENV CHANGES -------------

- `DASH_SRC` (new, build-only, optional) — source folder for `dash:` colour logos read by
  `scripts/build-icons.mjs`. Defaults to `X:/EXT-VP/VPortal/server/icons`. Not read at
  runtime; no `.env` file is used.

First release. The hosted VPortal page as an MV3 new-tab extension.

- Hub document in `chrome.storage.local`, seeded from a bundled sample. No server, no
  Mongo, no login.
- Export / Import JSON in edit mode — the only way to move a hub between browsers.
- ~5,250 one-colour marks bundled and tinted with CSS `mask`; colour logos limited to what
  the seed names.
- Custom logo upload (SVG/PNG/JPEG/WebP, 128KB), stored as a data URI in the link.
- Zero permissions beyond `storage`. No host permissions, so no outbound requests.
- Dropped from the hosted version: the password gate, the RSS ticker, `/admin`, the
  server's own icon and feed routes.
