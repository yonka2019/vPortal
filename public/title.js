// The tab title, before anything else runs.
//
// `newtab.html` can only carry one fixed <title>, so a renamed hub used to show "TileTab"
// for as long as the bundle took to load and mount — a visible flash on every new tab.
// This is a classic script in <head>, so it runs while the document is still parsing,
// long before the module graph is fetched. It reads the same `vp_hub` mirror the page
// paints from; React's own effect keeps the title right after that, including the
// "— editing" suffix and a rename typed live.
//
// Not inline: an MV3 page's CSP allows no inline <script>.
try {
  var hub = JSON.parse(localStorage.getItem('vp_hub'))
  // `localStorage` is not a trust boundary, and 80 is the cap `sanitizeHub` writes with.
  if (hub && typeof hub.title === 'string' && hub.title.trim()) {
    document.title = hub.title.trim().slice(0, 80)
  }
} catch (e) {
  // Private mode, storage disabled, or junk in the key: the fixed <title> stands.
}
