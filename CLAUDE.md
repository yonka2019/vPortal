# VPortal newtab — working notes

An MV3 new-tab extension: one page of grouped links, editable in place, stored in the
browser. Ported from the hosted VPortal (Express + Mongo) at `X:\EXT-VP\VPortal`. Read
`README.md` for setup; this file records what the code alone doesn't say.

## Shape

- Vite + React 19 + TS. No router, no Tailwind, no CSS-in-JS, no background script, no
  content script, no toolbar action. One page: `newtab.html`.
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
- No password. A gate checked in the page guards nothing when the data sits in
  `chrome.storage`, so edit mode is always open. Don't reintroduce a login.
- `npm run dev` has no `chrome.storage`, so `api.ts` falls back to `localStorage` with the
  same shape. That fallback is what makes the page testable outside the extension.

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
- A dialog's mount effect depends on `[]`, never on a handler prop — the editor re-renders
  per keystroke and re-running focus-restore made fields untypeable.
- One `DndContext` shares a flat droppable registry: sections and links must be filtered
  apart in both `collisionDetection` and the keyboard `coordinateGetter`.
- `crypto.randomUUID` is secure-context only; ids go through `src/uid.ts`.
- `src/sanitize.ts` imports `./uid.ts` **with** the extension: its test runs in plain Node,
  which doesn't resolve extensionless paths the way Vite does.
- `EditLayer` is lazy-loaded so dnd-kit stays out of the first chunk. Check the build
  output if you touch the import.
- MV3 page CSP allows no inline `<script>` and no `eval`. Vite's output is fine; keep it
  that way.
- `build.minify: false` is deliberate — AMO reviewers read the shipped file.

## Not built (deliberately)

Accounts, sync between browsers (Export/Import instead), the RSS ticker (it needs a host
permission), a popup or toolbar action, light mode, image upload beyond the 128KB logo.
Each is a real feature, not an oversight — ask before adding.
