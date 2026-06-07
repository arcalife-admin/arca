'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Legacy route — redirects to unified new patient intake. */
export default function PatientFormsRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard/patients/new')
  }, [router])
  return (
    <div className="p-8 text-sm text-gray-500">Redirecționare către înregistrarea pacientului nou...</div>
  )
}
