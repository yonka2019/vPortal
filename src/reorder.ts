import type { Hub, Link } from './types'

/**
 * Drag maths for the editor, kept out of the component so it can be tested in plain Node.
 * Every function returns a new hub and leaves the old one untouched; a call that makes no
 * sense (unknown id, same slot) returns the hub it was given.
 */

/** A section with no links has no tile to aim at, so it lends its own id to a drop zone. */
const ZONE = 'zone:'

export const zoneId = (sectionId: string) => `${ZONE}${sectionId}`

const move = <T>(items: T[], from: number, to: number) => {
  const next = [...items]
  next.splice(to, 0, ...next.splice(from, 1))
  return next
}

/** Index of the section holding `linkId`, or -1. */
export const sectionOfLink = (hub: Hub, linkId: string) =>
  hub.sections.findIndex((section) => section.links.some((link) => link.id === linkId))

/** Index of the section a drop target sits in: a link's owner, or an empty section's zone. */
export const sectionOfTarget = (hub: Hub, overId: string) =>
  overId.startsWith(ZONE)
    ? hub.sections.findIndex((section) => section.id === overId.slice(ZONE.length))
    : sectionOfLink(hub, overId)

export const moveSection = (hub: Hub, activeId: string, overId: string): Hub => {
  const from = hub.sections.findIndex((section) => section.id === activeId)
  const to = hub.sections.findIndex((section) => section.id === overId)
  if (from < 0 || to < 0 || from === to) return hub
  return { ...hub, sections: move(hub.sections, from, to) }
}

/** Reorder a link inside its own section. Cross-section drops go through `handOver`. */
export const moveLink = (hub: Hub, activeId: string, overId: string): Hub => {
  const at = sectionOfLink(hub, activeId)
  if (at < 0 || at !== sectionOfTarget(hub, overId)) return hub
  const { links } = hub.sections[at]
  const from = links.findIndex((link) => link.id === activeId)
  const to = links.findIndex((link) => link.id === overId)
  if (from < 0 || to < 0 || from === to) return hub
  return {
    ...hub,
    sections: hub.sections.map((section, index) =>
      index === at ? { ...section, links: move(links, from, to) } : section,
    ),
  }
}

/**
 * Hand a link to another section, landing on the slot the drop target occupies. Runs while
 * the pointer is still down, so the gap opens where the tile is about to go.
 */
export const handOver = (hub: Hub, activeId: string, overId: string): Hub => {
  const from = sectionOfLink(hub, activeId)
  const to = sectionOfTarget(hub, overId)
  if (from < 0 || to < 0 || from === to) return hub
  const moved = hub.sections[from].links.find((link) => link.id === activeId) as Link
  const target = hub.sections[to].links
  const found = target.findIndex((link) => link.id === overId)
  const landing = found < 0 ? target.length : found
  return {
    ...hub,
    sections: hub.sections.map((section, index) => {
      if (index === from) return { ...section, links: section.links.filter((link) => link.id !== activeId) }
      if (index === to) return { ...section, links: [...target.slice(0, landing), moved, ...target.slice(landing)] }
      return section
    }),
  }
}
