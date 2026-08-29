import { useEffect, useRef, useState } from 'react'
import { readable } from '../color'
import { searchIcons } from '../icons'
import type { IconChoice } from '../types'
import { Search } from './glyphs'
import { LinkIcon } from './LinkIcon'

// The browse list never changes within a session; keeping it makes reopening instant.
let browseCache: IconChoice[] | null = null

export function IconPicker({
  slug,
  color,
  onPick,
}: {
  slug: string
  color: string
  onPick: (slug: string, hex: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  // null = nothing fetched yet, so the empty state can say "loading", not "no match".
  const [results, setResults] = useState<IconChoice[] | null>(null)
  const [loading, setLoading] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    if (!query && browseCache) {
      setResults(browseCache)
      setLoading(false)
      return
    }
    // Debounce typing only; the browse list should appear at once. Offline the search is
    // a scan of a local index, so the delay is only there to stop it running per keystroke.
    let stale = false
    setLoading(true)
    const timer = setTimeout(() => {
      searchIcons(query)
        .then((icons) => {
          if (stale) return
          if (!query) browseCache = icons
          setResults(icons)
        })
        .catch(() => !stale && setResults([]))
        .finally(() => !stale && setLoading(false))
    }, query ? 140 : 0)
    return () => {
      stale = true
      clearTimeout(timer)
    }
  }, [open, query])

  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div className="picker" ref={rootRef}>
      <button
        type="button"
        className="picker__trigger"
        onClick={() => setOpen((value) => !value)}
        aria-label={slug ? `Icon: ${slug}. Change it` : 'Choose an icon'}
      >
        {slug ? <LinkIcon slug={slug} color={readable(color)} /> : <Search />}
      </button>

      {open && (
        <div
          className="picker__pop"
          /* Scoped, not on document: a listener there would also reach the dialog
             underneath and close both with one Escape. */
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation()
              setOpen(false)
            }
          }}
        >
          <input
            className="input"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="mongodb, kibana, kubernetes…"
            aria-label="Search icons"
          />

          <div className="picker__results">
            {results === null || (loading && results.length === 0) ? (
              // Pulsing skeleton cells where the icons will land, staggered per column.
              Array.from({ length: 18 }, (_, i) => (
                <div
                  key={i}
                  className="picker__skel"
                  style={{ animationDelay: `${(i % 6) * 90}ms` }}
                />
              ))
            ) : (
              <>
                {results.map((icon) => (
                  <button
                    key={icon.slug}
                    type="button"
                    className="picker__cell"
                    title={icon.title}
                    onClick={() => {
                      onPick(icon.slug, icon.hex)
                      setOpen(false)
                    }}
                  >
                    <LinkIcon slug={icon.slug} color={readable(icon.hex)} title={icon.title} lazy />
                  </button>
                ))}
                {results.length === 0 && !loading && (
                  <p className="picker__none mono">No icons match</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
