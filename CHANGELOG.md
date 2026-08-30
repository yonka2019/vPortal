# Changelog

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
