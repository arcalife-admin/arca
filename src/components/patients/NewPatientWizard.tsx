'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** @deprecated Use DigitalPatientIntakeWizard at /dashboard/patients/new/digital */
export default function NewPatientWizard() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard/patients/new/digital')
  }, [router])
  return <div className="p-8 text-sm text-gray-500">Redirecționare către intake digital...</div>
}
