type Props = { size?: number }

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

export const ArrowOut = ({ size = 14 }: Props) => (
  <svg {...base(size)}>
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
)

export const Search = ({ size = 15 }: Props) => (
  <svg {...base(size)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

export const Grip = ({ size = 15 }: Props) => (
  <svg {...base(size)} strokeWidth={2}>
    <circle cx="9" cy="6" r="1" />
    <circle cx="15" cy="6" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="9" cy="18" r="1" />
    <circle cx="15" cy="18" r="1" />
  </svg>
)

export const Plus = ({ size = 15 }: Props) => (
  <svg {...base(size)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const Trash = ({ size = 15 }: Props) => (
  <svg {...base(size)}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3" />
  </svg>
)

export const Copy = ({ size = 15 }: Props) => (
  <svg {...base(size)}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a1 1 0 0 1 1-1h9" />
  </svg>
)

export const Download = ({ size = 15 }: Props) => (
  <svg {...base(size)}>
    <path d="M12 4v11M8 11l4 4 4-4M5 20h14" />
  </svg>
)

export const Upload = ({ size = 15 }: Props) => (
  <svg {...base(size)}>
    <path d="M12 16V5M8 9l4-4 4 4M5 20h14" />
  </svg>
)

export const NewTabGlyph = ({ size = 15 }: Props) => (
  <svg {...base(size)}>
    <path d="M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
)

export const SameTabGlyph = ({ size = 15 }: Props) => (
  <svg {...base(size)}>
    <rect x="4" y="5" width="16" height="14" rx="2" />
    <path d="M9 12h6M13 9l3 3-3 3" />
  </svg>
)

export const Pencil = ({ size = 15 }: Props) => (
  <svg {...base(size)}>
    <path d="M4 20h4l10-10a2.8 2.8 0 0 0-4-4L4 16v4Z" />
    <path d="m13.5 6.5 4 4" />
  </svg>
)

/** The tile proportion the switch produces, drawn to scale. */
export const WideShape = ({ size = 18 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="2" y="7.5" width="20" height="9" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
  </svg>
)

export const LongShape = ({ size = 18 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <rect x="7.5" y="2" width="9" height="20" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
  </svg>
)

/** The add-on's own mark: the bento, same arrangement as `public/icons/tile-*.png`. */
export const Tiles = ({ size = 15 }: Props) => (
  <svg {...base(size)}>
    <rect x="3" y="3" width="7" height="18" rx="2.2" />
    <rect x="14" y="3" width="7" height="7.5" rx="2.2" />
    <rect x="14" y="13.5" width="7" height="7.5" rx="2.2" />
  </svg>
)

/** Support. A heart, not the Ko-fi wordmark: their button is a hosted image, and nothing
    on this page may load from a CDN. */
export const Heart = ({ size = 14 }: Props) => (
  <svg {...base(size)}>
    <path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9Z" />
  </svg>
)
