'use client'

import EmbeddedLink from '@/components/layout/EmbeddedLink'
import { Printer, Tablet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function PatientIntakeFlowChooser() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Pacient nou</h1>
        <p className="mt-1 text-sm text-gray-500">
          Alegeți modul de înregistrare a unui pacient nou. Acest portal este destinat personalului clinicii; pacienții pot folosi tableta oferită de recepție.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EmbeddedLink href="/dashboard/patients/new/manual/print" className="block group">
          <Card className="h-full transition-shadow hover:shadow-md border-2 hover:border-blue-200">
            <CardContent className="p-8 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100">
                <Printer className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Flux manual</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Tipăriți pachetul complet de înregistrare pentru ca pacientul să îl completeze pe hârtie. Apoi introduceți datele în sistem, consultând formularele.
                </p>
              </div>
            </CardContent>
          </Card>
        </EmbeddedLink>

        <EmbeddedLink href="/dashboard/patients/new/digital" className="block group">
          <Card className="h-full transition-shadow hover:shadow-md border-2 hover:border-blue-200">
            <CardContent className="p-8 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100">
                <Tablet className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Flux digital</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Recepționistul sau pacientul pe tableta clinicii completează online datele de bază, chestionarul medical și documentele de consimțământ.
                </p>
              </div>
            </CardContent>
          </Card>
        </EmbeddedLink>
      </div>
    </div>
  )
}
