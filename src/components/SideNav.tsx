import { useEffect, useRef, useState } from 'react'
import { currentSection } from '../currentSection'
import { readable } from '../color'
import type { CSSProperties } from 'react'
import type { Section } from '../types'
import { resetBeam, setBeam } from './Aurora'

/** The id a section heading carries, so the rail's links can jump straight to it. */
export const sectionAnchor = (id: string) => `section-${id}`

/**
 * The `#anchor` the page was opened on is honoured once per page load — module scope, not
 * a ref: edit mode unmounts the rail, and a per-mount flag re-ran the jump on Done and
 * yanked the page back to the last category you clicked.
 */
let jumped = false

/** A category's colour is its first tile's — it tints the active row and the beam. */
const accentOf = (section: Section) => {
  const first = section.links[0]
  return readable(first?.tintColor || first?.iconColor || '#7c6bff')
}

/**
 * The left rail: every category, its link count, and where you are in the page.
 * Jumping is a plain `#anchor` — the browser scrolls, smoothly, with no JS of ours;
 * the only script here is the highlight: one rAF-throttled measurement per scroll.
 */
export function SideNav({ sections }: { sections: Section[] }) {
  // Seeded with the first category, which is what a page opened at the top measures to
  // anyway. Starting empty meant the rail painted with no row lit and then lit one a
  // frame later, next to tiles that were doing the same thing with their icons.
  const [current, setCurrent] = useState(() => sections[0]?.id ?? '')
  // A clicked row lights at once and stays lit until the visitor scrolls by hand: the
  // sections flying past during the glide must not repaint it, and at the end of the page
  // a clamped scroll leaves the target mid-screen, where no measurement would name it.
  const pinned = useRef(false)

  useEffect(() => {
    const heads = sections
      .map((section) => document.getElementById(sectionAnchor(section.id)))
      .filter((el): el is HTMLElement => !!el)
    if (!heads.length) return

    // The browser tried the `#anchor` while the page was still one empty div — the hub
    // arrives over the network — so it never scrolled. Do that jump once, now that the
    // headings exist, or every shared and reloaded rail link lands at the top.
    if (!jumped) {
      jumped = true
      const target = location.hash && document.getElementById(location.hash.slice(1))
      if (target) target.scrollIntoView()
    }

    let frame = 0
    const measure = () => {
      frame = 0
      if (pinned.current) return
      const view = window.innerHeight
      const max = document.documentElement.scrollHeight - view
      const index = currentSection(
        heads.map((head) => head.getBoundingClientRect().top),
        view,
        max > 2,
        window.scrollY >= max - 2,
      )
      setCurrent(heads[index].id.slice('section-'.length))
    }
    const onScroll = () => {
      // one measurement per frame, however many scroll events arrive
      if (!frame) frame = requestAnimationFrame(measure)
    }
    // Only real input releases the pin — wheel, touch, a key, a drag of the scrollbar.
    // The glide a click starts fires `scroll`, so it cannot release itself.
    const release = () => {
      if (!pinned.current) return
      pinned.current = false
      onScroll()
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    window.addEventListener('wheel', release, { passive: true })
    window.addEventListener('touchstart', release, { passive: true })
    window.addEventListener('keydown', release)
    window.addEventListener('mousedown', release)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('wheel', release)
      window.removeEventListener('touchstart', release)
      window.removeEventListener('keydown', release)
      window.removeEventListener('mousedown', release)
    }
  }, [sections])

  return (
    <nav className="sidenav" aria-label="Categories">
      <p className="mono sidenav__caption">Categories</p>
      {sections.map((section) => {
        const accent = accentOf(section)
        return (
          <a
            key={section.id}
            className={`sidenav__item${current === section.id ? ' sidenav__item--on' : ''}`}
            href={`#${sectionAnchor(section.id)}`}
            style={{ '--accent': accent } as CSSProperties}
            aria-current={current === section.id ? 'true' : undefined}
            title={section.title}
            onClick={() => {
              pinned.current = true
              setCurrent(section.id)
              // The browser drops a second `#anchor` jump while it is still gliding to the
              // first, so a quick change of mind left you at the old category with the new
              // one lit. Scrolling ourselves retargets; the href still sets the hash.
              document.getElementById(sectionAnchor(section.id))?.scrollIntoView()
            }}
            onMouseEnter={() => setBeam(accent)}
            onMouseLeave={resetBeam}
          >
            <span className="sidenav__name">{section.title}</span>
            <span className="sidenav__count mono">{section.links.length}</span>
          </a>
        )
      })}
    </nav>
  )
}
