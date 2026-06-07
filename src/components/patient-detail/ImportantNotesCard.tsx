'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Pin } from 'lucide-react'

interface NoteUser {
  firstName?: string
  lastName?: string
}

interface Note {
  id: string
  content: string
  createdAt: string
  createdBy: string
  isPinned?: boolean
  pinOrder?: number | null
  folderId?: string | null
  user?: NoteUser
}

interface NoteFolder {
  id: string
  name: string
  notes: Note[]
}

interface ImportantNotesCardProps {
  noteFolders?: NoteFolder[]
  notes?: Note[]
  onSettingsClick: () => void
  onAddNoteClick: () => void
}

function sortNotes(a: Note, b: Note): number {
  if (a.isPinned && !b.isPinned) return -1
  if (!a.isPinned && b.isPinned) return 1
  if (a.isPinned && b.isPinned) {
    if (a.pinOrder && b.pinOrder) return a.pinOrder - b.pinOrder
    if (a.pinOrder) return -1
    if (b.pinOrder) return 1
  }
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}

function NoteItem({ note }: { note: Note }) {
  const firstName = note.user?.firstName || note.createdBy.split(' ')[0]
  const lastName = note.user?.lastName || note.createdBy.split(' ')[1] || ''
  const initials = (firstName[0] + lastName[0]).toUpperCase()

  return (
    <div
      className={`p-2 rounded text-sm ${note.isPinned
        ? 'bg-blue-50 border border-blue-200'
        : 'bg-gray-50 border border-gray-200'
        }`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {note.isPinned && <Pin className="h-3 w-3 text-blue-500" />}
            <span className="font-medium">[{initials}]</span>
          </div>
          <div className="whitespace-pre-wrap mt-1">{note.content}</div>
        </div>
        <div className="text-xs text-gray-500">
          {new Date(note.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}

export default function ImportantNotesCard({
  noteFolders,
  notes,
  onSettingsClick,
  onAddNoteClick,
}: ImportantNotesCardProps) {
  return (
    <Card className="flex flex-1 flex-col min-h-0 p-3 border-2 border-blue-400 rounded-xl overflow-hidden">
      <div className="flex flex-1 flex-col min-h-0 gap-2">
        <div className="flex justify-between items-center flex-shrink-0">
          <div className="font-bold text-blue-700">Note importante</div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettingsClick}
              className="h-6 w-6 p-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onAddNoteClick}
              className="h-6"
            >
              Adaugă notă
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
          {noteFolders?.map((folder) => (
            <div key={folder.id} className="space-y-2">
              <div className="font-medium text-sm text-blue-700">{folder.name}:</div>
              {folder.notes.sort(sortNotes).map((note) => (
                <NoteItem key={note.id} note={note} />
              ))}
            </div>
          ))}
          {notes
            ?.filter((note) => !note.folderId)
            .sort(sortNotes)
            .map((note) => (
              <NoteItem key={note.id} note={note} />
            ))}
        </div>
      </div>
    </Card>
  )
}
