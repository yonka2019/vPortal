# Store listing

## Name
TileTab — Link Hub New Tab

## Summary (CWS, ≤132 chars)
Your links as your new tab. Beautiful bento tiles, ~5,200 icons, fully offline. No account, no tracking.

## Description
Your new tab, but it's yours. 🌌

TileTab replaces the new tab with a dark, quiet wall of your own links. Super simple to
set up, beautiful to look at, and minimal on purpose — no feeds, no widgets, no noise.

✨ Bento tiles in four sizes, each lit in its own brand colour
🗂️ Group links into sections, with a category rail down the side
⌨️ ⌘K / Ctrl+K searches every link you have
🎨 ~5,200 icons built in, tintable to any colour — or upload your own logo
🖱️ Edit in place: drag to reorder, or drag a link straight into another section
📊 A "Most opened" strip appears once you start clicking
🪟 Open links in a new tab or this one — your choice is remembered
📦 Export and Import as JSON to move your hub between browsers
♿ Respects reduced motion

🔒 Offline, always. No account, no server, no analytics. The add-on asks for no host
permissions, which means it cannot make a network request even if it wanted to. Your links
never leave your browser.

## Description for AMO (their Markdown subset)
Paste into the Firefox listing's Description field. AMO renders `**bold**`, `_italic_`,
`[text](link)`, `>` quotes, fenced code and `-` lists — nothing else, no headings. The
Summary field above it is plain text, 250 characters: use the short description below.
Reference: https://extensionworkshop.com/documentation/develop/create-an-appealing-listing/#make-use-of-markdown

**Your new tab, but it's yours.** 🌌

TileTab replaces the new tab with a dark, quiet wall of _your own_ links. **Super simple** to set up, **beautiful** to look at, and **minimal** on purpose — no feeds, no widgets, no noise.

- ✨ **Bento tiles** in four sizes, each lit in its own brand colour
- 🗂️ **Group links into sections**, with a category rail down the side
- ⌨️ **⌘K / Ctrl+K** searches every link you have
- 🎨 **~5,200 icons** built in, tintable to any colour — or upload your own logo
- 🖱️ **Edit in place**: drag to reorder, or drag a link straight into another section
- 📊 A **"Most opened"** strip appears once you start clicking
- 🪟 Open links in a **new tab or this one** — your choice is remembered
- 📦 **Export and Import** as JSON to move your hub between browsers
- ♿ Respects **reduced motion**

🔒 **Offline, always.** No account, no server, no analytics. The add-on asks for _no host permissions_, which means it cannot make a network request even if it wanted to. **Your links never leave your browser.**

## Short description (~250 chars, plain text)
Your new tab, but it's yours. TileTab turns it into a wall of your own links as bento tiles — grouped, icon-labelled, lit in brand colour. Search with a keystroke, drag to rearrange. Fully offline: no account, no server, no tracking, ever. Free.

## Short description (light markdown, for Ko-fi / GitHub / README)
**Your new tab, but it's yours.** 🌌

TileTab turns the new tab into a wall of *your own* links — bento tiles, grouped into
sections, each lit in its brand colour.

- ⌨️ **⌘K / Ctrl+K** searches every link
- 🎨 **~5,200 icons** built in, any colour, or upload your own
- 🖱️ **Drag to rearrange**, even between sections
- 📦 **Export / Import** as JSON

🔒 **Fully offline.** No account, no server, no tracking — the add-on asks for no host
permissions, so it *cannot* make a network request.

## Privacy statement
All data stays in the browser's own storage (`chrome.storage.local`). Nothing is sent
anywhere: the add-on has no host permissions and makes no network requests. Uploaded logos
are stored inside your own hub document.

## Permissions justification
- `storage` — saves your links, sections and preferences locally. That is the only
  permission requested.
- `chrome_url_overrides.newtab` — the add-on *is* the new tab page.

## Category
Productivity / Bookmarks

## Screenshots (1280×800, the size the Chrome Web Store wants)
Upload in this order:

1. `tiletab-1280x800-1-home.png` — the hub, three sections, aurora behind the tiles.
2. `tiletab-1280x800-2-search.png` — ⌘K search palette, filtered.
3. `tiletab-1280x800-3-edit.png` — edit mode, tile toolbars and Add link visible.
4. `tiletab-1280x800-4-drag.png` — a link mid-flight into another section.
5. `tiletab-1280x800-5-icons.png` — the icon picker searching "cloud".

`tiletab-1920x1080-home.png` is the same first view at 1920×1080, for AMO and for anywhere
a larger promo image is wanted. `icon-128.png` is the listing icon.

All screenshots are 24-bit RGB with no alpha channel, which the Chrome Web Store requires.

## Promo tiles (Chrome Web Store, optional but shown in search and featured spots)
- `promo-small-440x280.png` — Small promo tile, 440×280.
- `promo-marquee-1400x560.png` — Marquee promo tile, 1400×560.

Both 24-bit RGB, no alpha. Abstract tiles only — no third-party logos in promo art, since
those marks belong to their owners.

## Ko-fi
Page: https://ko-fi.com/yonka2019 — linked from the page footer as a heart plus "Support".

- `kofi-cover-1200x300.png` — page cover.
- `kofi-square-1000x1000.png` — square art for posts and sharing.

Page description (Ko-fi's About field is plain text — line breaks and emoji survive, markdown does not):

Hi, I'm yonka. 👋

I build small software for real life — the kind of thing you make because you wanted it to exist, then polish until it feels right. Mostly browser extensions and little web apps. Free, open, no accounts, nothing phoning home.

A few of them:

🧭 TileTab — a new-tab extension that turns the blank tab into a quiet wall of your own links. Bento tiles, brand colours, ~5,200 icons, ⌘K search. Fully offline.

💌 SayYes — a tiny site for asking someone out with an interactive invitation, in Hebrew, Russian or English. The "no" button runs away from the cursor. It ends in confetti.

Everything I ship is free and stays free. No premium tier, no locked features, no ads.

If something I made saved you a minute or made you smile, a coffee here keeps the lights on ☕ — hosting, store fees, and the evenings that go into the details nobody asks for but everybody feels.

Thank you. 💙

Find me:
💻 github.com/yonka2019
🧭 TileTab — <AMO link> · <CWS link>
💌 SayYes — github.com/yonka2019/SayYes

Short goal line (Ko-fi "Goal" field, optional):
Hosting, store fees, and the coffee that goes into every release. ☕

## AMO source-code build steps
Node 22, then:

    npm ci
    npm run build     # runs scripts/build-icons.mjs, then vite build
    # the uploaded package is the contents of dist/

`public/icons/` is generated by `scripts/build-icons.mjs` from the `simple-icons` and
`lucide-static` packages, which is why it is not in the source archive.
