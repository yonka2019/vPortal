# TileTab — new tab extension

Your links as the new tab page: grouped, icon-labelled tiles over a drifting aurora.
Chrome and Firefox, MV3. Everything lives in the browser — no server, no account, no
network requests.

Ported from the hosted VPortal (Express + Mongo). Same page, same design; the server is
gone.

## Install

Build first: `npm ci && npm run build` → `dist/`.

- **Chrome** — `chrome://extensions` → Developer mode → Load unpacked → pick `dist/`.
- **Firefox** — `about:debugging` → This Firefox → Load Temporary Add-on → pick
  `dist/manifest.json`. 🔴 Temporary add-ons die on restart; use a signed build for good.

## Develop

```bash
npm run dev        # localhost:5174 in a normal tab — chrome.storage falls back to localStorage
npm run build      # build:icons + vite build → dist/
npm test           # node --test
npm run typecheck
npm run package    # dist.zip (stores) + source.zip (AMO needs it)
```

## Data

One hub document in `chrome.storage.local` under `hub`. First run seeds it from the
bundled `public/hub.default.json`. Edit mode has no password — a check in the page would
guard nothing when storage is one devtools click away.

In edit mode, drag a link by its grip to reorder it or to drop it into another section;
drag a section by the grip beside its name. Keyboard: focus a grip, Space, arrows, Space.

**Export / Import** (in edit mode) moves the hub between browsers and machines as JSON.
That is the only sync there is.

A copy also sits in `localStorage` under `vp_hub`, so a new tab paints its tiles
immediately instead of waiting on `chrome.storage` (visible in Firefox, ~2s). Storage is
still the truth.

Delete the `hub` key to get the sample back.

An address can be any scheme your machine answers to — `https://`, but also `mongodb://`,
`ssh://`, `rdp://`, `vscode://`. A bare host like `grafana.internal` assumes `https://`.
Addresses that would run code in the page (`javascript:`, `data:`, `vbscript:`, `blob:`,
`filesystem:`) are dropped on save and on import. Whether a non-web link opens is up to
the browser and whatever app is registered for that scheme.

The new tab / this tab switch, the "Most opened" strip and edit mode are remembered per
browser in `localStorage`, separately from the hub — Export does not carry them.

Install and update each open one new tab (`public/background.js`). Nothing else runs in
the background.

## Icons

`npm run build:icons` writes `public/icons/` (gitignored, ~9MB, ~5,250 files):

- `si/` — every simple-icons mark, `lu/` — every lucide mark. Recoloured by CSS `mask`,
  so one file serves every colour.
- `dash/` — full-colour logos, only the ones `hub.default.json` names, copied from a local
  checkout of the hosted VPortal (`DASH_SRC=...` to point elsewhere). SVG only: the whole
  SVG half of that catalogue is 44MB. PNG-only logos aren't bundled — upload them instead.
- `index.json` — the search index the picker loads on first open.
- `tile-*.png` — the add-on's own icon.

**Custom logos**: the link dialog takes an SVG/PNG/JPEG/WebP up to 128KB. It's stored as a
data URI inside the link, so Export carries it.

## Publishing

1. `npm run build && npm run package`.
2. **AMO (listed)** — upload `dist.zip`, then `source.zip` when asked for sources (a
   bundler produced the upload, so it is required). Build steps for the reviewer:
   Node 22, `npm ci`, `npm run build`. First listed review is done by a human — days.
3. **Chrome Web Store** — upload `dist.zip`. One-off $5 developer account.

Listing copy lives in `store/listing.md`; the privacy policy (Chrome asks for a URL —
host `store/privacy-policy.md` as a gist), listing icon and screenshots sit beside it.

`manifest.json` and `package.json` versions must match — `npm run package` refuses
otherwise.

## Licences

Own code: MIT (`LICENSE`). Bundled marks keep theirs: simple-icons CC0-1.0, lucide ISC,
dashboard-icons MIT. 🔴 The logos are their owners' trademarks — the listing must not imply
any endorsement.
