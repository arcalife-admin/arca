'use client'

import { Suspense } from 'react'
import DigitalPatientIntakeWizard from '@/components/patients/intake/DigitalPatientIntakeWizard'

function DigitalIntakeContent() {
  return <DigitalPatientIntakeWizard flow="digital" />
}

export default function DigitalIntakePage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">Loading...</div>}>
      <DigitalIntakeContent />
    </Suspense>
  )
}
