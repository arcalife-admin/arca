'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, ShieldCheck, ShieldOff } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

type SetupData = {
  secret: string
  otpauthUrl: string
  qrDataUrl?: string
}

type MfaStatus = {
  enabled: boolean
  pendingSetup: boolean
  isPrivileged: boolean
  pendingSetupData?: SetupData | null
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text()
  try {
    return text ? JSON.parse(text) : ({} as T)
  } catch {
    return {} as T
  }
}

export default function MfaSettings() {
  const [status, setStatus] = useState<MfaStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [setupData, setSetupData] = useState<SetupData | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/mfa/status')
      if (res.ok) {
        const data: MfaStatus = await res.json()
        setStatus(data)
        if (data.pendingSetupData && !data.enabled) {
          setSetupData(data.pendingSetupData)
        }
      }
    } catch {
      toast({ title: 'Eroare', description: 'Nu s-a putut încărca starea MFA', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  const startSetup = async (reset = false) => {
    setBusy(true)
    try {
      const res = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset }),
      })
      const data = await parseJsonResponse<{
        error?: string
        secret?: string
        otpauthUrl?: string
        qrDataUrl?: string
      }>(res)

      if (!res.ok) {
        toast({
          title: 'Eroare',
          description: data.error ?? `Configurare eșuată (${res.status})`,
          variant: 'destructive',
        })
        return
      }

      if (!data.secret) {
        toast({
          title: 'Eroare',
          description: 'Răspuns invalid de la server',
          variant: 'destructive',
        })
        return
      }

      setSetupData({
        secret: data.secret,
        otpauthUrl: data.otpauthUrl ?? '',
        qrDataUrl: data.qrDataUrl,
      })
      setCode('')
      await loadStatus()
      toast({
        title: reset ? 'Configurare nouă' : 'Pasul 1',
        description: reset
          ? 'Ștergeți intrarea veche din Authenticator, apoi scanați noul cod QR'
          : 'Scanați codul QR cu Google Authenticator (recomandat)',
      })
    } catch {
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut contacta serverul',
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  const cancelSetup = async () => {
    setBusy(true)
    try {
      await fetch('/api/auth/mfa/reset', { method: 'POST' })
      setSetupData(null)
      setCode('')
      await loadStatus()
    } finally {
      setBusy(false)
    }
  }

  const enableMfa = async () => {
    if (!/^\d{6}$/.test(code.trim())) {
      toast({ title: 'Cod invalid', description: 'Introduceți cele 6 cifre din aplicație', variant: 'destructive' })
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/auth/mfa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await parseJsonResponse<{ error?: string }>(res)
      if (!res.ok) {
        toast({ title: 'Eroare', description: data.error ?? 'Activare eșuată', variant: 'destructive' })
        return
      }
      setSetupData(null)
      setCode('')
      await loadStatus()
      toast({ title: 'MFA activat', description: 'Autentificarea în doi pași este activă' })
    } finally {
      setBusy(false)
    }
  }

  const disableMfa = async () => {
    if (!/^\d{6}$/.test(code.trim())) {
      toast({ title: 'Cod invalid', description: 'Introduceți codul MFA curent', variant: 'destructive' })
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await parseJsonResponse<{ error?: string }>(res)
      if (!res.ok) {
        toast({ title: 'Eroare', description: data.error ?? 'Dezactivare eșuată', variant: 'destructive' })
        return
      }
      setCode('')
      await loadStatus()
      toast({ title: 'MFA dezactivat' })
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <Card className="mt-8">
        <CardContent className="py-8 text-center text-gray-500">Se încarcă setările MFA...</CardContent>
      </Card>
    )
  }

  if (!status?.isPrivileged) {
    return null
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {status.enabled ? (
            <ShieldCheck className="h-5 w-5 text-green-600" />
          ) : (
            <Shield className="h-5 w-5 text-amber-600" />
          )}
          Autentificare în doi pași (MFA)
        </CardTitle>
        <p className="text-sm text-gray-600">
          Obligatoriu pentru Manager și Proprietar organizație. Adresa de e-mail din cont nu contează — folosiți
          Google Authenticator sau Authy.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          Status:{' '}
          <span className={status.enabled ? 'text-green-700 font-medium' : 'text-amber-700 font-medium'}>
            {status.enabled ? 'Activat' : status.pendingSetup ? 'Configurare în curs' : 'Neactivat'}
          </span>
        </div>

        {!status.enabled && !setupData && (
          <Button onClick={() => startSetup(false)} disabled={busy}>
            Configurează MFA
          </Button>
        )}

        {setupData && !status.enabled && (
          <div className="space-y-4 rounded-lg border bg-gray-50 p-4">
            <p className="text-sm font-medium">Pasul 1 — Scanați codul QR (recomandat)</p>
            {setupData.qrDataUrl && (
              <div className="flex justify-center">
                <img
                  src={setupData.qrDataUrl}
                  alt="Cod QR MFA"
                  width={200}
                  height={200}
                  className="rounded border bg-white p-2"
                />
              </div>
            )}
            <p className="text-xs text-gray-500 text-center">
              Google Authenticator → + → Scanați cod QR
            </p>

            <details className="text-xs text-gray-600">
              <summary className="cursor-pointer font-medium">Introducere manuală (dacă QR nu funcționează)</summary>
              <p className="mt-2 break-all">
                Cheie: <code className="bg-white px-1 py-0.5 rounded">{setupData.secret}</code>
              </p>
              <p className="mt-1 text-gray-500">
                Tip: <strong>Timp</strong> (TOTP), nu contor. Nume cont: ArcaLife
              </p>
            </details>

            <div className="space-y-2">
              <Label htmlFor="mfa-enable-code">Pasul 2 — Cod din aplicație (6 cifre)</Label>
              <Input
                id="mfa-enable-code"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={enableMfa} disabled={busy}>
                Activează MFA
              </Button>
              <Button variant="outline" onClick={() => startSetup(true)} disabled={busy}>
                Regenerează QR
              </Button>
              <Button variant="outline" onClick={cancelSetup} disabled={busy}>
                Anulează
              </Button>
            </div>
          </div>
        )}

        {status.enabled && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              La autentificare vi se va cere parola și codul din aplicația de autentificare.
            </p>
            <div className="space-y-2">
              <Label htmlFor="mfa-disable-code">Cod MFA pentru dezactivare</Label>
              <Input
                id="mfa-disable-code"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
              />
            </div>
            <Button variant="destructive" onClick={disableMfa} disabled={busy} className="gap-2">
              <ShieldOff className="h-4 w-4" />
              Dezactivează MFA
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
