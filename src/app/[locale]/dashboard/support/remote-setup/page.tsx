'use client'

import Link from 'next/link'
import { ArrowLeft, Monitor, Printer, Shield, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ANYDESK_DOWNLOAD_URL } from '@/lib/support-config'

export default function RemoteSetupPage() {
  return (
    <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 space-y-6 print:py-4">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/support/faq">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Întrebări frecvente
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-2" />
          Tipărește
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Ghid acces la distanță</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Arca Life — clinică România / suport tehnic (Olanda)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Monitor className="w-5 h-5" />
            1. Instalare AnyDesk
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <Button asChild className="print:hidden">
            <a href={ANYDESK_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer">
              <Download className="w-4 h-4 mr-2" />
              Descarcă AnyDesk
            </a>
          </Button>
          <p className="text-muted-foreground print:block hidden">{ANYDESK_DOWNLOAD_URL}</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Descarcă AnyDesk de pe{' '}
              <a
                href={ANYDESK_DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                anydesk.com
              </a>
            </li>
            <li>Instalează pe PC-ul desemnat pentru suport</li>
            <li>Notează AnyDesk ID (9 cifre) pe etichetă lângă monitor</li>
            <li>
              Opțional: setează parolă unattended doar dacă suportul tehnic a aprobat
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2. Când este nevoie de ajutor</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <ol className="list-decimal list-inside space-y-2">
            <li>Deschide AnyDesk</li>
            <li>Trimite ID-ul pe WhatsApp suportului</li>
            <li>Rămâi la calculator până la final</li>
            <li>Confirmă verbal înainte de a accepta conexiunea</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5" />
            3. Reguli de securitate
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <ul className="list-disc list-inside space-y-2">
            <li>
              Accesul la distanță doar cu aprobarea suportului tehnic
            </li>
            <li>
              Nu partaja ID-ul AnyDesk public
            </li>
            <li>
              Preferă acces asistat (personal prezent)
            </li>
            <li>
              Un singur PC desemnat pentru suport, dacă posibil
            </li>
            <li>
              Datele pacienților sunt confidențiale (GDPR)
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">4. Alternative</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            <strong>RustDesk</strong> — alternativă open-source; contactează suportul pentru configurare
          </p>
          <p>
            <strong>Windows Quick Assist</strong> — fără instalare, sesiune temporară (Windows 10/11)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">5. Inventar PC-uri</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-4">Locație</th>
                  <th className="py-2 pr-4">AnyDesk ID</th>
                  <th className="py-2">Notițe</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 pr-4 text-muted-foreground">Recepție</td>
                  <td className="py-3 pr-4">___________</td>
                  <td className="py-3">___________</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 pr-4 text-muted-foreground">Cabinet 1</td>
                  <td className="py-3 pr-4">___________</td>
                  <td className="py-3">___________</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 text-muted-foreground">Cabinet 2</td>
                  <td className="py-3 pr-4">___________</td>
                  <td className="py-3">___________</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
