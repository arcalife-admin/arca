'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  printPatientCard,
  type PatientCardImage,
  type PatientCardPatient,
  type PatientCardProcedure,
  type PatientCardSection,
} from '@/lib/patient-card/print'

const DEFAULT_SECTIONS: PatientCardSection[] = [
  'patientInfo',
  'historyTreatments',
  'currentTreatments',
  'planTreatments',
  'beforeAfterImages',
]

export default function PrintPatientCardPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientId = params.id as string
  const hasPrinted = useRef(false)

  const includedSections: PatientCardSection[] = useMemo(() => {
    const sectionsParam = searchParams.get('sections')
    if (!sectionsParam) return [...DEFAULT_SECTIONS]
    return sectionsParam.split(',').filter(Boolean) as PatientCardSection[]
  }, [searchParams])

  const [patient, setPatient] = useState<PatientCardPatient | null>(null)
  const [procedures, setProcedures] = useState<PatientCardProcedure[]>([])
  const [images, setImages] = useState<PatientCardImage[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientRes, procRes, imgRes] = await Promise.all([
          fetch(`/api/patients/${patientId}`),
          fetch(`/api/patients/${patientId}/surgical-procedures`),
          fetch(`/api/patients/${patientId}/images`),
        ])

        if (patientRes.ok) setPatient(await patientRes.json())
        if (procRes.ok) setProcedures(await procRes.json())
        if (imgRes.ok) setImages(await imgRes.json())
      } catch (err) {
        console.error('Failed to load print data', err)
        setError('Încărcarea datelor pentru tipărire a eșuat')
      }
    }
    fetchData()
  }, [patientId])

  useEffect(() => {
    if (!patient || hasPrinted.current) return

    hasPrinted.current = true
    printPatientCard({
      patient,
      procedures,
      images,
      includedSections,
    })
  }, [patient, procedures, images, includedSections])

  return (
    <div className="p-4 flex flex-col items-center">
      <p>{error || 'Se deschide dialogul de tipărire…'}</p>
      <Button variant="outline" size="sm" onClick={() => router.back()} className="mt-2">
        Înapoi
      </Button>
    </div>
  )
}
