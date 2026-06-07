'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Printer,
  Refrigerator,
  Save,
} from 'lucide-react'
import {
  printMedicationInstructions,
  printMedicationPrescription,
} from '@/lib/medications/print'
import { useToast } from '@/hooks/use-toast'
import { buildMedicationDocumentationLinks } from '@/lib/medications/documentation-urls'

export interface ClinicMedicationResult {
  id: string
  name: string
  aliases: string[]
  requiresFridge: boolean
  form?: string | null
  activeIngredient?: string | null
  usageInstructions?: string | null
  prescriptionTemplate?: string | null
  documentationUrl?: string | null
  notes?: string | null
  stockFarmacia?: number
  stockEtaj1?: number
  stockEtaj2?: number
  stockEtaj3?: number
  totalStock?: number
}

interface MedicationCardProps {
  medication: ClinicMedicationResult
  isManager: boolean
  defaultExpanded?: boolean
  onStockUpdated?: (medication: ClinicMedicationResult) => void
}

export default function MedicationCard({
  medication,
  isManager,
  defaultExpanded = false,
  onStockUpdated,
}: MedicationCardProps) {
  const { toast } = useToast()
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [savingStock, setSavingStock] = useState(false)
  const [stock, setStock] = useState({
    stockFarmacia: medication.stockFarmacia ?? 0,
    stockEtaj1: medication.stockEtaj1 ?? 0,
    stockEtaj2: medication.stockEtaj2 ?? 0,
    stockEtaj3: medication.stockEtaj3 ?? 0,
  })

  const documentationLinks = buildMedicationDocumentationLinks({
    commercialName: medication.name,
  })

  useEffect(() => {
    setStock({
      stockFarmacia: medication.stockFarmacia ?? 0,
      stockEtaj1: medication.stockEtaj1 ?? 0,
      stockEtaj2: medication.stockEtaj2 ?? 0,
      stockEtaj3: medication.stockEtaj3 ?? 0,
    })
  }, [medication])

  const handleSaveStock = async () => {
    setSavingStock(true)
    try {
      const res = await fetch(`/api/medications/${medication.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stock),
      })
      if (!res.ok) throw new Error('Update failed')
      const data = await res.json()
      onStockUpdated?.(data.medication)
      toast({ title: 'Stoc actualizat', description: medication.name })
    } catch {
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut actualiza stocul.',
        variant: 'destructive',
      })
    } finally {
      setSavingStock(false)
    }
  }

  const totalStock =
    medication.totalStock ??
    stock.stockFarmacia + stock.stockEtaj1 + stock.stockEtaj2 + stock.stockEtaj3

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg">{medication.name}</CardTitle>
              {medication.requiresFridge && (
                <Badge variant="secondary" className="gap-1">
                  <Refrigerator className="h-3 w-3" />
                  Frigider
                </Badge>
              )}
              {medication.form && <Badge variant="outline">{medication.form}</Badge>}
            </div>
            {medication.activeIngredient && (
              <p className="text-sm text-muted-foreground">
                Substanță activă: {medication.activeIngredient}
              </p>
            )}
            {isManager && (
              <p className="text-sm font-medium text-emerald-700">
                Stoc total: {totalStock} unități
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => printMedicationInstructions(medication)}
            >
              <Printer className="mr-1 h-4 w-4" />
              Tipărește instrucțiuni
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => printMedicationPrescription(medication)}
            >
              <FileText className="mr-1 h-4 w-4" />
              Tipărește rețeta
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="mr-1 h-4 w-4" />
                  Ascunde
                </>
              ) : (
                <>
                  <ChevronDown className="mr-1 h-4 w-4" />
                  Detalii
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-6 border-t pt-4">
          <div>
            <h3 className="mb-2 font-semibold">Instrucțiuni de utilizare</h3>
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              {medication.usageInstructions || 'Instrucțiuni indisponibile.'}
            </p>
          </div>

          <div>
            <h3 className="mb-2 font-semibold">Documentație oficială (ANMDMR)</h3>
            <p className="mb-3 text-sm text-muted-foreground">
              Prospectul și RCP sunt publicate în nomenclatorul oficial al Agenției Naționale
              a Medicamentului din România. Apăsați <strong>Detalii</strong> pe medicamentul
              găsit pentru a descărca documentele.
            </p>
            <Button asChild size="sm" variant="outline">
              <a href={documentationLinks.anmdmr} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1 h-4 w-4" />
                Deschide nomenclatorul ANMDMR
              </a>
            </Button>
          </div>

          {isManager && (
            <div>
              <h3 className="mb-3 font-semibold">Stoc depozit (doar manager)</h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  ['stockFarmacia', 'Farmacie'],
                  ['stockEtaj1', 'Etaj 1'],
                  ['stockEtaj2', 'Etaj 2'],
                  ['stockEtaj3', 'Etaj 3'],
                ].map(([key, label]) => (
                  <div key={key} className="space-y-1">
                    <Label htmlFor={`${medication.id}-${key}`}>{label}</Label>
                    <Input
                      id={`${medication.id}-${key}`}
                      type="number"
                      min={0}
                      value={stock[key as keyof typeof stock]}
                      onChange={(e) =>
                        setStock((prev) => ({
                          ...prev,
                          [key]: Number(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
              <Button
                type="button"
                className="mt-4"
                size="sm"
                onClick={handleSaveStock}
                disabled={savingStock}
              >
                <Save className="mr-1 h-4 w-4" />
                {savingStock ? 'Se salvează...' : 'Salvează stocul'}
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
