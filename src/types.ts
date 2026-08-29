/** 1×1, 2×1 wide, 1×2 tall, 2×2 large. */
export type TileSize = 's' | 'w' | 't' | 'l'

export const SPANS: Record<TileSize, { columns: number; rows: number }> = {
  s: { columns: 1, rows: 1 },
  w: { columns: 2, rows: 1 },
  t: { columns: 1, rows: 2 },
  l: { columns: 2, rows: 2 },
}

export type Link = {
  id: string
  title: string
  url: string
  desc: string
  iconSlug: string
  iconColor: string
  size: TileSize
  newTab: boolean
  clicks: number
  /** Overrides the tile's tint (the brand glow) — when absent the icon's colour is used. */
  tintColor?: string
}

export type Section = {
  id: string
  title: string
  links: Link[]
}

export type Hub = {
  title: string
  subtitle: string
  sections: Section[]
}

export type IconChoice = {
  slug: string
  title: string
  hex: string
}
