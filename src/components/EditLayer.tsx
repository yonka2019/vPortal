import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type KeyboardCoordinateGetter,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import type { Hub, Link, Section } from '../types'
import { uid } from '../uid'
import { LinkDialog } from './LinkDialog'
import { EditableTile } from './Tile'
import { Copy, Grip, Pencil, Plus, Trash } from './glyphs'

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
  index,
  onOpen,
  onDuplicate,
  onRemove,
}: {
  link: Link
  index: number
  onOpen: () => void
  onDuplicate: () => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id })

  return (
    <EditableTile
      link={link}
      index={index}
      innerRef={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : undefined,
        zIndex: isDragging ? 5 : undefined,
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })

  return (
    <section
      className="section section--editing"
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.55 : undefined }}
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
          {section.links.map((link, index) => (
            <SortableTile
              key={link.id}
              link={link}
              index={index}
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
  const open = hub.sections.flatMap((section) => section.links).find((link) => link.id === openId) ?? null

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

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return

    if (isSection(String(active.id))) {
      const to = sectionIds.indexOf(String(over.id))
      if (to === -1) return
      onChange({ ...hub, sections: arrayMove(hub.sections, sectionIds.indexOf(String(active.id)), to) })
      return
    }

    // ponytail: links move inside their own section only. Cross-section drops need a
    // second collision pass — add it when someone actually asks to move links between groups.
    const owner = hub.sections.find((section) => section.links.some((link) => link.id === active.id))
    if (!owner) return
    const to = owner.links.findIndex((link) => link.id === over.id)
    if (to === -1) return
    const from = owner.links.findIndex((link) => link.id === active.id)
    onChange({
      ...hub,
      sections: hub.sections.map((section) =>
        section.id === owner.id ? { ...section, links: arrayMove(section.links, from, to) } : section,
      ),
    })
  }

  return (
    <DndContext sensors={sensors} collisionDetection={collideWithinKind} onDragEnd={onDragEnd}>
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
        Links without an address are dropped when you save.
      </p>

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
