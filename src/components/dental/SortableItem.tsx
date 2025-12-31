import React from 'react'
import { GripVertical, MoreVertical } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
// Removed: import { ContextMenuTrigger } from '@/components/ui/context-menu'

interface SortableItemProps {
  id: string
  label: string
  onContextMenu: (id: string) => void
}

export default function SortableItem({ id, label, onContextMenu }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging ? '#f0f0f0' : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="flex items-center justify-between gap-2 px-2 py-1 border rounded bg-white shadow-sm">
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-gray-400" {...listeners} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span>
        <Button size="icon" variant="ghost" onClick={() => onContextMenu(id)}>
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </Button>
      </span>
    </div>
  )
}
