'use client'

import { useState } from 'react'
import EmbeddedLink from '@/components/layout/EmbeddedLink'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Printer, ArrowRight } from 'lucide-react'
import { INTAKE_DOCUMENT_LIST } from '@/lib/intake/documents'
import { appAlert } from '@/lib/app-alert'

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

function printPdfBlob(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none'
  iframe.src = url
  document.body.appendChild(iframe)

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => {
        document.body.removeChild(iframe)
        URL.revokeObjectURL(url)
      }, 1000)
    }, 250)
  }
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
      appAlert('Could not download intake pack', { title: 'Error' })
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
      appAlert('Could not prepare intake pack for printing', { title: 'Error' })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Print intake pack</h1>
        <p className="mt-1 text-sm text-gray-500">
          Download or print all forms for the patient to fill on paper. No patient record exists until you complete data entry afterward.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Included documents</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-2 text-gray-700">
            <li>Generated: Basic information questionnaire</li>
            <li>Generated: Health assessment questionnaire</li>
            {INTAKE_DOCUMENT_LIST.map((doc) => (
              <li key={doc.id}>{doc.title}</li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={downloadBundle} disabled={downloading} className="gap-2">
              <Download className="h-4 w-4" />
              {downloading ? 'Preparing...' : 'Download merged PDF'}
            </Button>
            <Button variant="outline" onClick={printBundle} disabled={downloading} className="gap-2">
              <Printer className="h-4 w-4" />
              Download & print
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50/40">
        <CardContent className="p-6">
          <p className="text-sm text-gray-700 mb-4">
            After the patient has filled the forms, continue to enter their information into the system.
          </p>
          <Button asChild className="gap-2">
            <EmbeddedLink href="/dashboard/patients/new/manual/enter">
              Continue to data entry
              <ArrowRight className="h-4 w-4" />
            </EmbeddedLink>
          </Button>
        </CardContent>
      </Card>

      <Button variant="ghost" asChild>
        <EmbeddedLink href="/dashboard/patients/new">Back to flow selection</EmbeddedLink>
      </Button>
    </div>
  )
}
