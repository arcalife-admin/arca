'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Pill } from 'lucide-react'
import MedicationCard, { ClinicMedicationResult } from '@/components/pharma/MedicationCard'
import { appAlert } from '@/lib/app-alert'

export default function PharmaGuidePage() {
  const { data: session } = useSession()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ClinicMedicationResult[]>([])
  const [loading, setLoading] = useState(false)
  const [isManager, setIsManager] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const runSearch = useCallback(async (searchQuery: string) => {
    setLoading(true)
    setHasSearched(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('q', searchQuery.trim())
      const res = await fetch(`/api/medications?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setResults(data.results ?? [])
      setIsManager(Boolean(data.isManager))
    } catch (error) {
      console.error('Medication search failed:', error)
      appAlert('Căutarea a eșuat. Verificați conexiunea sau reîncercați.', { title: 'Eroare' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    runSearch('')
  }, [runSearch])

  const handleSearch = () => runSearch(query)

  const handleStockUpdated = (updated: ClinicMedicationResult) => {
    setResults((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <Pill className="h-7 w-7 text-red-500" />
          <h1 className="text-2xl font-bold">Ghid Medicamente Clinică</h1>
        </div>
        <p className="text-muted-foreground">
          Căutați medicamentele din stocul clinicii, vedeți instrucțiuni și documentație oficială.
          {session?.user?.role === 'MANAGER' || session?.user?.role === 'ORGANIZATION_OWNER' ? (
            <span> Ca manager, puteți actualiza stocul din fiecare locație.</span>
          ) : null}
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch()
            }}
            placeholder="Căutați medicament (ex: Propofol, Midazolam, Paracetamol)..."
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? 'Se caută...' : 'Caută'}
        </Button>
      </div>

      {hasSearched && !loading && (
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="secondary">{results.length} medicamente</Badge>
          {isManager && <Badge className="bg-emerald-100 text-emerald-800">Vizualizare manager</Badge>}
        </div>
      )}

      {loading && <p className="text-muted-foreground">Se încarcă medicamentele...</p>}

      {!loading && results.length === 0 && hasSearched && (
        <p className="text-muted-foreground">Niciun medicament găsit pentru căutarea curentă.</p>
      )}

      <div className="space-y-4">
        {results.map((medication) => (
          <MedicationCard
            key={medication.id}
            medication={medication}
            isManager={isManager}
            onStockUpdated={handleStockUpdated}
          />
        ))}
      </div>
    </div>
  )
}
