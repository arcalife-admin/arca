'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

export type ScanDraftFile = {
  id: string
  file: File
  previewUrl: string
}

type Props = {
  scans: ScanDraftFile[]
  onScansChange: (scans: ScanDraftFile[]) => void
}

export default function ScanPreviewPanel({ scans, onScansChange }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    return () => {
      scans.forEach((s) => URL.revokeObjectURL(s.previewUrl))
    }
  }, [scans])

  const addFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return
    const added: ScanDraftFile[] = Array.from(fileList).map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    onScansChange([...scans, ...added])
  }

  const removeAt = (index: number) => {
    const removed = scans[index]
    if (removed) URL.revokeObjectURL(removed.previewUrl)
    const next = scans.filter((_, i) => i !== index)
    onScansChange(next)
    if (activeIndex >= next.length) setActiveIndex(Math.max(0, next.length - 1))
  }

  const active = scans[activeIndex]

  return (
    <div className="flex flex-col h-full border rounded-lg bg-gray-50">
      <div className="p-3 border-b bg-white rounded-t-lg">
        <h3 className="font-medium text-sm">Formulare scanate (opțional)</h3>
        <p className="text-xs text-gray-500 mt-1">
          Încărcați scanări din folderul scannerului pentru previzualizare în timpul introducerii datelor. Puteți folosi și formularele pe hârtie la îndemână.
        </p>
        <label className="mt-3 inline-flex cursor-pointer">
          <input
            type="file"
            accept=".pdf,image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files)
              e.target.value = ''
            }}
          />
          <Button type="button" variant="outline" size="sm" className="gap-2 pointer-events-none" tabIndex={-1}>
            <Upload className="h-4 w-4" />
            Adaugă scanări
          </Button>
        </label>
      </div>

      <div className="flex-1 min-h-[320px] p-3 overflow-auto">
        {active ? (
          active.file.type === 'application/pdf' ? (
            <iframe src={active.previewUrl} title={active.file.name} className="w-full h-[480px] rounded border bg-white" />
          ) : (
            <img src={active.previewUrl} alt={active.file.name} className="max-w-full h-auto rounded border bg-white" />
          )
        ) : (
          <p className="text-sm text-gray-500 text-center py-12">Nu au fost încărcate scanări</p>
        )}
      </div>

      {scans.length > 0 && (
        <div className="p-2 border-t bg-white flex flex-wrap gap-1 max-h-28 overflow-y-auto">
          {scans.map((scan, i) => (
            <button
              key={scan.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`text-xs px-2 py-1 rounded border truncate max-w-[140px] ${
                i === activeIndex ? 'bg-blue-100 border-blue-300' : 'bg-white'
              }`}
            >
              {scan.file.name}
            </button>
          ))}
          {scans.length > 0 && (
            <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => removeAt(activeIndex)}>
              Elimină
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
