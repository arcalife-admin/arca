'use client'

import { useState } from 'react'
import EmbeddedLink from '@/components/layout/EmbeddedLink'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Printer, ArrowRight } from 'lucide-react'
import { INTAKE_DOCUMENT_LIST } from '@/lib/intake/documents'
import { appAlert } from '@/lib/app-alert'
import { printPdfBlob } from '@/lib/print-html'

async function fetchIntakePackBlob(): Promise<Blob> {
  const res = await fetch('/api/patients/intake/print-bundle')
  if (!res.ok) throw new Error('Download failed')
  return res.blob()
}

function downloadPdfBlob(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'intake-pack.pdf'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function ManualPrintPage() {
  const [downloading, setDownloading] = useState(false)

  const downloadBundle = async () => {
    setDownloading(true)
    try {
      const blob = await fetchIntakePackBlob()
      downloadPdfBlob(blob)
    } catch (e) {
      console.error(e)
      appAlert('Pachetul de înregistrare nu a putut fi descărcat', { title: 'Eroare' })
    } finally {
      setDownloading(false)
    }
  }

  const printBundle = async () => {
    setDownloading(true)
    try {
      const blob = await fetchIntakePackBlob()
      downloadPdfBlob(blob)
      printPdfBlob(blob)
    } catch (e) {
      console.error(e)
      appAlert('Pachetul de înregistrare nu a putut fi pregătit pentru tipărire', { title: 'Eroare' })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Tipărire pachet înregistrare</h1>
        <p className="mt-1 text-sm text-gray-500">
          Descărcați sau tipăriți toate formularele pe care pacientul le completează pe hârtie. Fișa pacientului nu există până la introducerea datelor.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Documente incluse</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-2 text-gray-700">
            <li>Generat: Chestionar informații de bază</li>
            <li>Generat: Chestionar evaluare sănătate</li>
            {INTAKE_DOCUMENT_LIST.map((doc) => (
              <li key={doc.id}>{doc.title}</li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={downloadBundle} disabled={downloading} className="gap-2">
              <Download className="h-4 w-4" />
              {downloading ? 'Se pregătește...' : 'Descarcă PDF combinat'}
            </Button>
            <Button variant="outline" onClick={printBundle} disabled={downloading} className="gap-2">
              <Printer className="h-4 w-4" />
              Descarcă și tipărește
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50/40">
        <CardContent className="p-6">
          <p className="text-sm text-gray-700 mb-4">
            După ce pacientul a completat formularele, continuați cu introducerea informațiilor în sistem.
          </p>
          <Button asChild className="gap-2">
            <EmbeddedLink href="/dashboard/patients/new/manual/enter">
              Continuă la introducerea datelor
              <ArrowRight className="h-4 w-4" />
            </EmbeddedLink>
          </Button>
        </CardContent>
      </Card>

      <Button variant="ghost" asChild>
        <EmbeddedLink href="/dashboard/patients/new">Înapoi la selectarea fluxului</EmbeddedLink>
      </Button>
    </div>
  )
}
