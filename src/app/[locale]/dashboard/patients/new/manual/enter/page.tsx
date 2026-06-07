'use client'

import { Suspense } from 'react'
import ManualEnterLayout from '@/components/patients/intake/ManualEnterLayout'

export default function ManualEnterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">Se încarcă...</div>}>
      <ManualEnterLayout />
    </Suspense>
  )
}
