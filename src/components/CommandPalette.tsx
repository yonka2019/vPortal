import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { countClick } from '../api'
import { readable } from '../color'
import type { Link } from '../types'
import { resetBeam, setBeam } from './Aurora'
import { LinkIcon } from './LinkIcon'

export type Entry = Link & { section: string }

export function CommandPalette({
  entries,
  newTab,
  onClose,
}: {
  entries: Entry[]
  newTab: boolean
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const sheetRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const restoreTo = useRef<Element | null>(document.activeElement)

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return entries.slice(0, 40)
    return entries
      .filter((entry) =>
        `${entry.title} ${entry.desc} ${entry.section} ${entry.url}`.toLowerCase().includes(needle),
      )
      .slice(0, 40)
  }, [entries, query])

  useEffect(() => setActive(0), [query])

  useEffect(() => {
    // Explicit, not autoFocus: the palette mounts from inside a keydown handler and the
    // key that opened it leaves focus on whatever was already focused.
    inputRef.current?.focus()
    const previous = restoreTo.current
    return () => {
      resetBeam()
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [])

  const open = (entry: Entry) => {
    countClick(entry.id)
    window.open(entry.url, newTab ? '_blank' : '_self', 'noopener')
    onClose()
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') return onClose()
    if (event.key === 'Tab') return event.preventDefault() // nothing else in here to reach
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!matches.length) return
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((current) => (current + step + matches.length) % matches.length)
    }
    if (event.key === 'Enter' && matches[active]) {
      event.preventDefault()
      open(matches[active])
    }
  }

  useEffect(() => {
    const entry = matches[active]
    if (entry) setBeam(readable(entry.tintColor || entry.iconColor))
  }, [matches, active])

  return (
    <div
      className="palette"
      onMouseDown={(event) => {
        if (!sheetRef.current?.contains(event.target as Node)) onClose()
      }}
    >
      <div
        ref={sheetRef}
        className="palette__sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Search links"
        onKeyDown={onKeyDown}
      >
        <input
          className="palette__input"
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search links…"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-activedescendant={matches[active] ? `palette-option-${matches[active].id}` : undefined}
        />

        {matches.length === 0 ? (
          <p className="palette__empty">Nothing matches “{query}”.</p>
        ) : (
          <ul className="palette__list" id="palette-list" role="listbox" aria-label="Links">
            {matches.map((entry, index) => (
              <li
                key={entry.id}
                id={`palette-option-${entry.id}`}
                className="palette__item"
                role="option"
                aria-selected={index === active}
                style={{ '--brand': readable(entry.tintColor || entry.iconColor) } as CSSProperties}
                onMouseMove={() => setActive(index)}
                onClick={() => open(entry)}
              >
                <LinkIcon slug={entry.iconSlug} color={readable(entry.iconColor)} />
                <span className="palette__name">{entry.title}</span>
                <span className="mono">{entry.section}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="palette__foot">
          <span className="mono">
            <kbd>↑</kbd> <kbd>↓</kbd> move
          </span>
          <span className="mono">
            <kbd>↵</kbd> open
          </span>
          <span className="mono">
            <kbd>esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  )
}
