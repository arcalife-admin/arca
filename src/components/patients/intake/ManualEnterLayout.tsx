'use client'

import React, { useState } from 'react'
import EmbeddedLink from '@/components/layout/EmbeddedLink'
import DigitalPatientIntakeWizard from './DigitalPatientIntakeWizard'
import ScanPreviewPanel, { type ScanDraftFile } from './ScanPreviewPanel'
import { Button } from '@/components/ui/button'

export default function ManualEnterLayout() {
  const [scans, setScans] = useState<ScanDraftFile[]>([])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Introducere date din formulare pe hârtie</h1>
          <p className="text-sm text-gray-500">
            Previzualizare opțională a scanărilor în stânga; completați toți pașii în dreapta. Pacientul este creat la finalizare.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <EmbeddedLink href="/dashboard/patients/new">Schimbă fluxul</EmbeddedLink>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-2 min-h-[400px]">
          <ScanPreviewPanel scans={scans} onScansChange={setScans} />
        </div>
        <div className="lg:col-span-3">
          <DigitalPatientIntakeWizard flow="manual" scans={scans} compact />
        </div>
      </div>
    </div>
  )
}
