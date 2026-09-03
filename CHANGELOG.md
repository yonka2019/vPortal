# Changelog

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
