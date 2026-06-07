import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ProcedurePriceDisplay } from '@/components/ProcedurePriceDisplay'

interface SurgicalProcedureCode {
  id: string
  code: string
  description: string
  price: number | null
  currency?: string
  category: string
  duration?: number | null
  requirements?: any
}

interface SurgicalCodeSearchProps {
  onSelect: (code: SurgicalProcedureCode) => void
  className?: string
}

export function SurgicalCodeSearch({ onSelect, className }: SurgicalCodeSearchProps) {
  const [query, setQuery] = useState('')
  const [allCodes, setAllCodes] = useState<SurgicalProcedureCode[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchAllCodes = async () => {
    if (fetched) return
    setLoading(true)
    try {
      const response = await fetch('/api/surgical-procedure-codes')
      if (!response.ok) throw new Error('Încărcarea codurilor a eșuat')
      const data = await response.json()
      setAllCodes(data)
      setFetched(true)
    } catch (error) {
      console.error('Error fetching surgical procedure codes:', error)
      toast.error('Încărcarea codurilor de procedură a eșuat')
    } finally {
      setLoading(false)
    }
  }

  const filteredCodes = useMemo(() => {
    if (!query.trim()) return allCodes
    const q = query.toLowerCase()
    return allCodes.filter(
      (code) =>
        code.code.toLowerCase().includes(q) ||
        code.description.toLowerCase().includes(q)
    )
  }, [allCodes, query])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleFocus = () => {
    setOpen(true)
    fetchAllCodes()
  }

  const handleSelect = (code: SurgicalProcedureCode) => {
    onSelect(code)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Căutați coduri de procedură..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            if (!fetched) fetchAllCodes()
          }}
          onFocus={handleFocus}
          className="pl-10"
        />
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Se încarcă...</div>
          ) : filteredCodes.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {allCodes.length === 0 ? 'Niciun cod de procedură găsit' : 'Nicio procedură corespunzătoare'}
            </div>
          ) : (
            filteredCodes.map((code) => (
              <button
                key={code.id}
                type="button"
                onClick={() => handleSelect(code)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              >
                <div className="font-medium">{code.code}</div>
                <div className="text-sm text-gray-600">{code.description}</div>
                {code.price != null && (
                  <ProcedurePriceDisplay
                    amount={code.price}
                    currency={code.currency ?? 'EUR'}
                    className="text-xs text-gray-500"
                  />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
