import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { countClick, getHub, saveHub } from '../api'
import { readable } from '../color'
import { greetings, nextIndex } from '../greeting'
import { opensInNewTab, rememberEditing, setOpensInNewTab, setShowsFrequent, showsFrequent, wasEditing } from '../prefs'
import { sanitizeHub } from '../sanitize'
import type { Hub as HubData } from '../types'
import { resetBeam, setBeam } from './Aurora'
import { CommandPalette, type Entry } from './CommandPalette'
import { LinkIcon } from './LinkIcon'
import { SideNav, sectionAnchor } from './SideNav'
import { Tile } from './Tile'
import { Download, Heart, NewTabGlyph, Pencil, SameTabGlyph, Search, Tiles, Upload } from './glyphs'

// The editor carries the drag-and-drop library; visitors never download it.
const EditLayer = lazy(() => import('./EditLayer'))

const clone = (hub: HubData): HubData => JSON.parse(JSON.stringify(hub))

/**
 * One line drawn at random from the pool for this hour and this weekday, redrawn every few
 * seconds. Random from the first paint on purpose: a new tab is usually closed within
 * seconds, so a fixed opening line meant the weekday lines were never seen.
 * `greetings()` is re-read on every turn, so a rollover past midnight is picked up.
 */
function Greeting() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * greetings().length))

  useEffect(() => {
    const timer = setInterval(() => {
      const count = greetings().length
      setIndex((current) => nextIndex(current, count))
    }, 7000)
    return () => clearInterval(timer)
  }, [])

  const lines = greetings()
  const line = lines[index % lines.length]
  return (
    <p className="greeting" key={line}>
      {line}
    </p>
  )
}

/** Plain mono clock beside the hub name. */
function Clock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const two = (n: number) => String(n).padStart(2, '0')
  return (
    <span className="clock mono" aria-label="Current time">
      {two(now.getHours())}:{two(now.getMinutes())}:{two(now.getSeconds())}
    </span>
  )
}

export function Hub({ editOnLoad = false }: { editOnLoad?: boolean }) {
  const [hub, setHub] = useState<HubData | null>(null)
  const [draft, setDraft] = useState<HubData | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [newTab, setNewTab] = useState(opensInNewTab)
  const [frequentOn, setFrequentOn] = useState(showsFrequent)

  useEffect(() => {
    getHub()
      .then(setHub)
      .catch((cause: Error) => setError(cause.message))
  }, [])

  const startEditing = useCallback(() => {
    setHub((current) => {
      if (current) setDraft(clone(current))
      return current
    })
    setEditing(true)
    rememberEditing(true)
  }, [])

  // Come back straight into edit mode if this browser was last editing. Consumed once —
  // left armed, Done would immediately re-enter edit mode, because the effect re-runs
  // on `editing`.
  const autoEditWanted = useRef(editOnLoad)
  useEffect(() => {
    if (!hub || editing) return
    if (!autoEditWanted.current && !wasEditing()) return
    autoEditWanted.current = false
    startEditing()
  }, [hub, editing, startEditing])

  useEffect(() => {
    if (hub?.title) document.title = editing ? `${hub.title} — editing` : hub.title
  }, [hub?.title, editing])

  const shown = editing ? draft : hub
  const dirty = Boolean(editing && draft && hub && JSON.stringify(draft) !== JSON.stringify(hub))

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const entries: Entry[] = useMemo(
    () =>
      (shown?.sections ?? []).flatMap((section) =>
        section.links.map((link) => ({ ...link, section: section.title })),
      ),
    [shown],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const typingHere = event.target instanceof HTMLElement && event.target.matches('input, textarea')
      const shortcut = (event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !typingHere)
      if (shortcut && entries.length) {
        event.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [entries.length])

  const frequent = useMemo(() => {
    const ranked = entries.filter((entry) => entry.clicks > 0).sort((a, b) => b.clicks - a.clicks)
    return editing || ranked.length < 3 ? [] : ranked.slice(0, 5)
  }, [entries, editing])

  const save = async () => {
    if (!draft) return
    setSaving(true)
    setError('')
    const sent = draft
    try {
      const saved = await saveHub(sent)
      setHub(saved)
      // A successful save is "done": leave edit mode like the Done button.
      stopEditing()
    } catch (cause) {
      setError((cause as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const stopEditing = () => {
    setEditing(false)
    setDraft(null)
    rememberEditing(false)
  }

  const exportHub = () => {
    if (!shown) return
    const file = new Blob([JSON.stringify(shown, null, 2)], { type: 'application/json' })
    const address = URL.createObjectURL(file)
    const anchor = document.createElement('a')
    anchor.href = address
    anchor.download = `tiletab-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(address)
  }

  const importHub = async (file: File) => {
    setError('')
    try {
      const parsed = JSON.parse(await file.text())
      if (!Array.isArray(parsed?.sections)) throw new Error('That file has no sections in it.')
      // A chosen file is untrusted input, so it goes through the same shaping as a save:
      // one section without a `links` array used to throw during render and blank the
      // page, taking the unsaved draft with it.
      setDraft(sanitizeHub(parsed, hub))
    } catch (cause) {
      setError(`Import failed. ${(cause as Error).message}`)
    }
  }

  if (error && !shown) return <p className="center-note">{error}</p>
  if (!shown) return <p className="center-note">Loading</p>

  return (
    <div className="shell">
      <header className="topbar">
        {editing && draft ? (
          <input
            className="input input--mark"
            value={draft.title}
            aria-label="Hub name"
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          />
        ) : (
          <span className="mark">
            <span className="mark__orb" />
            {shown.title}
            <Clock />
            <Greeting />
          </span>
        )}

        <nav className="topbar__nav">
          {editing ? (
            <>
              <span className="admin-bar__status">
                <span className={`dot${dirty ? ' dot--dirty' : ''}`} />
                <span className="mono">{saving ? 'Saving…' : dirty ? 'Unsaved' : 'Saved'}</span>
              </span>
              <button className="btn btn--ghost" type="button" onClick={exportHub}>
                <Download />
                <span className="topbar__label">Export</span>
              </button>
              <label className="btn btn--ghost">
                <Upload />
                <span className="topbar__label">Import</span>
                <input
                  type="file"
                  accept="application/json,.json"
                  className="visually-hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) importHub(file)
                    event.target.value = ''
                  }}
                />
              </label>
              {dirty ? (
                <button
                  className="btn btn--ghost btn--danger"
                  type="button"
                  onClick={() => hub && setDraft(clone(hub))}
                >
                  Discard
                </button>
              ) : (
                <button className="btn btn--ghost" type="button" onClick={stopEditing}>
                  Done
                </button>
              )}
              <button className="btn btn--primary" type="button" onClick={save} disabled={saving || !dirty}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </>
          ) : (
            <>
              <label className="stats__toggle" title="Show the Most opened strip">
                <span className="topbar__label mono">Most opened</span>
                <button
                  className={`switch${frequentOn ? ' switch--on' : ''}`}
                  type="button"
                  role="switch"
                  aria-checked={frequentOn}
                  aria-label="Show most opened shortcuts"
                  onClick={() => {
                    setFrequentOn(!frequentOn)
                    setShowsFrequent(!frequentOn)
                  }}
                />
              </label>
              <button
                className={`btn btn--ghost tabswitch${newTab ? ' tabswitch--on' : ''}`}
                onClick={() => {
                  setOpensInNewTab(!newTab)
                  setNewTab(!newTab)
                }}
                aria-pressed={newTab}
                title={newTab ? 'Links open in a new tab' : 'Links open in this tab'}
              >
                <span className="tabswitch__glyphs" aria-hidden="true">
                  <span className="tabswitch__glyph tabswitch__glyph--same">
                    <SameTabGlyph />
                  </span>
                  <span className="tabswitch__glyph tabswitch__glyph--new">
                    <NewTabGlyph />
                  </span>
                </span>
                <span className="topbar__label tabswitch__words">
                  <span className="tabswitch__word tabswitch__word--off">This tab</span>
                  <span className="tabswitch__word tabswitch__word--on">New tab</span>
                </span>
              </button>
              <button className="btn" onClick={() => setPaletteOpen(true)} disabled={!entries.length}>
                <Search />
                <span className="topbar__label">Search</span>
                <kbd>⌘K</kbd>
              </button>
              <button className="btn btn--ghost" type="button" onClick={startEditing}>
                <Pencil />
                <span className="topbar__label">Edit</span>
              </button>
            </>
          )}
        </nav>
      </header>

      {error && <p className="error">{error}</p>}

      {frequentOn && frequent.length > 0 && (
        <div style={{ paddingTop: 18 }}>
          <p className="mono" style={{ paddingBottom: 12 }}>
            Most opened
          </p>
          <div className="frequent">
            {frequent.map((entry) => (
              <a
                key={entry.id}
                className="chip"
                href={entry.url}
                target={newTab ? '_blank' : undefined}
                rel="noreferrer"
                style={{ '--brand': readable(entry.tintColor || entry.iconColor) } as CSSProperties}
                onMouseEnter={() => setBeam(readable(entry.tintColor || entry.iconColor))}
                onMouseLeave={resetBeam}
                onClick={() => countClick(entry.id)}
              >
                <LinkIcon slug={entry.iconSlug} color={readable(entry.iconColor)} />
                {entry.title}
                <span className="chip__count">{entry.clicks.toLocaleString()}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {editing && draft ? (
        <Suspense fallback={<p className="center-note">Loading the editor</p>}>
          <EditLayer hub={draft} onChange={setDraft} />
        </Suspense>
      ) : shown.sections.length === 0 ? (
        <div className="empty">
          <Tiles size={26} />
          <h2>No links yet</h2>
          <p>Turn on Edit to add the first section.</p>
          <button className="btn btn--primary" type="button" onClick={startEditing}>
            <Pencil />
            Edit
          </button>
        </div>
      ) : (
        <div className="withnav">
          <SideNav sections={shown.sections} />
          <div className="withnav__body">
            {shown.sections.map((section) => (
              <section className="section" key={section.id}>
                <div className="section__head" id={sectionAnchor(section.id)}>
                  <h2 className="section__title">{section.title}</h2>
                  <p className="mono">{section.links.length} links</p>
                </div>
                <div className="bento">
                  {section.links.map((link, index) => (
                    <Tile key={link.id} link={link} index={index} newTab={newTab} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      {paletteOpen && (
        <CommandPalette entries={entries} newTab={newTab} onClose={() => setPaletteOpen(false)} />
      )}

      <footer className="credit mono">
        by yonka · v{__APP_VERSION__} ·{' '}
        <a className="credit__support" href="https://ko-fi.com/yonka2019" target="_blank" rel="noreferrer noopener">
          <Heart />
          Support
        </a>
      </footer>
    </div>
  )
}
