import React, { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SurgicalProcedureCode {
  id: string
  code: string
  description: string
  price: number | null
  category: string
  duration?: number | null
  requirements?: any
}

interface SurgicalCodeSearchProps {
  onSelect: (code: SurgicalProcedureCode) => void
  className?: string
  patientId?: string
  currentStatus?: string
  onProcedureCreated?: (procedure?: any) => void
  organizationId: string
}

export function SurgicalCodeSearch({ 
  onSelect, 
  className, 
  patientId, 
  currentStatus = 'PENDING', 
  onProcedureCreated, 
  organizationId 
}: SurgicalCodeSearchProps) {
  const [query, setQuery] = useState('')
  const [codes, setCodes] = useState<SurgicalProcedureCode[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch codes when query changes
  useEffect(() => {
    if (!query || query.length < 1) {
      setCodes([])
      return
    }

    const fetchCodes = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/surgical-procedure-codes?search=${encodeURIComponent(query)}`)
        if (!response.ok) throw new Error('Failed to fetch codes')
        const data = await response.json()
        setCodes(data)
      } catch (error) {
        console.error('Error fetching surgical procedure codes:', error)
        toast.error('Failed to load procedure codes')
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(() => {
      fetchCodes()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [query])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (code: SurgicalProcedureCode) => {
    onSelect(code)
    setQuery('')
    setCodes([])
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search procedure codes..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          className="pl-10"
        />
      </div>

      {open && codes.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : (
            codes.map((code) => (
              <button
                key={code.id}
                type="button"
                onClick={() => handleSelect(code)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              >
                <div className="font-medium">{code.code}</div>
                <div className="text-sm text-gray-600">{code.description}</div>
                {code.price && (
                  <div className="text-xs text-gray-500">€{code.price.toFixed(2)}</div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

