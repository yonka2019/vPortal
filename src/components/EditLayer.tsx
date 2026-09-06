import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { handOver, moveLink, moveSection, sectionOfLink, sectionOfTarget, zoneId } from '../reorder'
import type { Hub, Link, Section } from '../types'
import { uid } from '../uid'
import { LinkDialog } from './LinkDialog'
import { EditableTile } from './Tile'
import { Copy, Grip, Pencil, Plus, Trash } from './glyphs'

/**
 * dnd-kit animates in JavaScript, so the stylesheet's `prefers-reduced-motion` block never
 * reaches it — it has to be asked here.
 *
 * As things stand this changes nothing, and that is worth writing down: with
 * `MeasuringStrategy.Always` below, dnd-kit hands every displaced tile its own 0ms
 * transition on every frame, so nothing slides for anybody. Measured on the pointer and
 * the keyboard path, in both media states: the inline transition is `transform linear`
 * either way, never the 200ms default.
 *
 * It stays because it is two lines and it is the guard that has to exist the moment
 * `MeasuringStrategy.Always` goes — dnd-kit's 200ms transition comes back with it, and
 * a reduced-motion visitor would then have tiles sliding under them again.
 */
const calmMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

const newLink = (): Link => ({
  id: uid(),
  title: '',
  url: '',
  desc: '',
  iconSlug: 'lucide:link',
  iconColor: '#9aa8c4',
  size: 's',
  newTab: true,
  clicks: 0,
})

const newSection = (): Section => ({ id: uid(), title: 'New section', links: [newLink()] })

const copyOfLink = (link: Link): Link => ({ ...link, id: uid(), title: `${link.title} copy`, clicks: 0 })

const copyOfSection = (section: Section): Section => ({
  id: uid(),
  title: `${section.title} copy`,
  links: section.links.map((link) => ({ ...link, id: uid(), clicks: 0 })),
})

const insertAfter = <T extends { id: string }>(items: T[], id: string, made: T) => {
  const next = [...items]
  next.splice(items.findIndex((item) => item.id === id) + 1, 0, made)
  return next
}

function SortableTile({
  link,
  onOpen,
  onDuplicate,
  onRemove,
}: {
  link: Link
  onOpen: () => void
  onDuplicate: () => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: link.id,
    transition: calmMotion() ? null : undefined,
  })

  return (
    <EditableTile
      link={link}
      innerRef={setNodeRef}
      style={{
        // `Translate`, not `Transform`: the sorting strategy also hands back scaleX/scaleY
        // when neighbours are different sizes, and this grid mixes four tile sizes — the
        // tiles sliding aside stretched instead of moving.
        transform: CSS.Translate.toString(transform),
        // `.tile` animates transform over 340ms with an overshoot curve, which made the
        // dragged tile swim after the pointer. dnd-kit's own transition is the only one
        // that may drive a drag.
        transition: isDragging ? 'none' : transition,
        opacity: isDragging ? 0.25 : undefined,
      }}
      tools={
        <>
          <button className="drag" type="button" aria-label={`Move ${link.title || 'link'}`} {...attributes} {...listeners}>
            <Grip />
          </button>
          <button className="btn btn--icon btn--ghost" type="button" onClick={onOpen} title="Edit this link">
            <Pencil size={14} />
            <span className="visually-hidden">Edit {link.title || 'link'}</span>
          </button>
          <button className="btn btn--icon btn--ghost" type="button" onClick={onDuplicate} title="Duplicate">
            <Copy size={14} />
            <span className="visually-hidden">Duplicate {link.title || 'link'}</span>
          </button>
          <button className="btn btn--icon btn--ghost btn--danger" type="button" onClick={onRemove} title="Delete">
            <Trash size={14} />
            <span className="visually-hidden">Delete {link.title || 'link'}</span>
          </button>
        </>
      }
    />
  )
}

/** A section whose links all left still needs somewhere to aim at. */
function DropZone({ sectionId }: { sectionId: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: zoneId(sectionId) })
  return (
    <div ref={setNodeRef} className={isOver ? 'dropzone dropzone--over' : 'dropzone'}>
      Drop a link here
    </div>
  )
}

function EditSection({
  section,
  onChange,
  onOpenLink,
  onDuplicate,
  onRemove,
}: {
  section: Section
  onChange: (section: Section) => void
  onOpenLink: (id: string) => void
  onDuplicate: () => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    transition: calmMotion() ? null : undefined,
  })

  return (
    <section
      className="section section--editing"
      ref={setNodeRef}
      style={{
        // Translate-only here too, for the same reason as the tiles.
        transform: CSS.Translate.toString(transform),
        transition: isDragging ? 'none' : transition,
        opacity: isDragging ? 0.55 : undefined,
      }}
    >
      <div className="section__head">
        <div className="section__title-row">
          <button className="drag" type="button" aria-label={`Move ${section.title}`} {...attributes} {...listeners}>
            <Grip />
          </button>
          <input
            className="input input--section"
            value={section.title}
            aria-label="Section name"
            onChange={(event) => onChange({ ...section, title: event.target.value })}
          />
        </div>
        <div className="row-actions">
          <button className="btn btn--icon btn--ghost" type="button" onClick={onDuplicate} title="Duplicate section">
            <Copy />
            <span className="visually-hidden">Duplicate section {section.title}</span>
          </button>
          <button className="btn btn--icon btn--ghost btn--danger" type="button" onClick={onRemove} title="Delete section">
            <Trash />
            <span className="visually-hidden">Delete section {section.title}</span>
          </button>
        </div>
      </div>

      <SortableContext items={section.links.map((link) => link.id)} strategy={rectSortingStrategy}>
        <div className="bento bento--editing">
          {section.links.length === 0 && <DropZone sectionId={section.id} />}
          {section.links.map((link) => (
            <SortableTile
              key={link.id}
              link={link}
              onOpen={() => onOpenLink(link.id)}
              onDuplicate={() => onChange({ ...section, links: insertAfter(section.links, link.id, copyOfLink(link)) })}
              onRemove={() => onChange({ ...section, links: section.links.filter((item) => item.id !== link.id) })}
            />
          ))}
        </div>
      </SortableContext>

      <button
        className="btn add-link"
        type="button"
        onClick={() => {
          const made = newLink()
          onChange({ ...section, links: [...section.links, made] })
          onOpenLink(made.id)
        }}
      >
        <Plus />
        Add link
      </button>
    </section>
  )
}

export default function EditLayer({ hub, onChange }: { hub: Hub; onChange: (hub: Hub) => void }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const links = hub.sections.flatMap((section) => section.links)
  const open = links.find((link) => link.id === openId) ?? null
  const dragged = links.find((link) => link.id === dragId) ?? null

  const replaceLink = (next: Link) =>
    onChange({
      ...hub,
      sections: hub.sections.map((section) => ({
        ...section,
        links: section.links.map((link) => (link.id === next.id ? next : link)),
      })),
    })

  const removeLink = (id: string) =>
    onChange({
      ...hub,
      sections: hub.sections.map((section) => ({
        ...section,
        links: section.links.filter((link) => link.id !== id),
      })),
    })

  const sectionIds = hub.sections.map((section) => section.id)
  const isSection = (id: string) => sectionIds.includes(id)

  /**
   * One DndContext keeps a single flat registry of droppables, so a dragged section was
   * being matched against link tiles and the drop silently discarded. Only ever compare a
   * section with sections, and a link with links.
   */
  const collideWithinKind: CollisionDetection = (args) =>
    closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter(
        (container) => isSection(String(container.id)) === isSection(String(args.active.id)),
      ),
    })

  /**
   * The keyboard sensor needs the same filter: sortableKeyboardCoordinates scans every
   * enabled droppable, so pressing Down on a section landed on a link tile inside it and
   * the drop resolved back onto the section itself — a keyboard reorder that did nothing.
   */
  const keyboardCoordinates: KeyboardCoordinateGetter = (event, args) => {
    const activeId = String(args.context.active?.id ?? '')
    const containers = args.context.droppableContainers
    return sortableKeyboardCoordinates(event, {
      ...args,
      context: {
        ...args.context,
        droppableContainers: {
          getEnabled: () =>
            containers.getEnabled().filter((container) => isSection(String(container.id)) === isSection(activeId)),
          get: (id: string) => containers.get(id),
        } as unknown as typeof containers,
      },
    })
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: keyboardCoordinates }),
  )

  /**
   * A link changes section while the pointer is still down, so the gap opens where the
   * tile is going rather than after the drop. Reordering inside one section needs no state
   * change — the sorting strategy already previews it — so only the crossing is handled here.
   */
  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || isSection(String(active.id))) return
    const from = sectionOfLink(hub, String(active.id))
    const to = sectionOfTarget(hub, String(over.id))
    if (from === -1 || to === -1 || from === to) return
    onChange(handOver(hub, String(active.id), String(over.id)))
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragId(null)
    if (!over || active.id === over.id) return
    const [activeId, overId] = [String(active.id), String(over.id)]
    onChange(isSection(activeId) ? moveSection(hub, activeId, overId) : moveLink(hub, activeId, overId))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collideWithinKind}
      /*
       * Handing a link to another section rewrites the grids mid-drag. With the default
       * strategy the droppable rects are measured once and go stale, so the release
       * resolved against the old layout and the tile landed in the wrong slot.
       */
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={({ active }: DragStartEvent) => setDragId(String(active.id))}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragId(null)}
    >
      <SortableContext items={hub.sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
        {hub.sections.map((section) => (
          <EditSection
            key={section.id}
            section={section}
            onOpenLink={setOpenId}
            onChange={(next) =>
              onChange({ ...hub, sections: hub.sections.map((item) => (item.id === next.id ? next : item)) })
            }
            onDuplicate={() => onChange({ ...hub, sections: insertAfter(hub.sections, section.id, copyOfSection(section)) })}
            onRemove={() => onChange({ ...hub, sections: hub.sections.filter((item) => item.id !== section.id) })}
          />
        ))}
      </SortableContext>

      <button className="btn add-section" type="button" onClick={() => onChange({ ...hub, sections: [...hub.sections, newSection()] })}>
        <Plus />
        Add section
      </button>

      <p className="mono" style={{ paddingTop: 16 }}>
        Links without an address are dropped when you save. Drag a link into any section.
      </p>

      {/*
        The tile that follows the pointer is rendered here, above the page, so it can travel
        between sections without being stacked under a neighbouring section. Sections have no
        overlay: without one dnd-kit slides the section itself, which is what a full-width row
        should do.

        No drop animation: it fights `MeasuringStrategy.Always` and left the overlay floating
        for over a second after the release. The tile is already in its slot by then, so
        dropping the overlay on the spot is both correct and what it looks like.
      */}
      <DragOverlay dropAnimation={null}>
        {dragged && <EditableTile link={dragged} overlay />}
      </DragOverlay>

      {open && (
        <LinkDialog
          link={open}
          onChange={replaceLink}
          onRemove={() => {
            removeLink(open.id)
            setOpenId(null)
          }}
          onClose={() => setOpenId(null)}
        />
      )}
    </DndContext>
  )
}
