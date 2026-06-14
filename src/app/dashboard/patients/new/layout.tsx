'use client'

import { Suspense } from 'react'

export default function NewPatientIntakeLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<>{children}</>}>{children}</Suspense>
}
