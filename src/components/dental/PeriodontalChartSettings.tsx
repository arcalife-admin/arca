import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { DndContext, closestCenter } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export const defaultSettings = {
  keybinds: {
    bleeding: 'b',
    suppuration: 'n',
    extended: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  },
  order: [
    { field: 'recession', quadrant: 'Q1', side: 'buccal', direction: 'd->m' },
    { field: 'pocketDepth', quadrant: 'Q1', side: 'buccal', direction: 'd->m' },
    { field: 'recession', quadrant: 'Q2', side: 'lingual', direction: 'd->m' },
    { field: 'pocketDepth', quadrant: 'Q2', side: 'lingual', direction: 'd->m' },
    { field: 'recession', quadrant: 'Q3', side: 'lingual', direction: 'd->m' },
    { field: 'pocketDepth', quadrant: 'Q3', side: 'lingual', direction: 'd->m' },
    { field: 'recession', quadrant: 'Q4', side: 'buccal', direction: 'd->m' },
    { field: 'pocketDepth', quadrant: 'Q4', side: 'buccal', direction: 'd->m' },
  ],
}

function SortableItem({ item, id, onToggleDirection }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div ref={setNodeRef} {...attributes} {...listeners} style={style} className="border p-2 rounded bg-white shadow mb-1">
          {`${item.field} ${item.quadrant}${item.side[0].toUpperCase()} ${item.direction}`}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onToggleDirection(id)}>
          Toggle Direction (d&lt;-&gt;m)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function PeriodontalChartSettings({
  settings = defaultSettings,
  onSettingsChange = () => { }
}: {
  settings?: any;
  onSettingsChange?: (settings: any) => void
} = {}) {
  const [localSettings, setLocalSettings] = useState(settings)

  const handleKeyChange = (field: string, value: string) => {
    const newSettings = {
      ...localSettings,
      keybinds: {
        ...localSettings.keybinds,
        [field]: value,
      },
    }
    setLocalSettings(newSettings)
    onSettingsChange(newSettings)
  }

  const handleExtendedChange = (index: number, value: string) => {
    const newSettings = {
      ...localSettings,
      keybinds: {
        ...localSettings.keybinds,
        extended: localSettings.keybinds.extended.map((k: string, i: number) => i === index ? value : k),
      },
    }
    setLocalSettings(newSettings)
    onSettingsChange(newSettings)
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (active.id !== over.id) {
      const newSettings = {
        ...localSettings,
        order: arrayMove(localSettings.order, active.id, over.id),
      }
      setLocalSettings(newSettings)
      onSettingsChange(newSettings)
    }
  }

  const toggleDirection = (id: any) => {
    const newSettings = {
      ...localSettings,
      order: localSettings.order.map((step: any, i: number) => {
        if (i === id) {
          return {
            ...step,
            direction: step.direction === 'd->m' ? 'm->d' : 'd->m'
          }
        }
        return step
      })
    }
    setLocalSettings(newSettings)
    onSettingsChange(newSettings)
  }

  return (
    <Card className="p-4">
      <div className="flex gap-8 relative">
        <div className="w-1/2">
          <h2 className="font-bold mb-4">Keybinds</h2>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label>Bleeding</label>
              <Input value={localSettings.keybinds.bleeding} onChange={e => handleKeyChange('bleeding', e.target.value)} />
            </div>
            <div>
              <label>Suppuration</label>
              <Input value={localSettings.keybinds.suppuration} onChange={e => handleKeyChange('suppuration', e.target.value)} />
            </div>
            {localSettings.keybinds.extended.map((key: string, i: number) => (
              <div key={i}>
                <label>Key for {10 + i}</label>
                <Input value={key} onChange={e => handleExtendedChange(i, e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        <div className="w-px bg-gray-200 absolute top-0 bottom-0 left-1/2 -translate-x-1/2" />

        <div className="w-1/2">
          <h2 className="font-bold mb-4">Input Order</h2>
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={localSettings.order.map((_, i) => i)} strategy={verticalListSortingStrategy}>
              {localSettings.order.map((item, index) => (
                <SortableItem key={index} id={index} item={item} onToggleDirection={toggleDirection} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <Button onClick={() => onSettingsChange(localSettings)}>Save Settings</Button>
      </div>
    </Card>
  )
}
