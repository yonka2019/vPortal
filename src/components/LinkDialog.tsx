import { useEffect, useRef, useState } from 'react'
import { CUSTOM_MAX, safeIcon } from '../sanitize'
import type { Link, TileSize } from '../types'
import { IconPicker } from './IconPicker'
import { LongShape, Trash, Upload, WideShape } from './glyphs'

const sizeOf = (wide: boolean, long: boolean): TileSize => (wide && long ? 'l' : wide ? 'w' : long ? 't' : 's')

const UPLOADABLE = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp']

/** An uploaded logo is stored as a data URI in `iconSlug`, so Export carries it too. */
const readLogo = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('unreadable'))
    reader.readAsDataURL(file)
  })

export function LinkDialog({
  link,
  onChange,
  onRemove,
  onClose,
}: {
  link: Link
  onChange: (link: Link) => void
  onRemove: () => void
  onClose: () => void
}) {
  const [problem, setProblem] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)
  const restoreTo = useRef<Element | null>(document.activeElement)
  const closeRef = useRef(onClose)
  const size = link.size ?? 's'
  const custom = link.iconSlug.startsWith('data:')
  const wide = size === 'w' || size === 'l'
  const long = size === 't' || size === 'l'

  useEffect(() => {
    closeRef.current = onClose
  })

  // Mount and unmount only. Keying this on `onClose` re-ran it on every keystroke —
  // the caller passes a fresh arrow each render — which snapped focus back to Name and
  // made Address and Description impossible to type in.
  useEffect(() => {
    nameRef.current?.focus()
    const previous = restoreTo.current
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && closeRef.current()
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [])

  const pickLogo = async (file: File) => {
    setProblem('')
    if (!UPLOADABLE.includes(file.type)) return setProblem('SVG, PNG, JPEG or WebP only.')
    if (file.size > CUSTOM_MAX) return setProblem('Too big — 128KB max.')
    try {
      const data = await readLogo(file)
      // Same check the saved document gets: an uploaded file is untrusted input, and it
      // is only ever painted through <img src="data:…">, where scripts inside an SVG
      // cannot run.
      if (!safeIcon(data)) throw new Error('that file did not read as an image')
      onChange({ ...link, iconSlug: data })
    } catch (cause) {
      setProblem(`Upload failed. ${(cause as Error).message}`)
    }
  }

  return (
    <div className="palette" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={`Edit ${link.title || 'link'}`}>
        <div className="sheet__head">
          <IconPicker
            slug={link.iconSlug}
            color={link.iconColor}
            onPick={(slug, hex) => onChange({ ...link, iconSlug: slug, iconColor: hex })}
          />
          <div>
            <p className="mono">Editing link</p>
            <p className="sheet__title">{link.title || 'Untitled link'}</p>
          </div>
          <label className="btn btn--ghost sheet__upload">
            <Upload />
            <span>{custom ? 'Replace logo' : 'Upload logo'}</span>
            <input
              type="file"
              accept=".svg,.png,.jpg,.jpeg,.webp"
              className="visually-hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) pickLogo(file)
                event.target.value = ''
              }}
            />
          </label>
        </div>

        {problem && <p className="error">{problem}</p>}

        <div className="sheet__body">
          <label className="field">
            <span className="mono">Name</span>
            <input
              className="input"
              ref={nameRef}
              value={link.title}
              placeholder="Elasticsearch"
              onChange={(event) => onChange({ ...link, title: event.target.value })}
            />
          </label>

          <label className="field">
            <span className="mono">Address</span>
            <input
              className="input"
              value={link.url}
              inputMode="url"
              placeholder="https://…"
              onChange={(event) => onChange({ ...link, url: event.target.value })}
            />
          </label>

          <label className="field">
            <span className="mono">Description</span>
            <input
              className="input"
              value={link.desc}
              placeholder="Cluster API and health"
              onChange={(event) => onChange({ ...link, desc: event.target.value })}
            />
          </label>

          <div className="field">
            <span className="mono">Tint colour</span>
            <div className="tintrow">
              <input
                type="color"
                className="tint__well"
                value={link.tintColor || link.iconColor}
                aria-label="Tile tint colour"
                onChange={(event) => onChange({ ...link, tintColor: event.target.value })}
              />
              {link.tintColor ? (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => onChange({ ...link, tintColor: undefined })}
                >
                  Use icon colour
                </button>
              ) : (
                <span className="mono">From the icon</span>
              )}
            </div>
          </div>

          <div className="field">
            <span className="mono">Tile size</span>
            <div className="sizes" role="group" aria-label="Tile size">
              <button
                type="button"
                className={`sizes__btn${wide ? ' sizes__btn--on' : ''}`}
                aria-pressed={wide}
                title="Wide — takes two columns"
                onClick={() => onChange({ ...link, size: sizeOf(!wide, long) })}
              >
                <WideShape size={16} />
                <span className="visually-hidden">Wide</span>
              </button>
              <button
                type="button"
                className={`sizes__btn${long ? ' sizes__btn--on' : ''}`}
                aria-pressed={long}
                title="Long — takes two rows"
                onClick={() => onChange({ ...link, size: sizeOf(wide, !long) })}
              >
                <LongShape size={16} />
                <span className="visually-hidden">Long</span>
              </button>
            </div>
          </div>
        </div>

        <div className="sheet__foot">
          <button className="btn btn--ghost btn--danger" type="button" onClick={onRemove}>
            <Trash />
            Delete link
          </button>
          <button className="btn btn--primary" type="button" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
