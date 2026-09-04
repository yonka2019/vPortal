import type { CSSProperties, ReactNode } from 'react'
import { countClick } from '../api'
import { readable } from '../color'
import { SPANS, type Link } from '../types'
import { resetBeam, setBeam } from './Aurora'
import { ArrowOut } from './glyphs'
import { LinkIcon } from './LinkIcon'

const tileStyle = (link: Link, brand: string) => {
  const span = SPANS[link.size] ?? SPANS.s
  return {
    '--brand': brand,
    gridColumn: `span ${span.columns}`,
    gridRow: `span ${span.rows}`,
  } as CSSProperties
}

/** The tile's tint: a custom colour when set, the icon's otherwise. Drives --brand and the beam. */
const tintOf = (link: Link) => readable(link.tintColor || link.iconColor)

/** What visitors see: the whole tile is the link. */
export function Tile({ link, newTab }: { link: Link; newTab: boolean }) {
  const brand = tintOf(link)
  return (
    <a
      className={`tile tile--${link.size ?? 's'}`}
      href={link.url}
      target={newTab ? '_blank' : undefined}
      rel="noreferrer"
      style={tileStyle(link, brand)}
      onMouseEnter={() => setBeam(brand)}
      onMouseLeave={resetBeam}
      onFocus={() => setBeam(brand)}
      onBlur={resetBeam}
      onClick={() => countClick(link.id)}
    >
      <LinkIcon className="tile__icon" slug={link.iconSlug} color={readable(link.iconColor)} lazy />
      <span className="tile__body">
        <span className="tile__name">{link.title}</span>
        {link.desc && <span className="tile__sub">{link.desc}</span>}
      </span>
      <span className="tile__out">
        <ArrowOut />
      </span>
    </a>
  )
}

/**
 * The same box in edit mode — same class names, same grid span, so what you edit sits
 * exactly where it will sit once you save.
 */
export function EditableTile({
  link,
  tools,
  innerRef,
  style,
  overlay,
}: {
  link: Link
  tools?: ReactNode
  innerRef?: (node: HTMLElement | null) => void
  style?: CSSProperties
  overlay?: boolean
}) {
  const brand = tintOf(link)
  return (
    <div
      ref={innerRef}
      className={`tile tile--${link.size ?? 's'} tile--editing${overlay ? ' tile--overlay' : ''}`}
      style={{ ...tileStyle(link, brand), ...style }}
    >
      <LinkIcon className="tile__icon" slug={link.iconSlug} color={readable(link.iconColor)} lazy />
      <span className="tile__body">
        <span className={link.title ? 'tile__name' : 'tile__name tile__name--empty'}>
          {link.title || 'Untitled link'}
        </span>
        {link.desc && <span className="tile__sub">{link.desc}</span>}
        {!link.url && <span className="tile__warn mono">No address yet</span>}
      </span>
      {tools && <div className="tile__tools">{tools}</div>}
    </div>
  )
}
