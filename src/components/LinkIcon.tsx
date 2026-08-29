import type { CSSProperties } from 'react'
import { iconHref, isColourLogo } from '../icons'

/**
 * A link's mark. One-colour icons are a CSS mask over a tinted box: there is no server to
 * recolour an SVG offline, and a mask needs no extra file per colour. Colour logos and
 * uploaded files stay real images — masking would flatten them to one tone.
 *
 * The wrapper carries the size class and any drop-shadow. `filter` is applied before
 * `mask`, so a shadow set on the masked element itself would trace its whole square.
 */
export function LinkIcon({
  slug,
  color,
  className = '',
  title = '',
  lazy = false,
}: {
  slug: string
  color: string
  className?: string
  title?: string
  lazy?: boolean
}) {
  const href = iconHref(slug)
  const wrapper = `licon${className ? ` ${className}` : ''}`
  if (!href) return <span className={wrapper} />

  return (
    <span className={wrapper}>
      {isColourLogo(slug) ? (
        <img src={href} alt={title} loading={lazy ? 'lazy' : undefined} />
      ) : (
        <span
          className="licon__mask"
          role={title ? 'img' : undefined}
          aria-label={title || undefined}
          style={{ '--icon': `url("${href}")`, '--icon-color': color } as CSSProperties}
        />
      )}
    </span>
  )
}
