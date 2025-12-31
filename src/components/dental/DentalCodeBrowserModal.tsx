import React, { useEffect, useState } from 'react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

interface DentalCode {
  id: string
  code: string
  description: string
  points: number | null
  rate: number | null
  category: string
  section: string
  subSection: string
}

interface DentalCodeBrowserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialFilter?: string // e.g. "M"
  onSelect: (code: DentalCode) => void
}

export default function DentalCodeBrowserModal({
  open,
  onOpenChange,
  initialFilter = '',
  onSelect,
}: DentalCodeBrowserModalProps) {
  const [searchValue, setSearchValue] = useState('')
  const [codes, setCodes] = useState<DentalCode[]>([])
  const [letterFilter, setLetterFilter] = useState(initialFilter.toUpperCase())
  const [hasAppliedInitial, setHasAppliedInitial] = useState(false)

  const fetchCodes = async (query: string, letter: string) => {
    try {
      let url = '/api/dental-codes'
      const params = new URLSearchParams()
      if (query) {
        params.set('search', query)
      } else if (letter) {
        params.set('search', letter)
      }
      if ([...params].length) url += `?${params.toString()}`

      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch codes')
      let data = await res.json()
      if (letter) {
        const letterUpper = letter.toUpperCase()
        data = data.filter((c: DentalCode) => c.code.toUpperCase().startsWith(letterUpper))
      }
      setCodes(data)
    } catch (err) {
      console.error(err)
      setCodes([])
    }
  }

  // Load codes whenever modal opens or relevant filters change.
  useEffect(() => {
    if (!open) return

    // Apply the initial filter only once per open cycle.
    if (!hasAppliedInitial && initialFilter) {
      setHasAppliedInitial(true)
      setLetterFilter(initialFilter.toUpperCase())
      setSearchValue('')
      fetchCodes('', initialFilter.toUpperCase())
      return
    }

    fetchCodes(searchValue, letterFilter)
  }, [open, searchValue, letterFilter, initialFilter, hasAppliedInitial])

  // Reset the flag when modal closes so next open reapplies if needed.
  useEffect(() => {
    if (!open) {
      setHasAppliedInitial(false)
    }
  }, [open])

  const clearFilters = () => {
    setLetterFilter('')
    setSearchValue('')
    fetchCodes('', '')
  }

  // Alphabet for quick filter chips
  const alphabet = 'ABCEFGHJMPRTUVXY'.split('')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Select Dental Code</DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 px-4 pt-4">
          {alphabet.map((ltr) => (
            <Badge
              key={ltr}
              variant={ltr === letterFilter ? 'default' : 'secondary'}
              className="cursor-pointer"
              onClick={() => {
                setLetterFilter(ltr === letterFilter ? '' : ltr)
                setSearchValue('')
              }}
            >
              {ltr}
            </Badge>
          ))}
          {letterFilter && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filter
            </Button>
          )}
        </div>

        {/* Search + List */}
        <div className="flex-1 p-4">
          <Command className="h-full">
            <CommandInput
              placeholder="Search by code or description..."
              value={searchValue}
              onValueChange={(val) => {
                setSearchValue(val)
                fetchCodes(val, '') // override letter filter when typing
              }}
            />
            <CommandEmpty>No dental codes found.</CommandEmpty>
            <CommandList className="overflow-y-auto min-h-[560px]">
              <CommandGroup heading={letterFilter || searchValue ? 'Results' : 'All Codes'}>
                {codes.map((code) => (
                  <CommandItem
                    key={code.id}
                    value={`${code.code} ${code.description}`}
                    onSelect={() => {
                      onSelect(code)
                      onOpenChange(false)
                    }}
                  >
                    <Check className="mr-2 h-4 w-4 opacity-0" />
                    <div className="flex flex-col">
                      <span className="font-medium">{code.code}</span>
                      <span className="text-sm text-gray-500 truncate max-w-[400px]">
                        {code.description}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>

        <DialogFooter className="p-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 